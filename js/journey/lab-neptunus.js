/**
 * Chapter 01 — Neptunus Power: Industrial Intelligence laboratory.
 *   EngineTwin        stylized marine-engine schematic, 5 selectable sensors, live (synthetic) scope channels
 *   IngestStage       11,312 sensor points → async chunk engine → 114 bulk requests (replayable)
 *   MonitorStage      heartbeat-recency state machine across a small illustrative fleet
 *   RagStage          evidence flow: sources → dense / keyword retrieval → rule validation → grounded answer
 *   ReliabilityStage  failure injection: validation, retry with exponential backoff, dead-letter, recovery
 *
 * Documented facts used: 11,312 → 114 requests, 36 validated KnowledgeObjects, four recency states with
 * thresholds (<5m, 5–15m, 15–60m, >60m), Pydantic validation, exponential backoff, dead-letter buffering,
 * hybrid dense + BM25 retrieval, rule validation against engineering limits. Everything else on screen is
 * labelled as illustrative.
 */
(() => {
    'use strict';
    const K = window.JKit;
    if (!K) return;

    /* =====================================================================
       DATA
       ===================================================================== */
    const SENSORS = [
        {
            id: 'rpm', code: 'CH-01', name: 'Engine speed', short: 'RPM', unit: 'rpm', x: 134, y: 122, color: [86, 214, 236],
            desc: 'Crankshaft speed from a pickup on the flywheel ring gear. It defines the operating point every other channel is read against.',
            feeds: ['Operational efficiency loss', 'Abnormal sensor drift']
        },
        {
            id: 'exhaust', code: 'CH-02', name: 'Exhaust temperature', short: 'EGT', unit: '°C', x: 498, y: 64, color: [255, 176, 72],
            desc: 'Exhaust-gas temperature at the manifold ahead of the turbocharger. A slow rise at steady load is an early sign of combustion or turbocharger degradation.',
            feeds: ['Thermal degradation trend']
        },
        {
            id: 'lube', code: 'CH-03', name: 'Lubricating pressure', short: 'LUBE', unit: 'bar', x: 420, y: 246, color: [94, 234, 212],
            desc: 'Main oil-gallery pressure. Falling pressure at a given speed points to filter restriction, pump wear or leakage.',
            feeds: ['Abnormal sensor drift', 'Rule-based limit checks']
        },
        {
            id: 'power', code: 'CH-04', name: 'Power output', short: 'kW', unit: 'kW', x: 68, y: 144, color: [147, 197, 253],
            desc: 'Electrical output at the generator terminals. Read together with speed, it exposes efficiency loss over time.',
            feeds: ['Operational efficiency loss']
        },
        {
            id: 'health', code: 'CH-05', name: 'Health indicators', short: 'HEALTH', unit: 'state', x: 245, y: 231, color: [134, 239, 172],
            desc: 'Controller status flags plus the heartbeat of the asset itself. Heartbeat recency is the input to automated monitoring (Stage 02).',
            feeds: ['Recency state · Stage 02']
        }
    ];
    const GW = { x: 584, y: 244 };

    const RAG_QUESTIONS = [
        {
            id: 'egt',
            q: 'Exhaust temperature on one cylinder keeps rising while load is steady. What should be checked first?',
            dense: [['OEM manual — exhaust temperature deviation', 0.82], ['Knowledge object — rising EGT at constant load', 0.79], ['OEM manual — turbocharger inspection', 0.61]],
            keyword: [['Tolerance table — exhaust temp. spread between cylinders', 'exhaust · cylinder'], ['OEM manual — exhaust temperature deviation', 'exhaust · temperature']],
            trend: 'Cylinder exhaust temperature trending upward over several hours at steady kW (synthetic trend).',
            checks: ['Advice stays within documented OEM tolerances', 'Every statement cites a retrieved source', 'Telemetry trend attached as evidence'],
            answer: [
                ['Exhaust temperature on the affected cylinder is rising while power output is steady', 3],
                ['The OEM troubleshooting guidance lists fuel-injector condition and charge-air supply as first checks for a single-cylinder deviation', 1],
                ['Compare the spread against the manufacturer tolerance table before escalating', 2]
            ],
            kos: [3, 11, 17, 28]
        },
        {
            id: 'lube',
            q: 'Lube oil pressure is lower than usual at idle. Is it still within limits?',
            dense: [['Knowledge object — gradual lube-pressure decay', 0.84], ['OEM manual — lubrication system', 0.77], ['OEM manual — oil filter service', 0.58]],
            keyword: [['Tolerance table — minimum oil pressure vs. speed', 'oil · pressure · idle'], ['OEM manual — lubrication system', 'lube · pressure']],
            trend: 'Gallery pressure drifting down at constant speed across recent runs (synthetic trend).',
            checks: ['Limit taken from the speed-dependent tolerance table', 'No recommendation beyond documented limits', 'Every statement cites a retrieved source'],
            answer: [
                ['Oil pressure must be judged against the speed-dependent minimum in the tolerance table, not a single fixed threshold', 2],
                ['The recent trend shows pressure falling gradually at constant speed', 3],
                ['The OEM manual associates that pattern with filter restriction or pump wear', 1]
            ],
            kos: [5, 9, 22, 31]
        },
        {
            id: 'code',
            q: 'What does fault code F-1172 on the engine controller mean?',
            dense: [['OEM manual — controller alarms overview', 0.66], ['Knowledge object — sensor dropout pattern', 0.52], ['OEM manual — wiring diagnostics', 0.49]],
            keyword: [['Controller fault-code table — F-1172', 'F-1172 (exact)'], ['OEM manual — controller alarms overview', 'fault · code']],
            trend: 'No abnormal trend on related channels in the same window (synthetic trend).',
            checks: ['Exact code match required before answering', 'Every statement cites a retrieved source', 'Unknown codes are refused, not guessed'],
            answer: [
                ['F-1172 is listed in the controller fault-code table, which gives its meaning and the first response to take', 1],
                ['Related channels show no abnormal trend in the same window, which points to a sensor-side cause rather than an engine fault', 3]
            ],
            note: 'Why hybrid matters here: dense embeddings rank fault codes loosely, while BM25 matches “F-1172” exactly.',
            kos: [1, 14, 25]
        }
    ];

    const STATES = [
        { id: 'op', name: 'Operational', rule: '< 5 min', max: 5 },
        { id: 'warn', name: 'Transient Warning', rule: '5 – 15 min', max: 15 },
        { id: 'stale', name: 'Stale Telemetry', rule: '15 – 60 min', max: 60 },
        { id: 'off', name: 'Offline', rule: '> 60 min', max: Infinity }
    ];
    const stateOf = (age) => STATES.findIndex((s) => age < s.max);

    /* =====================================================================
       ENGINE SCHEMATIC (SVG)
       ===================================================================== */
    function engineSVG() {
        const cyl = [];
        for (let i = 0; i < 6; i++) {
            const cx = 184 + i * 56.6;
            cyl.push(`
                <rect class="e-fine" x="${cx - 20}" y="127" width="40" height="72" rx="2"/>
                <rect class="e-piston" x="${cx - 16}" y="150" width="32" height="20" rx="2" style="--d:${(i % 2) * -0.6 - i * 0.13}s"/>
                <rect class="e-part" x="${cx - 25}" y="99" width="50" height="21" rx="2"/>
                <rect class="e-part" x="${cx - 21}" y="87" width="42" height="12" rx="5"/>
                <rect class="e-part" x="${cx + 21}" y="71" width="7" height="31" rx="2"/>
                <text class="e-label e-label--cyl" x="${cx}" y="196">${i + 1}</text>`);
        }
        const fins = [];
        for (let x = 30; x <= 102; x += 9) fins.push(`<line class="e-fine" x1="${x}" y1="168" x2="${x}" y2="262"/>`);
        const ticks = [];
        for (let y = 140; y <= 274; y += 9) ticks.push(`<line class="e-fine" x1="124" y1="${y}" x2="128" y2="${y}"/>`);

        const route = (s) => {
            if (s.y < 160) return `M${s.x} ${s.y} V22 H604 V226`;
            return `M${s.x} ${s.y} V318 H${GW.x} V262`;
        };
        const cables = SENSORS.map((s) => `<path class="e-cable" data-sensor="${s.id}" d="${route(s)}"/>`).join('');
        const nodes = SENSORS.map((s) => `<circle class="e-sensor" data-sensor="${s.id}" cx="${s.x}" cy="${s.y}" r="4"/>`).join('');

        return `
        <svg class="nl-engine__svg" viewBox="0 0 640 340" role="img" aria-label="Stylized side elevation of an inline six-cylinder marine diesel generator set with sensor positions">
            <defs>
                <pattern id="nl-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                    <line x1="0" y1="0" x2="0" y2="6" class="e-hatch"/>
                </pattern>
                <linearGradient id="nl-steel" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stop-color="#1a2230"/><stop offset="1" stop-color="#0d1219"/>
                </linearGradient>
            </defs>
            <g class="e-cables">${cables}</g>
            <!-- bedplate -->
            <rect class="e-part" x="14" y="276" width="612" height="12" rx="2"/>
            <rect class="e-part" x="30" y="288" width="20" height="8"/><rect class="e-part" x="300" y="288" width="20" height="8"/><rect class="e-part" x="590" y="288" width="20" height="8"/>
            <!-- generator -->
            <rect class="e-part" x="18" y="152" width="96" height="124" rx="10"/>${fins.join('')}
            <rect class="e-part" x="50" y="136" width="36" height="16" rx="2"/>
            <text class="e-label" x="66" y="292">GEN</text>
            <!-- flywheel -->
            <path class="e-part" d="M116 148 h34 v128 h-34 z"/>
            <rect class="e-part e-fly" x="122" y="132" width="20" height="146" rx="10"/>${ticks.join('')}
            <!-- crankcase + sump -->
            <path class="e-part" d="M150 206 H500 L488 276 H162 Z"/>
            <path d="M160 254 H491 L488 276 H162 Z" fill="url(#nl-hatch)"/>
            <line class="e-dash" x1="176" y1="246" x2="480" y2="246"/>
            <path class="e-part" d="M200 276 H450 L440 304 H210 Z"/>
            <text class="e-label" x="325" y="298">SUMP</text>
            <!-- block, liners, pistons, heads -->
            <rect class="e-part" x="156" y="120" width="340" height="86" rx="3"/>
            ${cyl.join('')}
            <!-- exhaust manifold + turbo -->
            <rect class="e-part e-hot" x="168" y="56" width="340" height="16" rx="8"/>
            <path class="e-part e-hot" d="M500 58 C520 58 526 70 530 80 L522 86 C516 76 512 72 500 72 Z"/>
            <circle class="e-part" cx="552" cy="96" r="32"/>
            <g class="e-turbo"><circle class="e-fine" cx="552" cy="96" r="21"/><path class="e-fine" d="M552 75 A21 21 0 0 1 573 96 M552 117 A21 21 0 0 1 531 96 M531 96 A21 21 0 0 1 552 75"/><circle class="e-fine" cx="552" cy="96" r="6"/></g>
            <circle class="e-part" cx="598" cy="112" r="18"/>
            <rect class="e-part" x="540" y="14" width="18" height="52" rx="2"/>
            <rect class="e-part" x="584" y="134" width="40" height="26" rx="4"/>
            <text class="e-label" x="552" y="146">TC</text>
            <text class="e-label" x="338" y="50">EXHAUST MANIFOLD</text>
            <!-- controller -->
            <rect class="e-part e-ecu" x="214" y="216" width="62" height="30" rx="3"/>
            <circle class="e-led" cx="224" cy="238" r="2"/><circle class="e-led e-led--b" cx="232" cy="238" r="2"/>
            <text class="e-label" x="245" y="213">ECU</text>
            <!-- telemetry gateway -->
            <rect class="e-part e-gw" x="548" y="226" width="72" height="36" rx="4"/>
            <text class="e-label e-label--gw" x="584" y="241">GATEWAY</text>
            <text class="e-label" x="584" y="254">→ INGEST</text>
            <!-- dimensions -->
            <g class="e-dim"><line x1="156" y1="332" x2="496" y2="332"/><line x1="156" y1="326" x2="156" y2="338"/><line x1="496" y1="326" x2="496" y2="338"/></g>
            <text class="e-label e-label--dim" x="326" y="329">INLINE · 6 CYL</text>
            ${nodes}
        </svg>`;
    }

    /* =====================================================================
       ENGINE TWIN
       ===================================================================== */
    class EngineTwin {
        constructor(root, lab) {
            this.lab = root;
            this.owner = lab;
            this.sel = 'exhaust';
            this.hover = null;
            this.t = 0;
            this.buf = {};
            SENSORS.forEach((s) => { this.buf[s.id] = new Float32Array(180).fill(NaN); });

            const hotspots = SENSORS.map((s) => `
                <button type="button" class="nl-hot" data-sensor="${s.id}" style="left:${(s.x / 640) * 100}%;top:${(s.y / 340) * 100}%;--c:${s.color.join(',')}" aria-label="${s.name} sensor">
                    <span class="nl-hot__ring"></span><span class="nl-hot__tag">${s.short}</span>
                </button>`).join('');
            const rows = SENSORS.map((s) => `
                <button type="button" class="nl-ch" data-sensor="${s.id}" style="--c:${s.color.join(',')}" aria-pressed="false">
                    <span class="nl-ch__meta"><span class="nl-ch__code">${s.code}</span><span class="nl-ch__name">${s.name}</span><span class="nl-ch__unit">${s.unit}</span></span>
                    <canvas class="nl-ch__cv" aria-hidden="true"></canvas>
                </button>`).join('');

            this.el = K.h(`
            <div class="nl-twin">
                <div class="nl-twin__bar">
                    <span class="jr-label">Digital twin <i></i><span class="jr-label__x">Stylized marine generator set</span></span>
                    <span class="jr-tagnote">Synthetic signals · illustrative</span>
                </div>
                <div class="nl-twin__grid">
                    <div class="nl-engine">
                        <div class="nl-engine__frame">${engineSVG()}${hotspots}</div>
                    </div>
                    <div class="nl-scope">
                        <div class="nl-scope__head"><span class="jr-label">Telemetry channels</span><span class="nl-scope__hint">Select a channel or a sensor</span></div>
                        <div class="nl-scope__rows">${rows}</div>
                        <div class="nl-readout" aria-live="polite"></div>
                    </div>
                </div>
            </div>`);
            root.appendChild(this.el);

            this.rows = Array.from(this.el.querySelectorAll('.nl-ch'));
            this.cvs = new Map(this.rows.map((r) => [r.dataset.sensor, K.canvas(r.querySelector('canvas'))]));
            this.readout = this.el.querySelector('.nl-readout');

            this.el.addEventListener('click', (e) => {
                const b = e.target.closest('[data-sensor]');
                if (b && b.tagName === 'BUTTON') this.select(b.dataset.sensor);
                const f = e.target.closest('[data-follow]');
                if (f) this.owner.openStage('ingest', true);
            });
            this.el.addEventListener('pointerover', (e) => {
                if (e.pointerType !== 'mouse') return;
                const b = e.target.closest('button[data-sensor]');
                this.setHover(b ? b.dataset.sensor : null);
            });
            this.el.addEventListener('pointerleave', () => this.setHover(null));

            K.onResize(this.el, () => { this.cvs.forEach((c) => c.resize()); this.drawScopes(); });

            // prefill the scope buffers so channels are populated on first view
            for (let i = 0; i < 180; i++) this.sample(1 / 30);
            this.select(this.sel, true);
            this.drawScopes();
        }

        setHover(id) {
            this.hover = id;
            this.applyStates();
        }

        select(id, silent) {
            this.sel = id;
            this.applyStates();
            const s = SENSORS.find((x) => x.id === id);
            this.readout.innerHTML = `
                <div class="nl-readout__head"><span class="nl-readout__code" style="--c:${s.color.join(',')}">${s.code}</span><h4>${s.name}</h4><span class="nl-readout__unit">${s.unit}</span></div>
                <p>${s.desc}</p>
                <dl class="nl-readout__dl">
                    <div><dt>Feeds</dt><dd>${s.feeds.join(' · ')}</dd></div>
                </dl>
                <button type="button" class="jr-link" data-follow>Follow this channel into ingestion <span aria-hidden="true">→</span></button>`;
            if (!silent) this.owner.highlightChannel(id);
            if (K.reduced) this.drawScopes();
        }

        applyStates() {
            const focus = this.hover || this.sel;
            this.el.querySelectorAll('[data-sensor]').forEach((n) => {
                const id = n.dataset.sensor;
                n.classList.toggle('is-active', id === this.sel);
                n.classList.toggle('is-focus', id === focus);
                n.classList.toggle('is-dim', id !== focus && id !== this.sel);
                if (n.classList.contains('nl-ch')) n.setAttribute('aria-pressed', id === this.sel ? 'true' : 'false');
            });
        }

        // synthetic but physically plausible channel behaviour (normalized 0..1)
        sample(dt) {
            this.t += dt;
            const t = this.t;
            const n = () => (Math.random() - 0.5);
            const load = 0.5 + 0.12 * Math.sign(Math.sin(t * 0.32)) * (0.6 + 0.4 * Math.sin(t * 0.05));
            this.loadS = this.loadS == null ? load : this.loadS + (load - this.loadS) * Math.min(1, dt * 1.6);
            const L = this.loadS;
            const v = {
                rpm: 0.62 + (L - 0.5) * 0.12 + 0.012 * Math.sin(t * 1.3) + n() * 0.01,
                exhaust: 0.38 + L * 0.32 + 0.05 * Math.sin(t * 0.11) + n() * 0.012,
                lube: 0.52 + (L - 0.5) * 0.1 + 0.045 * Math.sin(t * 9) + n() * 0.015,
                power: 0.2 + L * 0.6 + n() * 0.01,
                health: 0.5 + ((t % 1.6) < 0.08 ? 0.32 : 0) + n() * 0.004
            };
            for (const k in v) {
                const b = this.buf[k];
                b.copyWithin(0, 1);
                b[b.length - 1] = K.clamp(v[k], 0.04, 0.96);
            }
        }

        frame(dt) {
            this.acc = (this.acc || 0) + dt;
            while (this.acc > 1 / 30) { this.sample(1 / 30); this.acc -= 1 / 30; }
            this.drawScopes();
        }

        drawScopes() {
            const focus = this.hover || this.sel;
            SENSORS.forEach((s) => {
                const c = this.cvs.get(s.id);
                if (!c || !c.ctx || !c.w) return;
                const { ctx, w, h } = c;
                c.clear();
                const on = s.id === focus || s.id === this.sel;
                // graticule
                ctx.strokeStyle = 'rgba(148,190,210,0.07)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                for (let x = 0; x <= w; x += w / 8) { ctx.moveTo(Math.round(x) + 0.5, 0); ctx.lineTo(Math.round(x) + 0.5, h); }
                for (let y = 0; y <= h; y += h / 3) { ctx.moveTo(0, Math.round(y) + 0.5); ctx.lineTo(w, Math.round(y) + 0.5); }
                ctx.stroke();
                const b = this.buf[s.id];
                const col = s.color;
                // auto-range like a real scope: fit the visible window with headroom
                let lo = Infinity, hi = -Infinity;
                for (let i = 0; i < b.length; i++) { if (!Number.isNaN(b[i])) { lo = Math.min(lo, b[i]); hi = Math.max(hi, b[i]); } }
                const span = Math.max(0.06, hi - lo);
                const mid = (hi + lo) / 2;
                const Y = (v) => h / 2 - ((v - mid) / span) * h * 0.72;
                ctx.lineWidth = on ? 1.6 : 1.1;
                ctx.strokeStyle = `rgba(${col.join(',')},${on ? 0.95 : 0.4})`;
                ctx.beginPath();
                let started = false;
                for (let i = 0; i < b.length; i++) {
                    if (Number.isNaN(b[i])) continue;
                    const x = (i / (b.length - 1)) * w;
                    const y = Y(b[i]);
                    if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
                }
                ctx.stroke();
                const ly = Y(b[b.length - 1]);
                ctx.fillStyle = `rgba(${col.join(',')},${on ? 0.25 : 0.1})`;
                ctx.beginPath(); ctx.arc(w - 2, ly, 5, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = `rgba(${col.join(',')},${on ? 1 : 0.5})`;
                ctx.beginPath(); ctx.arc(w - 2, ly, 2, 0, Math.PI * 2); ctx.fill();
            });
        }
    }

    /* =====================================================================
       STAGE 01 — INGESTION
       ===================================================================== */
    class IngestStage {
        constructor(el) {
            this.el = el;
            el.innerHTML = `
                <div class="ns-head">
                    <div><p class="ns-kicker">Stage 01 · Telemetry ingestion</p><h4 class="ns-title">From 11,312 requests to 114</h4>
                    <p class="ns-sub">Per-reading HTTP polling replaced by an async chunk engine issuing bulk requests.</p><ul class="ns-tags"><li>Asset discovery</li><li>Timestamp normalization</li><li>Rate-limit backoff</li><li>Deterministic schemas</li></ul></div>
                    <button type="button" class="jr-btn" data-replay><span class="jr-btn__icon" aria-hidden="true">↻</span>Replay ingestion</button>
                </div>
                <div class="ni-stage">
                    <canvas class="ni-cv" aria-hidden="true"></canvas>
                    <div class="ni-zones" aria-hidden="true"><span>Sensor points</span><span>Async chunk engine</span><span>Bulk API requests</span></div>
                    <div class="ni-counters">
                        <div><span class="ni-n" data-n="points">0</span><span class="ni-l">sensor points received</span></div>
                        <div><span class="ni-n ni-n--acc" data-n="reqs">0</span><span class="ni-l">bulk requests issued</span></div>
                    </div>
                </div>
                <div class="ni-compare">
                    <div class="ni-bar"><span class="ni-bar__l">Unbatched</span><span class="ni-bar__track"><span class="ni-bar__fill ni-bar__fill--before" data-bar="before"></span></span><span class="ni-bar__v">11,312 requests</span></div>
                    <div class="ni-bar"><span class="ni-bar__l">Batched</span><span class="ni-bar__track"><span class="ni-bar__fill ni-bar__fill--after" data-bar="after"></span></span><span class="ni-bar__v">114 requests</span></div>
                </div>
                <ul class="jr-facts jr-facts--inline">
                    <li><b>≈99</b> readings per request</li>
                    <li><b>≈99%</b> fewer HTTP round-trips</li>
                    <li class="jr-facts__note">derived from 11,312 → 114 · animation time-compressed</li>
                </ul>`;
            this.cv = K.canvas(el.querySelector('.ni-cv'));
            this.nPoints = el.querySelector('[data-n="points"]');
            this.nReqs = el.querySelector('[data-n="reqs"]');
            this.barBefore = el.querySelector('[data-bar="before"]');
            this.barAfter = el.querySelector('[data-bar="after"]');
            el.querySelector('[data-replay]').addEventListener('click', () => this.replay());
            K.onResize(el.querySelector('.ni-stage'), () => { this.cv.resize(); this.draw(); });
            this.highlight = null;
            this.reset(true);
        }

        reset(finished) {
            this.dots = [];
            this.batches = [];
            this.workers = [0, 0, 0, 0];
            this.time = 0;
            this.spawned = 0;
            this.arrived = 0;
            this.sent = 0;
            this.TOTAL = 228;   // visual dots
            this.CAP = 6;       // dots per visual batch → 38 visual batches
            this.BATCHES = this.TOTAL / this.CAP;
            this.done = !!finished;
            if (finished) { this.arrived = this.TOTAL; this.sent = this.BATCHES; }
            this.updateCounters();
        }

        replay() {
            if (K.reduced) { this.reset(true); this.draw(); return; }
            this.reset(false);
            this.running = true;
            this.owner && this.owner.loop.start();
        }

        updateCounters() {
            const pts = this.arrived >= this.TOTAL ? 11312 : Math.floor((this.arrived / this.TOTAL) * 11312);
            const req = this.sent >= this.BATCHES ? 114 : Math.floor((this.sent / this.BATCHES) * 114);
            this.nPoints.textContent = K.fmt(pts);
            this.nReqs.textContent = K.fmt(req);
            this.barBefore.style.transform = `scaleX(${(pts / 11312).toFixed(4)})`;
            this.barAfter.style.transform = `scaleX(${((req / 114) * (114 / 11312)).toFixed(5)})`;
        }

        geom() {
            const { w, h } = this.cv;
            const top = 34, bot = h - 58;
            return {
                w, h, top, bot,
                laneY: (i) => top + ((i + 0.5) / 5) * (bot - top),
                workerX: w * 0.47,
                workerY: (i) => top + ((i + 0.5) / 4) * (bot - top),
                outX: w * 0.95,
                outY: (top + bot) / 2
            };
        }

        frame(dt) {
            if (!this.running) return false;
            const g = this.geom();
            this.time += dt;
            // spawn
            const rate = 52;
            const want = Math.min(this.TOTAL, Math.floor(this.time * rate));
            while (this.spawned < want) {
                const ch = this.spawned % 5;
                const wk = Math.floor(Math.random() * 4);
                this.dots.push({ ch, wk, x: -6 - Math.random() * 30, y: g.laneY(ch) + (Math.random() - 0.5) * 8, p: 0, v: 0.55 + Math.random() * 0.35 });
                this.spawned++;
            }
            // dots travel lane → worker buffer
            for (let i = this.dots.length - 1; i >= 0; i--) {
                const d = this.dots[i];
                d.p += dt * d.v;
                if (d.p >= 1) {
                    this.dots.splice(i, 1);
                    this.arrived++;
                    this.workers[d.wk]++;
                    if (this.workers[d.wk] >= this.CAP) {
                        this.workers[d.wk] = 0;
                        this.batches.push({ wk: d.wk, p: 0 });
                    }
                }
            }
            // flush leftovers at the end
            if (this.spawned >= this.TOTAL && !this.dots.length) {
                this.workers.forEach((n, wk) => { if (n > 0) { this.workers[wk] = 0; this.batches.push({ wk, p: 0, partial: true }); } });
            }
            for (let i = this.batches.length - 1; i >= 0; i--) {
                const b = this.batches[i];
                b.p += dt * 0.9;
                if (b.p >= 1) { this.batches.splice(i, 1); this.sent = Math.min(this.BATCHES, this.sent + 1); }
            }
            const finished = this.spawned >= this.TOTAL && !this.dots.length && !this.batches.length;
            if (finished) { this.arrived = this.TOTAL; this.sent = this.BATCHES; this.running = false; this.done = true; }
            this.updateCounters();
            this.draw();
            return !finished;
        }

        draw() {
            const c = this.cv;
            if (!c.ctx || !c.w) return;
            const ctx = c.ctx;
            const g = this.geom();
            c.clear();
            // lanes
            SENSORS.forEach((s, i) => {
                const y = g.laneY(i);
                const hi = !this.highlight || this.highlight === s.id;
                ctx.strokeStyle = `rgba(${s.color.join(',')},${hi ? 0.22 : 0.07})`;
                ctx.setLineDash([2, 5]);
                ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(g.w * 0.3, y); ctx.stroke();
                ctx.setLineDash([]);
                ctx.fillStyle = `rgba(${s.color.join(',')},${hi ? 0.85 : 0.35})`;
                ctx.font = '600 10px "JetBrains Mono", monospace';
                ctx.fillText(s.short, 4, y - 6);
            });
            // workers
            for (let i = 0; i < 4; i++) {
                const y = g.workerY(i);
                const bw = Math.min(150, g.w * 0.17);
                const x0 = g.workerX - bw / 2;
                ctx.strokeStyle = 'rgba(148,190,210,0.28)';
                ctx.strokeRect(x0 + 0.5, y - 9.5, bw, 19);
                const fillN = this.done ? 0 : this.workers[i];
                ctx.fillStyle = 'rgba(86,214,236,0.22)';
                ctx.fillRect(x0 + 1, y - 9, (bw - 1) * (fillN / this.CAP), 18);
                ctx.fillStyle = 'rgba(203,225,235,0.55)';
                ctx.font = '500 9px "JetBrains Mono", monospace';
                ctx.fillText(`worker ${i + 1}`, x0, y - 14);
            }
            // endpoint
            ctx.strokeStyle = 'rgba(255,176,72,0.55)';
            ctx.strokeRect(g.outX - 10.5, g.outY - 30.5, 16, 61);
            ctx.fillStyle = 'rgba(255,176,72,0.85)';
            ctx.font = '600 9px "JetBrains Mono", monospace';
            ctx.textAlign = 'right';
            ctx.fillText('BULK API', g.outX + 6, g.outY - 38);
            ctx.textAlign = 'left';
            // dots: quadratic path lane → worker
            this.dots.forEach((d) => {
                const s = SENSORS[d.ch];
                const t = d.p;
                const x0 = d.x, y0 = d.y;
                const x2 = g.workerX - Math.min(150, g.w * 0.17) / 2, y2 = g.workerY(d.wk);
                const cx = g.w * 0.32, cy = y0;
                const u = 1 - t;
                const x = u * u * x0 + 2 * u * t * cx + t * t * x2;
                const y = u * u * y0 + 2 * u * t * cy + t * t * y2;
                const hi = !this.highlight || this.highlight === s.id;
                ctx.fillStyle = `rgba(${s.color.join(',')},${hi ? 0.95 : 0.35})`;
                ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
            });
            // batches: worker → endpoint
            this.batches.forEach((b) => {
                const t = K.easeInOut(b.p);
                const bw = Math.min(150, g.w * 0.17);
                const x0 = g.workerX + bw / 2, y0 = g.workerY(b.wk);
                const x = K.lerp(x0, g.outX - 14, t);
                const y = K.lerp(y0, g.outY, t);
                ctx.fillStyle = 'rgba(255,176,72,0.16)';
                ctx.fillRect(x - 13, y - 8, 26, 16);
                ctx.strokeStyle = 'rgba(255,176,72,0.9)';
                ctx.strokeRect(x - 12.5, y - 7.5, 25, 15);
            });
            if (this.done) {
                ctx.strokeStyle = 'rgba(255,176,72,0.5)';
                ctx.setLineDash([3, 4]);
                ctx.beginPath(); ctx.moveTo(g.workerX + 80, g.outY); ctx.lineTo(g.outX - 14, g.outY); ctx.stroke();
                ctx.setLineDash([]);
            }
        }
    }

    /* =====================================================================
       STAGE 02 — MONITORING
       ===================================================================== */
    class MonitorStage {
        constructor(el) {
            this.el = el;
            // illustrative fleet with scripted heartbeat behaviour (minutes between heartbeats)
            this.assets = [
                { id: 'A-01', kind: 'Main engine', every: 1, gapAt: null },
                { id: 'A-02', kind: 'Genset', every: 1, gapAt: null },
                { id: 'A-03', kind: 'Genset', every: 1, gapAt: [20, 32] },
                { id: 'A-04', kind: 'Main engine', every: 1, gapAt: [8, 999] },
                { id: 'A-05', kind: 'Remote unit', every: 4, gapAt: null },
                { id: 'A-06', kind: 'Genset', every: 1, gapAt: [40, 58] }
            ];
            this.assets.forEach((a) => { a.last = 0; a.state = 0; a.override = null; });
            this.clock = 0;
            this.selected = 'A-04';
            this.log = [];

            const tiles = this.assets.map((a) => `
                <button type="button" class="nm-asset" data-asset="${a.id}" aria-pressed="false">
                    <span class="nm-asset__id">${a.id}</span><span class="nm-asset__kind">${a.kind}</span>
                    <span class="nm-asset__state"></span><span class="nm-asset__age"></span>
                    <span class="nm-asset__hb" aria-hidden="true"></span>
                </button>`).join('');
            const nodes = STATES.map((s, i) => `
                <div class="nm-node" data-state="${i}"><span class="nm-node__dot"></span><span class="nm-node__name">${s.name}</span><span class="nm-node__rule">${s.rule} since heartbeat</span></div>`).join('<span class="nm-arrow" aria-hidden="true"></span>');

            el.innerHTML = `
                <div class="ns-head">
                    <div><p class="ns-kicker">Stage 02 · Automated monitoring</p><h4 class="ns-title">Heartbeat recency, per asset</h4>
                    <p class="ns-sub">Assets are classified by heartbeat recency; offline assets escalate automatically.</p><ul class="ns-tags"><li>Per-asset recency</li><li>Tiered escalation</li><li>Google Sheets sync</li><li>Incident channels</li></ul></div>
                    <div class="nm-controls">
                        <button type="button" class="jr-btn" data-play><span class="jr-btn__icon" aria-hidden="true">▶</span><span data-play-l>Run fleet clock</span></button>
                        <span class="nm-clock" aria-live="off">T + <b data-clock>0</b> min</span>
                    </div>
                </div>
                <div class="nm-grid">
                    <div class="nm-fleet" role="group" aria-label="Illustrative fleet">${tiles}</div>
                    <div class="nm-machine">
                        <div class="nm-chain">${nodes}</div>
                        <div class="nm-return"><span>heartbeat received → back to Operational</span></div>
                        <div class="nm-escalate"><span class="nm-escalate__k">On Offline</span>Incident raised · status synced to the maintenance Google Sheet and incident channel for field engineers</div>
                        <div class="nm-inspect">
                            <label class="nm-inspect__l" for="nm-age">Inspect <b data-sel-id></b>: minutes since last heartbeat</label>
                            <div class="nm-inspect__row"><input id="nm-age" type="range" min="0" max="90" step="1" value="0" class="jr-range"><output data-age-out>0 min</output></div>
                        </div>
                    </div>
                </div>
                <ol class="nm-log" aria-label="State transitions" aria-live="polite"></ol>
                <p class="jr-footnote">Illustrative fleet. States and thresholds are the workflow's own.</p>`;
            this.range = el.querySelector('#nm-age');
            this.logEl = el.querySelector('.nm-log');
            el.querySelector('.nm-fleet').addEventListener('click', (e) => {
                const b = e.target.closest('[data-asset]');
                if (b) { this.selected = b.dataset.asset; this.syncRange(); this.render(); }
            });
            this.range.addEventListener('input', () => {
                const a = this.get(this.selected);
                a.override = Number(this.range.value);
                this.evaluate(a, true);
                this.render();
            });
            el.querySelector('[data-play]').addEventListener('click', () => this.togglePlay());
            this.assets.forEach((a) => this.evaluate(a, false));
            this.syncRange();
            this.render();
        }

        get(id) { return this.assets.find((a) => a.id === id); }
        age(a) { return a.override != null ? a.override : this.clock - a.last; }

        evaluate(a, logIt) {
            const s = stateOf(this.age(a));
            if (s !== a.state) {
                if (logIt) this.pushLog(a, a.state, s);
                a.state = s;
            }
        }

        pushLog(a, from, to) {
            const esc = to === 3 ? ' — escalated' : '';
            this.log.unshift(`<li><span class="nm-log__t">T+${Math.floor(this.clock)}m</span><b>${a.id}</b> ${STATES[from].name} → <span data-to="${to}">${STATES[to].name}</span>${esc}</li>`);
            this.log = this.log.slice(0, 6);
            this.logEl.innerHTML = this.log.join('');
        }

        togglePlay() {
            this.playing = !this.playing;
            if (this.playing) {
                if (this.clock >= 90) { this.clock = 0; this.assets.forEach((a) => { a.last = 0; a.override = null; a.state = 0; }); this.log = []; this.logEl.innerHTML = ''; }
                this.assets.forEach((a) => { a.override = null; });
                if (K.reduced) {
                    // jump straight to the end state for reduced motion
                    while (this.clock < 90) this.step(1);
                    this.playing = false;
                } else {
                    this.owner.loop.start();
                }
            }
            this.render();
        }

        step(minutes) {
            this.clock = Math.min(90, this.clock + minutes);
            this.assets.forEach((a) => {
                const inGap = a.gapAt && this.clock >= a.gapAt[0] && this.clock < a.gapAt[1];
                if (!inGap && Math.floor(this.clock) % a.every === 0 && this.clock - a.last >= a.every) a.last = Math.floor(this.clock);
                this.evaluate(a, true);
            });
            if (this.clock >= 90) this.playing = false;
        }

        frame(dt) {
            if (!this.playing) return false;
            this.acc = (this.acc || 0) + dt;
            let stepped = false;
            while (this.acc > 0.11) { this.step(1); this.acc -= 0.11; stepped = true; }
            if (stepped) { this.syncRange(); this.render(); }
            return this.playing;
        }

        syncRange() {
            const a = this.get(this.selected);
            this.range.value = String(Math.min(90, Math.round(this.age(a))));
        }

        render() {
            const el = this.el;
            this.assets.forEach((a) => {
                const t = el.querySelector(`[data-asset="${a.id}"]`);
                t.dataset.state = a.state;
                t.classList.toggle('is-selected', a.id === this.selected);
                t.setAttribute('aria-pressed', a.id === this.selected ? 'true' : 'false');
                t.querySelector('.nm-asset__state').textContent = STATES[a.state].name;
                const age = Math.round(this.age(a));
                t.querySelector('.nm-asset__age').textContent = age < 1 ? 'heartbeat just now' : `last heartbeat ${age} min ago`;
            });
            const sel = this.get(this.selected);
            el.querySelectorAll('.nm-node').forEach((n) => {
                const i = Number(n.dataset.state);
                n.classList.toggle('is-current', i === sel.state);
                n.classList.toggle('is-passed', i < sel.state);
            });
            el.querySelectorAll('.nm-arrow').forEach((ar, i) => ar.classList.toggle('is-passed', i < sel.state));
            el.querySelector('.nm-escalate').classList.toggle('is-on', sel.state === 3);
            el.querySelector('[data-sel-id]').textContent = sel.id;
            el.querySelector('[data-age-out]').textContent = `${Math.round(this.age(sel))} min`;
            el.querySelector('[data-clock]').textContent = Math.floor(this.clock);
            el.querySelector('[data-play-l]').textContent = this.playing ? 'Pause fleet clock' : (this.clock >= 90 ? 'Restart fleet clock' : 'Run fleet clock');
            el.querySelector('[data-play] .jr-btn__icon').textContent = this.playing ? '❚❚' : '▶';
        }
    }

    /* =====================================================================
       STAGE 03 — EVIDENCE-BACKED RAG
       ===================================================================== */
    class RagStage {
        constructor(el) {
            this.el = el;
            this.q = RAG_QUESTIONS[0];
            const qs = RAG_QUESTIONS.map((q, i) => `<button type="button" class="nr-q" role="tab" data-key="${q.id}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${q.q}</button>`).join('');
            const kos = Array.from({ length: 36 }, (_, i) => `<span class="nr-ko" data-ko="${i}"></span>`).join('');
            el.innerHTML = `
                <div class="ns-head">
                    <div><p class="ns-kicker">Stage 03 · Evidence-backed RAG</p><h4 class="ns-title">Answers that carry their evidence</h4>
                    <p class="ns-sub">Pick a question and trace its evidence through retrieval and validation.</p><ul class="ns-tags"><li>Dense + BM25</li><li>Engineering-limit validation</li><li>Citation grounding</li><li>Telemetry trend context</li></ul></div>
                    <button type="button" class="jr-btn" data-run><span class="jr-btn__icon" aria-hidden="true">▶</span>Trace evidence</button>
                </div>
                <div class="nr-qs" role="tablist" aria-label="Example questions">${qs}</div>
                <div class="nr-flow">
                    <div class="nr-col" data-col="0">
                        <p class="nr-col__h">Evidence sources</p>
                        <div class="nr-src" data-src="1"><span class="nr-src__n">1</span>OEM engine documentation</div>
                        <div class="nr-src" data-src="2"><span class="nr-src__n">2</span>Engineering constraints &amp; tolerance tables</div>
                        <div class="nr-src" data-src="3"><span class="nr-src__n">3</span>Telemetry trends</div>
                        <div class="nr-kos"><div class="nr-kos__grid">${kos}</div><p><b>36</b> validated KnowledgeObjects<br>rule-based checks &amp; trend patterns</p></div>
                    </div>
                    <div class="nr-col" data-col="1">
                        <p class="nr-col__h">Hybrid retrieval</p>
                        <div class="nr-lane"><p class="nr-lane__h">Dense · semantic embeddings</p><ol class="nr-hits" data-hits="dense"></ol></div>
                        <div class="nr-lane"><p class="nr-lane__h">Keyword · BM25 (part &amp; fault codes)</p><ol class="nr-hits" data-hits="kw"></ol></div>
                    </div>
                    <div class="nr-col" data-col="2">
                        <p class="nr-col__h">Rule validation</p>
                        <ul class="nr-checks"></ul>
                        <p class="nr-trend"></p>
                    </div>
                    <div class="nr-col nr-col--answer" data-col="3">
                        <p class="nr-col__h">Grounded answer</p>
                        <p class="nr-answer" aria-live="polite"></p>
                    </div>
                </div>
                <p class="nr-safe"><b>Safeguards, not guarantees.</b> Hallucination risk is reduced, not eliminated: every statement must cite retrieved evidence and pass engineering-limit checks before dispatch.</p>
                <p class="jr-footnote">Questions, sources and answers are illustrative stand-ins, not production output.</p>`;
            this.tabs = K.tabs(el.querySelector('.nr-qs'), (key) => { this.q = RAG_QUESTIONS.find((x) => x.id === key); this.run(); });
            el.querySelector('[data-run]').addEventListener('click', () => this.run());
            el.addEventListener('pointerover', (e) => { const c = e.target.closest('[data-cite]'); this.cite(c ? c.dataset.cite : null); });
            el.addEventListener('focusin', (e) => { const c = e.target.closest('[data-cite]'); this.cite(c ? c.dataset.cite : null); });
            el.addEventListener('pointerout', (e) => { if (e.target.closest('[data-cite]')) this.cite(null); });
            this.fill();
            this.setStep(4);
        }

        cite(n) {
            this.el.querySelectorAll('.nr-src').forEach((s) => s.classList.toggle('is-cited', s.dataset.src === n));
        }

        fill() {
            const q = this.q;
            const el = this.el;
            el.querySelector('[data-hits="dense"]').innerHTML = q.dense.map(([t, s]) => `<li><span>${t}</span><span class="nr-score">${s.toFixed(2)}</span></li>`).join('');
            el.querySelector('[data-hits="kw"]').innerHTML = q.keyword.map(([t, m]) => `<li><span>${t}</span><span class="nr-match">${m}</span></li>`).join('');
            el.querySelector('.nr-checks').innerHTML = q.checks.map((c) => `<li>${c}</li>`).join('');
            el.querySelector('.nr-trend').textContent = q.trend;
            el.querySelector('.nr-answer').innerHTML = q.answer.map(([s, n]) => `${s} <button type="button" class="nr-cite" data-cite="${n}" aria-label="Source ${n}">${n}</button>`).join('. ') + '.'
                + (q.note ? `<span class="nr-note">${q.note}</span>` : '');
            el.querySelectorAll('.nr-ko').forEach((k) => k.classList.toggle('is-hit', q.kos.includes(Number(k.dataset.ko))));
        }

        setStep(n) {
            this.el.querySelectorAll('.nr-col').forEach((c) => {
                const i = Number(c.dataset.col);
                c.classList.toggle('is-active', i === n);
                c.classList.toggle('is-done', i < n);
                c.classList.toggle('is-pending', i > n);
            });
        }

        run() {
            clearTimeout(this.timer);
            this.fill();
            if (K.reduced) { this.setStep(4); return; }
            let i = 0;
            const tick = () => {
                this.setStep(i);
                i++;
                if (i <= 4) this.timer = setTimeout(tick, i === 1 ? 420 : 620);
            };
            tick();
        }
    }

    /* =====================================================================
       STAGE 04 — RELIABILITY
       ===================================================================== */
    class ReliabilityStage {
        constructor(el) {
            this.el = el;
            this.linkUp = true;
            this.packets = [];
            this.seq = 0;
            this.dlq = [];
            this.seen = new Set();
            const NODES = [
                ['in', 'Input', 'telemetry frame'],
                ['val', 'Schema enforcement', 'Pydantic validation'],
                ['proc', 'Processing', 'idempotent queue'],
                ['retry', 'Retry · backoff', 'exponential'],
                ['dlq', 'Dead-letter', 'buffered, not dropped'],
                ['ok', 'Stored', 'recovered / delivered']
            ];
            el.innerHTML = `
                <div class="ns-head">
                    <div><p class="ns-kicker">Stage 04 · Reliability engineering</p><h4 class="ns-title">Failures are handled, not hidden</h4>
                    <p class="ns-sub">Inject a fault: validation, backoff retries, dead-letter, recovery.</p><ul class="ns-tags"><li>Pydantic schemas</li><li>Idempotent queue</li><li>Exponential backoff</li><li>Dead-letter buffer</li></ul></div>
                    <button type="button" class="jr-btn" data-scenario><span class="jr-btn__icon" aria-hidden="true">▶</span>Run failure scenario</button>
                </div>
                <div class="nb-pipe">
                    <svg class="nb-wires" aria-hidden="true"></svg>
                    ${NODES.map(([k, t, s]) => `<div class="nb-node" data-node="${k}"><span class="nb-node__t">${t}</span><span class="nb-node__s">${s}</span><span class="nb-node__n" data-count="${k}"></span></div>`).join('')}
                    <div class="nb-layer" aria-hidden="true"></div>
                </div>
                <div class="nb-backoff" aria-hidden="true"><span class="nb-backoff__l">Backoff</span><div class="nb-backoff__track"></div></div>
                <div class="nb-controls" role="group" aria-label="Inject events">
                    <button type="button" class="jr-chip" data-act="send">Send frame</button>
                    <button type="button" class="jr-chip" data-act="corrupt">Send corrupted frame</button>
                    <button type="button" class="jr-chip" data-act="dup">Send duplicate</button>
                    <button type="button" class="jr-chip jr-chip--warn" data-act="link" aria-pressed="false">Drop cellular link</button>
                </div>
                <ol class="nb-log" aria-live="polite"></ol>
                <p class="jr-footnote">Simulated packets; the stages mirror the production pipeline.</p>`;
            this.pipe = el.querySelector('.nb-pipe');
            this.layer = el.querySelector('.nb-layer');
            this.wires = el.querySelector('.nb-wires');
            this.logEl = el.querySelector('.nb-log');
            this.track = el.querySelector('.nb-backoff__track');
            this.counts = { val: 0, proc: 0, retry: 0, dlq: 0, ok: 0 };
            el.querySelector('.nb-controls').addEventListener('click', (e) => {
                const b = e.target.closest('[data-act]');
                if (!b) return;
                const a = b.dataset.act;
                if (a === 'send') this.send();
                if (a === 'corrupt') this.send({ corrupt: true });
                if (a === 'dup') this.send({ dup: true });
                if (a === 'link') this.setLink(!this.linkUp);
            });
            el.querySelector('[data-scenario]').addEventListener('click', () => this.scenario());
            K.onResize(this.pipe, () => this.layout());
            this.layout();
        }

        layout() {
            const pr = this.pipe.getBoundingClientRect();
            this.pos = {};
            this.pipe.querySelectorAll('.nb-node').forEach((n) => {
                const r = n.getBoundingClientRect();
                this.pos[n.dataset.node] = { x: r.left - pr.left + r.width / 2, y: r.top - pr.top + r.height / 2, w: r.width, h: r.height };
            });
            const P = this.pos;
            if (!P.in) return;
            const line = (a, b, cls) => `<path class="${cls || ''}" d="M${P[a].x} ${P[a].y} L${P[b].x} ${P[b].y}"/>`;
            this.wires.setAttribute('viewBox', `0 0 ${pr.width} ${pr.height}`);
            this.wires.innerHTML = line('in', 'val') + line('val', 'proc') + line('proc', 'ok') + line('proc', 'retry', 'is-fail') + line('retry', 'dlq', 'is-fail') + line('dlq', 'ok', 'is-recover');
        }

        log(msg, kind) {
            const li = document.createElement('li');
            li.className = kind ? `is-${kind}` : '';
            li.innerHTML = msg;
            this.logEl.prepend(li);
            while (this.logEl.children.length > 6) this.logEl.lastChild.remove();
        }

        count(k) {
            this.counts[k]++;
            const n = this.el.querySelector(`[data-count="${k}"]`);
            if (n) n.textContent = this.counts[k];
            const node = this.el.querySelector(`[data-node="${k}"]`);
            node.classList.remove('is-ping'); void node.offsetWidth; node.classList.add('is-ping');
        }

        setLink(up) {
            this.linkUp = up;
            const b = this.el.querySelector('[data-act="link"]');
            b.textContent = up ? 'Drop cellular link' : 'Restore cellular link';
            b.setAttribute('aria-pressed', up ? 'false' : 'true');
            this.pipe.classList.toggle('is-down', !up);
            this.log(up ? 'Cellular link restored' : 'Cellular link dropped', up ? 'ok' : 'warn');
            if (up && this.dlq.length) {
                const items = this.dlq.splice(0);
                items.forEach((p, i) => setTimeout(() => {
                    this.log(`Replaying <b>#${p.id}</b> from dead-letter`, 'ok');
                    this.move(p, ['dlq', 'ok'], () => { this.count('ok'); this.log(`<b>#${p.id}</b> recovered and stored`, 'ok'); });
                }, 300 + i * 350));
            }
        }

        send(opts = {}) {
            const id = opts.dup && this.lastId ? this.lastId : ++this.seq;
            if (!opts.dup) this.lastId = id;
            const p = { id, corrupt: !!opts.corrupt, dup: !!opts.dup, attempt: 0 };
            this.log(`Frame <b>#${id}</b>${p.corrupt ? ' (corrupted)' : p.dup ? ' (duplicate)' : ''} received`);
            this.move(p, ['in', 'val'], () => {
                if (p.corrupt) { this.count('val'); this.log(`<b>#${id}</b> rejected by schema validation`, 'bad'); return; }
                this.move(p, ['val', 'proc'], () => this.process(p));
            });
        }

        process(p) {
            this.count('proc');
            if (p.dup && this.seen.has(p.id)) { this.log(`<b>#${p.id}</b> duplicate ignored (idempotency key)`, 'warn'); return; }
            if (this.linkUp) {
                this.move(p, ['proc', 'ok'], () => { this.seen.add(p.id); this.count('ok'); this.log(`<b>#${p.id}</b> stored`, 'ok'); });
                return;
            }
            p.attempt++;
            if (p.attempt > 3) {
                this.move(p, ['retry', 'dlq'], () => { this.count('dlq'); this.dlq.push(p); this.log(`<b>#${p.id}</b> parked in dead-letter after 3 retries`, 'warn'); });
                return;
            }
            const wait = Math.pow(2, p.attempt - 1); // 1, 2, 4 units
            this.markBackoff(p, p.attempt, wait);
            this.move(p, ['proc', 'retry'], () => {
                this.count('retry');
                this.log(`<b>#${p.id}</b> send failed · retry ${p.attempt} in ${wait}u`, 'warn');
                setTimeout(() => this.move(p, ['retry', 'proc'], () => this.process(p)), K.reduced ? 0 : wait * 420);
            });
        }

        markBackoff(p, attempt, wait) {
            // the track follows one packet at a time so interleaved retries stay readable
            if (attempt === 1) { this.track.innerHTML = ''; this.backoffFor = p.id; }
            if (this.backoffFor !== p.id) return;
            const s = document.createElement('span');
            s.className = 'nb-backoff__seg';
            s.style.flexGrow = String(wait);
            s.innerHTML = `<i>#${p.id} · retry ${attempt}</i><b>${wait}u</b>`;
            this.track.appendChild(s);
        }

        move(p, [a, b], done) {
            const A = this.pos[a];
            const B = this.pos[b];
            if (!A || !B || K.reduced) { done(); return; }
            const dot = document.createElement('span');
            dot.className = `nb-pkt${p.corrupt ? ' is-bad' : ''}${p.dup ? ' is-dup' : ''}`;
            dot.textContent = p.id;
            this.layer.appendChild(dot);
            const st = { x: A.x, y: A.y, vx: 0, vy: 0, t: 0 };
            this.packets.push({ dot, st, B, done });
            this.owner.loop.start();
        }

        frame(dt) {
            for (let i = this.packets.length - 1; i >= 0; i--) {
                const m = this.packets[i];
                m.st.t += dt;
                K.spring(m.st, 'x', 'vx', m.B.x, 70, 0.78, dt);
                K.spring(m.st, 'y', 'vy', m.B.y, 70, 0.78, dt);
                m.dot.style.transform = `translate3d(${m.st.x.toFixed(1)}px,${m.st.y.toFixed(1)}px,0) translate(-50%,-50%)`;
                if (Math.hypot(m.st.x - m.B.x, m.st.y - m.B.y) < 2 || m.st.t > 1.6) {
                    m.dot.remove();
                    this.packets.splice(i, 1);
                    m.done();
                }
            }
            return this.packets.length > 0;
        }

        scenario() {
            clearTimeout(this.scT);
            const steps = [
                () => this.send(),
                () => this.setLink(false),
                () => this.send(),
                () => this.send({ corrupt: true }),
                () => this.setLink(true)
            ];
            const delays = [0, 2900, 400, 1400, 7600];
            let acc = 0;
            this.scT = null;
            steps.forEach((fn, i) => { acc += delays[i]; setTimeout(fn, K.reduced ? i * 10 : acc); });
        }
    }

    /* =====================================================================
       LAB
       ===================================================================== */
    const STAGES = [
        ['ingest', '01', 'Telemetry ingestion', '11,312 → 114'],
        ['monitor', '02', 'Automated monitoring', '4 recency states'],
        ['rag', '03', 'Evidence-backed RAG', '36 KnowledgeObjects'],
        ['reliability', '04', 'Reliability engineering', 'retry · dead-letter']
    ];

    class NeptunusLab {
        constructor(root) {
            this.root = root;
            root.classList.add('nl');
            this.twin = new EngineTwin(root, this);

            const tabs = STAGES.map(([k, n, t, m], i) => `
                <button type="button" class="nl-stab" role="tab" data-key="${k}" id="nl-stab-${k}" aria-controls="nl-stage-${k}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">
                    <span class="nl-stab__n">${n}</span><span class="nl-stab__t">${t}</span><span class="nl-stab__m">${m}</span>
                </button>`).join('');
            const panels = STAGES.map(([k], i) => `<div class="nl-stage" id="nl-stage-${k}" role="tabpanel" aria-labelledby="nl-stab-${k}" data-stage="${k}" ${i ? 'hidden' : ''}></div>`).join('');
            this.stagesEl = K.h(`<div class="nl-stages"><div class="nl-stabs" role="tablist" aria-label="Engineering stages">${tabs}</div><div class="nl-stage-wrap">${panels}</div></div>`);
            root.appendChild(this.stagesEl);

            const P = (k) => this.stagesEl.querySelector(`[data-stage="${k}"]`);
            this.stage = 'ingest';
            this.stages = { ingest: new IngestStage(P('ingest')) };
            this.lazy = { monitor: MonitorStage, rag: RagStage, reliability: ReliabilityStage };
            this.stages.ingest.owner = this;

            this.tabCtl = K.tabs(this.stagesEl.querySelector('.nl-stabs'), (k) => this.showStage(k));

            this.loop = new K.Loop(root, (dt) => {
                let keep = false;
                this.twin.frame(dt);
                keep = true; // twin scopes are live while visible
                const st = this.stages[this.stage];
                if (st && st.frame) st.frame(dt);
                return keep;
            });
        }

        /** Programmatic entry (e.g. "follow this channel"): selects the tab, which calls showStage. */
        openStage(k, scroll) {
            this.pendingScroll = !!scroll;
            if (this.stage !== k) this.tabCtl.select(k);
            else this.showStage(k);
        }

        showStage(k) {
            const scroll = this.pendingScroll;
            this.pendingScroll = false;
            this.stage = k;
            this.stagesEl.querySelectorAll('.nl-stage').forEach((p) => { p.hidden = p.dataset.stage !== k; });
            if (!this.stages[k]) {
                const Cls = this.lazy[k];
                this.stages[k] = new Cls(this.stagesEl.querySelector(`[data-stage="${k}"]`));
                this.stages[k].owner = this;
            }
            const st = this.stages[k];
            if (k === 'reliability' && st.layout) requestAnimationFrame(() => st.layout());
            if (k === 'ingest') { st.cv.resize(); st.draw(); }
            if (scroll) {
                this.stagesEl.scrollIntoView({ behavior: K.reduced ? 'auto' : 'smooth', block: 'start' });
                if (k === 'ingest') setTimeout(() => st.replay(), K.reduced ? 0 : 450);
            }
            this.loop.start();
        }

        highlightChannel(id) {
            const ing = this.stages.ingest;
            ing.highlight = id;
            ing.draw();
        }

        activate() {
            this.loop.start();
            if (!this.autoplayed && !K.reduced) {
                this.autoplayed = true;
                // first visit: play the ingestion story once when it scrolls into view
                const io = new IntersectionObserver((en) => {
                    if (en[0].isIntersecting) { io.disconnect(); if (this.stage === 'ingest') this.stages.ingest.replay(); }
                }, { threshold: 0.45 });
                io.observe(this.stagesEl.querySelector('[data-stage="ingest"]'));
            }
        }

        deactivate() { this.loop.stop(); }
    }

    window.JLabs.neptunus = { mount: (root) => new NeptunusLab(root) };
})();
