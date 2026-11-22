/**
 * Chapter 02 — NASA ATX: Aerospace Computation laboratory.
 *   OrbitSim        planar two-body simulation (RK4) with optional exponential-atmosphere drag and J2,
 *                   compared against an unperturbed two-body prediction; deviation chart
 *   CockpitVision   synthetic instrument panel with zone-based detection overlays and value extraction
 *   InferenceCycle  one simulation tick as a waterfall of stages, replayable and inspectable
 *
 * The physics is real (μ/r² gravity, J2 oblateness, exponential atmosphere), but drag and J2 are
 * exaggerated so their effect is visible in seconds. Nothing here is mission data or the original models.
 */
(() => {
    'use strict';
    const K = window.JKit;
    if (!K) return;

    const MU_E = 398600.4418;  // km^3/s^2
    const R_E = 6371;          // km
    const J2 = 1.08263e-3;
    const DRAG_X = 4000;       // drag exaggeration
    const J2_X = 25;           // J2 exaggeration
    const TAU = Math.PI * 2;

    /* =====================================================================
       ORBIT SIMULATION
       ===================================================================== */
    class OrbitSim {
        constructor(el, owner) {
            this.el = el;
            this.owner = owner;
            this.p = { alt: 300, vel: 8.9, mu: 1, drag: true, j2: false, warp: 480 };
            el.innerHTML = `
                <div class="no-head">
                    <div><p class="ns-kicker">Trajectory laboratory</p><h4 class="ns-title">Predicted vs. perturbed orbit</h4>
                    <p class="ns-sub">Two-body prediction vs. perturbed integration from one state; their gap is the drift the models learned to forecast.</p><ul class="ns-tags"><li>Neural trajectory forecasting</li><li>Atmospheric drag</li><li>Gravitational micro-variation</li><li>TensorFlow</li></ul></div>
                </div>
                <div class="no-grid">
                    <div class="no-view">
                        <canvas class="no-cv" aria-label="Orbit visualization" role="img"></canvas>
                        <div class="no-legend" aria-hidden="true">
                            <span><i class="no-l no-l--pred"></i>Predicted · two-body</span>
                            <span><i class="no-l no-l--real"></i>Perturbed · integrated</span>
                            <span><i class="no-l no-l--v"></i>Velocity</span>
                            <span><i class="no-l no-l--g"></i>Gravity</span>
                        </div>
                        <p class="no-status" aria-live="polite"></p>
                    </div>
                    <div class="no-side">
                        <div class="no-ctrl" role="group" aria-label="Simulation parameters">
                            ${this.slider('alt', 'Initial altitude', 200, 2000, 10, 'km')}
                            ${this.slider('vel', 'Initial velocity', 6.6, 11.4, 0.01, 'km/s')}
                            ${this.slider('mu', 'Gravitational parameter μ', 0.8, 1.2, 0.01, '× Earth')}
                            ${this.slider('warp', 'Simulation speed', 60, 1500, 10, '× real time')}
                            <div class="no-toggles">
                                <label class="jr-toggle"><input type="checkbox" data-t="drag" checked><span></span>Atmospheric drag <em>×${K.fmt(DRAG_X)}</em></label>
                                <label class="jr-toggle"><input type="checkbox" data-t="j2"><span></span>J2 oblateness <em>×${J2_X}</em></label>
                            </div>
                            <div class="no-btns">
                                <button type="button" class="jr-btn" data-play><span class="jr-btn__icon" aria-hidden="true">▶</span><span data-play-l>Play</span></button>
                                <button type="button" class="jr-btn jr-btn--ghost" data-reset>Reset</button>
                                <button type="button" class="jr-btn jr-btn--ghost" data-circ>Circular velocity</button>
                            </div>
                        </div>
                        <dl class="no-read">
                            <div><dt>Altitude</dt><dd data-r="alt">—</dd></div>
                            <div><dt>Speed</dt><dd data-r="spd">—</dd></div>
                            <div><dt>Eccentricity</dt><dd data-r="ecc">—</dd></div>
                            <div><dt>Period</dt><dd data-r="per">—</dd></div>
                            <div><dt>Elapsed</dt><dd data-r="t">—</dd></div>
                            <div><dt>Deviation</dt><dd data-r="dev">—</dd></div>
                        </dl>
                    </div>
                </div>
                <div class="no-chart">
                    <div class="no-chart__head"><span class="jr-label">Deviation · |perturbed − predicted| position</span><span class="no-chart__note">dashed = two-body prediction</span></div>
                    <canvas class="no-chart__cv" aria-hidden="true"></canvas>
                </div>
                `;

            this.cv = K.canvas(el.querySelector('.no-cv'));
            this.ch = K.canvas(el.querySelector('.no-chart__cv'));
            this.status = el.querySelector('.no-status');
            this.view = { s: 1, v: 0, cx: 0, cy: 0, vx: 0, vy: 0 };
            this.stars = Array.from({ length: 70 }, () => [Math.random(), Math.random(), Math.random()]);

            el.querySelectorAll('input[type="range"]').forEach((inp) => {
                inp.addEventListener('input', () => {
                    const k = inp.dataset.k;
                    this.p[k] = Number(inp.value);
                    this.paintSlider(k);
                    if (k !== 'warp') this.reset();
                });
            });
            el.querySelectorAll('input[data-t]').forEach((c) => c.addEventListener('change', () => { this.p[c.dataset.t] = c.checked; this.reset(); }));
            el.querySelector('[data-play]').addEventListener('click', () => this.setPlaying(!this.playing));
            el.querySelector('[data-reset]').addEventListener('click', () => this.reset());
            el.querySelector('[data-circ]').addEventListener('click', () => {
                const r0 = R_E + this.p.alt;
                this.p.vel = Math.round(Math.sqrt(MU_E * this.p.mu / r0) * 100) / 100;
                const inp = el.querySelector('[data-k="vel"]');
                inp.value = String(this.p.vel);
                this.paintSlider('vel');
                this.reset();
            });
            ['alt', 'vel', 'mu', 'warp'].forEach((k) => this.paintSlider(k));
            K.onResize(el.querySelector('.no-view'), () => { this.cv.resize(); this.ch.resize(); this.draw(); });
            this.reset();
        }

        slider(k, label, min, max, step, unit) {
            return `<div class="no-slider">
                <label for="no-${k}"><span>${label}</span><output data-o="${k}"></output></label>
                <input id="no-${k}" class="jr-range" type="range" data-k="${k}" min="${min}" max="${max}" step="${step}" value="${this.p[k]}">
                ${k === 'vel' ? '<div class="no-marks" aria-hidden="true"><span data-m="circ">circular</span><span data-m="esc">escape</span></div>' : ''}
                <span class="no-unit">${unit}</span>
            </div>`;
        }

        paintSlider(k) {
            const o = this.el.querySelector(`[data-o="${k}"]`);
            const v = this.p[k];
            o.textContent = k === 'vel' ? `${v.toFixed(2)} km/s` : k === 'mu' ? `${v.toFixed(2)} ×` : k === 'warp' ? `${Math.round(v)}×` : `${K.fmt(v)} km`;
            if (k === 'vel' || k === 'alt' || k === 'mu') {
                const r0 = R_E + this.p.alt;
                const mu = MU_E * this.p.mu;
                const vc = Math.sqrt(mu / r0);
                const ve = Math.sqrt(2 * mu / r0);
                const pos = (x) => K.clamp((x - 6.6) / (11.4 - 6.6), 0, 1) * 100;
                const c = this.el.querySelector('[data-m="circ"]');
                const e = this.el.querySelector('[data-m="esc"]');
                if (c) { c.style.left = `${pos(vc)}%`; c.title = `${vc.toFixed(2)} km/s`; }
                if (e) { e.style.left = `${pos(ve)}%`; e.title = `${ve.toFixed(2)} km/s`; }
            }
        }

        accel(s, perturbed, out) {
            const mu = MU_E * this.p.mu;
            const r2 = s[0] * s[0] + s[1] * s[1];
            const r = Math.sqrt(r2);
            let f = -mu / (r2 * r);
            if (perturbed && this.p.j2) f *= 1 + 1.5 * J2 * J2_X * (R_E * R_E) / r2; // equatorial-plane J2
            let ax = f * s[0];
            let ay = f * s[1];
            if (perturbed && this.p.drag) {
                const h = r - R_E;
                if (h < 1000) {
                    const rho = 3.6e-10 * Math.exp(-(h - 150) / 45) + 1e-12 * Math.exp(-(h - 400) / 70); // kg/m^3
                    const vx = s[2], vy = s[3];
                    const vm = Math.hypot(vx, vy) * 1000; // m/s
                    const B = 0.01; // Cd·A/m, m^2/kg
                    const a = 0.5 * B * rho * vm * vm * DRAG_X / 1000; // km/s^2
                    const vn = Math.hypot(vx, vy) || 1;
                    ax -= a * vx / vn;
                    ay -= a * vy / vn;
                }
            }
            out[0] = ax; out[1] = ay;
            return out;
        }

        rk4(s, h, perturbed) {
            const a = [0, 0];
            const d = (st) => { this.accel(st, perturbed, a); return [st[2], st[3], a[0], a[1]]; };
            const k1 = d(s);
            const s2 = s.map((v, i) => v + k1[i] * h / 2);
            const k2 = d(s2);
            const s3 = s.map((v, i) => v + k2[i] * h / 2);
            const k3 = d(s3);
            const s4 = s.map((v, i) => v + k3[i] * h);
            const k4 = d(s4);
            for (let i = 0; i < 4; i++) s[i] += h / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
        }

        elements(s) {
            const mu = MU_E * this.p.mu;
            const [x, y, vx, vy] = s;
            const r = Math.hypot(x, y);
            const v2 = vx * vx + vy * vy;
            const hmom = x * vy - y * vx;
            const ex = (vy * hmom) / mu - x / r;
            const ey = (-vx * hmom) / mu - y / r;
            const e = Math.hypot(ex, ey);
            const energy = v2 / 2 - mu / r;
            const a = -mu / (2 * energy);
            return { r, v: Math.sqrt(v2), e, a, w: Math.atan2(ey, ex), p: (hmom * hmom) / mu, T: e < 1 ? TAU * Math.sqrt(a * a * a / mu) : Infinity };
        }

        reset() {
            const r0 = R_E + this.p.alt;
            // start at the top of the view, moving prograde (counter-clockwise on screen)
            this.real = [0, r0, -this.p.vel, 0];
            this.pred = [0, r0, -this.p.vel, 0];
            this.t = 0;
            this.trail = [[0, r0]];
            this.series = [];
            this.ended = null;
            this.el0 = this.elements(this.pred);
            this.fitTarget = this.fit();
            if (!this.view.init || K.reduced) {
                this.view.s = this.fitTarget; this.view.cx = this.camTarget.x; this.view.cy = this.camTarget.y; this.view.init = true;
            }
            if (K.reduced) this.precompute();
            this.readout();
            this.draw();
        }

        precompute() {
            // reduced motion: integrate one predicted period (or 3 hours) up front and draw the result statically
            const span = Math.min(isFinite(this.el0.T) ? this.el0.T : 10800, 10800);
            let guard = 0;
            while (this.t < span && !this.ended && guard++ < 4000) this.advance(5);
        }

        fit() {
            // frame the conic, not the planet: for an ellipse the planet sits at a focus
            const e = this.el0;
            if (e.e < 1 && e.a * (1 + e.e) < R_E * 40) {
                const b = e.a * Math.sqrt(1 - e.e * e.e);
                this.camTarget = { x: -e.a * e.e * Math.cos(e.w), y: -e.a * e.e * Math.sin(e.w) };
                const ext = Math.max(e.a * Math.abs(Math.cos(e.w)) + b * Math.abs(Math.sin(e.w)), e.a * Math.abs(Math.sin(e.w)) + b * Math.abs(Math.cos(e.w)));
                return Math.max(ext, R_E * 1.2) * 1.1;
            }
            this.camTarget = { x: 0, y: 0 };
            return (R_E + this.p.alt) * 4;
        }

        setPlaying(on) {
            if (this.ended && on) this.reset();
            this.playing = on;
            this.el.querySelector('[data-play-l]').textContent = on ? 'Pause' : 'Play';
            this.el.querySelector('[data-play] .jr-btn__icon').textContent = on ? '❚❚' : '▶';
            if (on) this.owner.loop.start();
        }

        advance(simDt) {
            const h = 5;
            let rem = simDt;
            while (rem > 0 && !this.ended) {
                const step = Math.min(h, rem);
                this.rk4(this.real, step, true);
                this.rk4(this.pred, step, false);
                this.t += step;
                rem -= step;
                const r = Math.hypot(this.real[0], this.real[1]);
                if (r <= R_E + 80 && this.p.drag) this.ended = 'reentry';
                else if (r <= R_E) this.ended = 'impact';
                else if (r > R_E * 40) this.ended = 'escape';
            }
            const last = this.trail[this.trail.length - 1];
            if (Math.hypot(this.real[0] - last[0], this.real[1] - last[1]) > 60) {
                this.trail.push([this.real[0], this.real[1]]);
                if (this.trail.length > 900) this.trail.shift();
            }
            const rr = Math.hypot(this.real[0], this.real[1]) - R_E;
            const rp = Math.hypot(this.pred[0], this.pred[1]) - R_E;
            const lastS = this.series[this.series.length - 1];
            if (!lastS || this.t - lastS[0] >= 20) {
                this.series.push([this.t, Math.hypot(this.real[0] - this.pred[0], this.real[1] - this.pred[1]), rr - rp]);
                if (this.series.length > 600) this.series.shift();
            }
        }

        frame(dt) {
            K.spring(this.view, 's', 'v', this.fitTarget, 14, 0.9, dt);
            K.spring(this.view, 'cx', 'vx', this.camTarget.x, 14, 0.9, dt);
            K.spring(this.view, 'cy', 'vy', this.camTarget.y, 14, 0.9, dt);
            if (this.playing && !this.ended) this.advance(dt * this.p.warp);
            if (this.ended && this.playing) this.setPlaying(false);
            this.readout();
            this.draw();
            return this.playing || Math.abs(this.view.s - this.fitTarget) > 1 || Math.abs(this.view.cx - this.camTarget.x) > 1;
        }

        readout() {
            const el = this.elements(this.real);
            const set = (k, v) => { this.el.querySelector(`[data-r="${k}"]`).textContent = v; };
            set('alt', `${K.fmt(el.r - R_E)} km`);
            set('spd', `${el.v.toFixed(2)} km/s`);
            set('ecc', el.e.toFixed(3));
            set('per', isFinite(el.T) ? `${(el.T / 60).toFixed(1)} min` : 'unbound');
            set('t', `${(this.t / 60).toFixed(1)} min`);
            const dev = Math.hypot(this.real[0] - this.pred[0], this.real[1] - this.pred[1]);
            set('dev', `${dev < 10 ? dev.toFixed(1) : K.fmt(dev)} km`);
            const msg = this.ended === 'reentry' ? 'Re-entry: drag has decayed the orbit into the atmosphere.'
                : this.ended === 'impact' ? 'Trajectory intersects the surface.'
                    : this.ended === 'escape' ? 'Escape trajectory: the craft has left the view.'
                        : this.el0.e >= 1 ? 'Initial velocity exceeds escape speed: unbound trajectory.'
                            : this.el0.a * (1 - this.el0.e) < R_E ? 'Predicted orbit dips below the surface (sub-orbital).'
                                : this.playing ? 'Simulating…' : 'Paused. Adjust parameters or press Play.';
            if (this.status.textContent !== msg) this.status.textContent = msg;
        }

        draw() {
            const c = this.cv;
            if (!c.ctx || !c.w) return;
            const ctx = c.ctx;
            const { w, h } = c;
            c.clear();
            const sc = (Math.min(w, h) / 2) / this.view.s;
            const cx = w / 2 - this.view.cx * sc, cy = h / 2 + this.view.cy * sc; // screen position of the planet
            const X = (x) => cx + x * sc;
            const Y = (y) => cy - y * sc;

            // stars + astronomical grid
            this.stars.forEach(([sx, sy, z]) => { ctx.fillStyle = `rgba(200,210,255,${0.08 + z * 0.22})`; ctx.fillRect(sx * w, sy * h, z > 0.8 ? 1.5 : 1, z > 0.8 ? 1.5 : 1); });
            ctx.lineWidth = 1;
            const ringStep = this.view.s > 30000 ? 10000 : this.view.s > 14000 ? 5000 : 2000;
            ctx.font = '500 9px "JetBrains Mono", monospace';
            for (let rr = ringStep; rr < this.view.s * 1.5; rr += ringStep) {
                ctx.strokeStyle = 'rgba(160,170,255,0.07)';
                ctx.beginPath(); ctx.arc(cx, cy, rr * sc, 0, TAU); ctx.stroke();
                ctx.fillStyle = 'rgba(170,180,255,0.32)';
                ctx.fillText(`${K.fmt(rr)} km`, cx + rr * sc * 0.707 + 4, cy - rr * sc * 0.707 - 2);
            }
            ctx.strokeStyle = 'rgba(160,170,255,0.05)';
            for (let a = 0; a < 12; a++) {
                const th = (a / 12) * TAU;
                ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(th) * Math.max(w, h), cy + Math.sin(th) * Math.max(w, h)); ctx.stroke();
            }

            // atmosphere shell (only where drag acts)
            if (this.p.drag) {
                const g = ctx.createRadialGradient(cx, cy, R_E * sc, cx, cy, (R_E + 700) * sc);
                g.addColorStop(0, 'rgba(120,150,255,0.16)');
                g.addColorStop(1, 'rgba(120,150,255,0)');
                ctx.fillStyle = g;
                ctx.beginPath(); ctx.arc(cx, cy, (R_E + 700) * sc, 0, TAU); ctx.fill();
            }
            // planet
            const pg = ctx.createRadialGradient(cx - R_E * sc * 0.4, cy - R_E * sc * 0.4, R_E * sc * 0.1, cx, cy, R_E * sc);
            pg.addColorStop(0, '#1b2140');
            pg.addColorStop(1, '#0a0c18');
            ctx.fillStyle = pg;
            ctx.beginPath(); ctx.arc(cx, cy, R_E * sc, 0, TAU); ctx.fill();
            ctx.strokeStyle = 'rgba(150,165,255,0.45)';
            ctx.beginPath(); ctx.arc(cx, cy, R_E * sc, 0, TAU); ctx.stroke();
            ctx.strokeStyle = 'rgba(150,165,255,0.1)';
            for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.ellipse(cx, cy, R_E * sc, R_E * sc * (k / 4), 0, 0, TAU); ctx.stroke(); }

            // predicted conic (analytic)
            const e0 = this.el0;
            ctx.setLineDash([5, 6]);
            ctx.strokeStyle = 'rgba(167,176,255,0.6)';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            let first = true;
            const lim = e0.e < 1 ? Math.PI : Math.acos(-1 / e0.e) - 0.02;
            for (let i = 0; i <= 360; i++) {
                const nu = -lim + (i / 360) * 2 * lim;
                const r = e0.p / (1 + e0.e * Math.cos(nu));
                if (r <= 0 || r > this.view.s * 3) { first = true; continue; }
                const th = nu + e0.w;
                const x = X(r * Math.cos(th)), y = Y(r * Math.sin(th));
                if (first) { ctx.moveTo(x, y); first = false; } else ctx.lineTo(x, y);
            }
            ctx.stroke();
            ctx.setLineDash([]);

            // perturbed trail
            const tr = this.trail.concat([[this.real[0], this.real[1]]]);
            for (let i = 1; i < tr.length; i++) {
                const a = 0.15 + 0.85 * (i / tr.length);
                ctx.strokeStyle = `rgba(255,170,90,${a})`;
                ctx.lineWidth = 1.6;
                ctx.beginPath(); ctx.moveTo(X(tr[i - 1][0]), Y(tr[i - 1][1])); ctx.lineTo(X(tr[i][0]), Y(tr[i][1])); ctx.stroke();
            }

            // predicted ghost position
            const gx = X(this.pred[0]), gy = Y(this.pred[1]);
            ctx.strokeStyle = 'rgba(167,176,255,0.85)';
            ctx.beginPath(); ctx.arc(gx, gy, 4.5, 0, TAU); ctx.stroke();

            // spacecraft + vectors
            const sx = X(this.real[0]), sy = Y(this.real[1]);
            const arrow = (x0, y0, dx, dy, col, label) => {
                const L = Math.hypot(dx, dy) || 1;
                const x1 = x0 + dx, y1 = y0 + dy;
                ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 1.4;
                ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
                const ux = dx / L, uy = dy / L;
                ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 - ux * 6 - uy * 3.5, y1 - uy * 6 + ux * 3.5); ctx.lineTo(x1 - ux * 6 + uy * 3.5, y1 - uy * 6 - ux * 3.5); ctx.closePath(); ctx.fill();
                ctx.font = '600 10px "JetBrains Mono", monospace';
                ctx.fillText(label, x1 + ux * 6 + 3, y1 + uy * 6 + 3);
            };
            const vm = Math.hypot(this.real[2], this.real[3]);
            arrow(sx, sy, (this.real[2] / vm) * (18 + vm * 5), -(this.real[3] / vm) * (18 + vm * 5), 'rgba(167,176,255,0.95)', 'v');
            const a = [0, 0]; this.accel(this.real, false, a);
            const am = Math.hypot(a[0], a[1]) || 1;
            const gl = 14 + Math.min(40, am * 4000);
            arrow(sx, sy, (a[0] / am) * gl, -(a[1] / am) * gl, 'rgba(255,150,70,0.9)', 'g');
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(sx, sy, 3.2, 0, TAU); ctx.fill();
            ctx.fillStyle = 'rgba(255,190,120,0.25)';
            ctx.beginPath(); ctx.arc(sx, sy, 9, 0, TAU); ctx.fill();

            this.drawChart();
        }

        drawChart() {
            const c = this.ch;
            if (!c.ctx || !c.w) return;
            const ctx = c.ctx;
            const { w, h } = c;
            c.clear();
            const pad = { l: 46, r: 10, t: 8, b: 18 };
            const S = this.series;
            ctx.strokeStyle = 'rgba(160,170,255,0.08)';
            ctx.lineWidth = 1;
            for (let i = 0; i <= 3; i++) { const y = pad.t + (i / 3) * (h - pad.t - pad.b); ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(w - pad.r, y); ctx.stroke(); }
            if (S.length < 2) {
                ctx.fillStyle = 'rgba(180,188,255,0.4)';
                ctx.font = '500 10px "JetBrains Mono", monospace';
                ctx.fillText('Press Play to record the deviation over time', pad.l + 8, h / 2 + 3);
                return;
            }
            const lo = 0;
            let hi = 1;
            S.forEach(([, d]) => { hi = Math.max(hi, d); });
            hi *= 1.15;
            const t0 = S[0][0], t1 = S[S.length - 1][0];
            const X = (t) => pad.l + ((t - t0) / Math.max(1, t1 - t0)) * (w - pad.l - pad.r);
            const Y = (v) => pad.t + (1 - (v - lo) / (hi - lo)) * (h - pad.t - pad.b);
            const g = ctx.createLinearGradient(0, pad.t, 0, h - pad.b);
            g.addColorStop(0, 'rgba(255,160,80,0.28)');
            g.addColorStop(1, 'rgba(255,160,80,0.02)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.moveTo(X(t0), Y(0));
            S.forEach(([t, d]) => ctx.lineTo(X(t), Y(d)));
            ctx.lineTo(X(t1), Y(0));
            ctx.closePath(); ctx.fill();
            ctx.strokeStyle = 'rgba(255,170,90,0.95)'; ctx.lineWidth = 1.4;
            ctx.beginPath();
            S.forEach(([t, d], i) => { if (i) ctx.lineTo(X(t), Y(d)); else ctx.moveTo(X(t), Y(d)); });
            ctx.stroke();
            ctx.strokeStyle = 'rgba(167,176,255,0.5)'; ctx.setLineDash([4, 4]);
            ctx.beginPath(); ctx.moveTo(pad.l, Y(0)); ctx.lineTo(w - pad.r, Y(0)); ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = 'rgba(180,188,255,0.5)';
            ctx.font = '500 9px "JetBrains Mono", monospace';
            ctx.textAlign = 'right';
            ctx.fillText(`${hi < 10 ? hi.toFixed(1) : K.fmt(hi)} km`, pad.l - 6, pad.t + 8);
            ctx.fillText('0 km', pad.l - 6, h - pad.b);
            ctx.textAlign = 'left';
            ctx.fillText(`${(t0 / 60).toFixed(0)} min`, pad.l, h - 4);
            ctx.textAlign = 'right';
            ctx.fillText(`${(t1 / 60).toFixed(0)} min`, w - pad.r, h - 4);
            ctx.textAlign = 'left';
        }
    }

    /* =====================================================================
       COCKPIT VISION
       ===================================================================== */
    const ZONES = [
        { id: 'pfd', name: 'Primary flight', items: ['adi', 'alt', 'vel'] },
        { id: 'sys', name: 'Systems', items: ['fuel', 'press'] },
        { id: 'cw', name: 'Caution & warning', items: ['ann'] },
        { id: 'mfd', name: 'Displays', items: ['mfd'] }
    ];
    const INSTR = {
        adi: { label: 'Attitude indicator', type: 'dial · attitude', box: [26, 46, 132, 132] },
        alt: { label: 'Altitude tape', type: 'tape · vertical', box: [170, 46, 52, 132], below: true },
        vel: { label: 'Velocity gauge', type: 'dial · needle', box: [236, 54, 116, 116] },
        fuel: { label: 'Propellant gauge', type: 'dial · needle', box: [366, 58, 104, 76] },
        press: { label: 'Cabin pressure', type: 'display · digital', box: [482, 56, 102, 50], below: true },
        ann: { label: 'Annunciator panel', type: 'annunciator · grid', box: [432, 150, 152, 92] },
        mfd: { label: 'Multi-function display', type: 'display · graphic', box: [26, 196, 380, 86] }
    };

    class CockpitVision {
        constructor(el) {
            this.el = el;
            this.zone = 'pfd';
            this.t = 0;
            const tabs = ZONES.map((z, i) => `<button type="button" role="tab" class="jr-seg" data-key="${z.id}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${z.name}</button>`).join('');
            el.innerHTML = `
                <div class="no-head no-head--sm">
                    <div><p class="ns-kicker">Computer vision · cockpit analytics</p><h4 class="ns-title">Reading the instrument panel</h4>
                    <p class="ns-sub">Values read from needle geometry and displays; out-of-band readings are flagged.</p><ul class="ns-tags"><li>Gauge detection</li><li>Display reading</li><li>Failure-mode flagging</li></ul></div>
                </div>
                <div class="nv-tabs" role="tablist" aria-label="Instrument zones">${tabs}</div>
                <div class="nv-layout">
                    <div class="nv-panel">
                        <svg class="nv-svg" viewBox="0 0 610 296" role="img" aria-label="Synthetic cockpit instrument panel with detection overlays">${this.panelSVG()}<g class="nv-boxes"></g></svg>
                    </div>
                    <div class="nv-out">
                        <div class="nv-steps" aria-hidden="true"><span>Detect</span><span>Classify</span><span>Read value</span><span>Check band</span></div>
                        <table class="nv-table"><thead><tr><th scope="col">Instrument</th><th scope="col">Class</th><th scope="col">Extracted</th><th scope="col">Status</th></tr></thead><tbody></tbody></table>
                    </div>
                </div>
                <p class="jr-footnote">Synthetic panel; detections illustrative, so no confidence scores are shown.</p>`;
            this.boxes = el.querySelector('.nv-boxes');
            this.tbody = el.querySelector('tbody');
            K.tabs(el.querySelector('.nv-tabs'), (k) => { this.zone = k; this.renderBoxes(); this.renderTable(); });
            this.renderBoxes();
            this.update(0);
        }

        panelSVG() {
            const ticks = (cx, cy, r, a0, a1, n) => {
                let s = '';
                for (let i = 0; i <= n; i++) {
                    const a = a0 + (a1 - a0) * (i / n);
                    const x0 = cx + Math.cos(a) * r, y0 = cy + Math.sin(a) * r;
                    const x1 = cx + Math.cos(a) * (r - (i % 2 ? 4 : 8)), y1 = cy + Math.sin(a) * (r - (i % 2 ? 4 : 8));
                    s += `<line x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}"/>`;
                }
                return `<g class="nv-tick">${s}</g>`;
            };
            const ann = [];
            const names = ['O2 FLOW', 'CABIN', 'H2O', 'COMM', 'GLY', 'PYRO', 'FUEL', 'MAIN B'];
            names.forEach((n, i) => {
                const x = 438 + (i % 4) * 36, y = 158 + Math.floor(i / 4) * 40;
                ann.push(`<rect class="nv-ann${i === 0 ? ' is-lit' : ''}" x="${x}" y="${y}" width="32" height="30" rx="2"/><text class="nv-annt${i === 0 ? ' is-lit' : ''}" x="${x + 16}" y="${y + 18}">${n}</text>`);
            });
            return `
                <rect class="nv-bezel" x="6" y="6" width="598" height="284" rx="10"/>
                <!-- ADI -->
                <defs><clipPath id="nv-adi-clip"><circle cx="92" cy="112" r="58"/></clipPath></defs>
                <circle class="nv-face" cx="92" cy="112" r="60"/>
                <g clip-path="url(#nv-adi-clip)"><g class="nv-horizon"><rect x="0" y="40" width="190" height="72" class="nv-sky"/><rect x="0" y="112" width="190" height="72" class="nv-ground"/><line x1="0" y1="112" x2="190" y2="112" class="nv-hline"/></g></g>
                <path class="nv-ac" d="M62 112 h20 l10 8 l10 -8 h20"/>
                <!-- altitude tape -->
                <rect class="nv-face" x="174" y="50" width="44" height="124" rx="3"/>
                <g class="nv-tape"></g>
                <rect class="nv-ptr" x="170" y="104" width="52" height="16" rx="2"/>
                <text class="nv-digits" x="196" y="116" data-alt>—</text>
                <!-- velocity gauge -->
                <circle class="nv-face" cx="294" cy="112" r="54"/>${ticks(294, 112, 52, Math.PI * 0.75, Math.PI * 2.25, 12)}
                <line class="nv-needle" data-needle="vel" x1="294" y1="112" x2="294" y2="68"/>
                <circle class="nv-hub" cx="294" cy="112" r="4"/>
                <!-- propellant gauge -->
                <path class="nv-face" d="M372 120 A46 46 0 0 1 464 120 Z"/>
                <path class="nv-band-bad" d="M375 116 A43 43 0 0 1 383 94"/>
                ${ticks(418, 120, 44, Math.PI, Math.PI * 2, 8)}
                <line class="nv-needle" data-needle="fuel" x1="418" y1="120" x2="418" y2="84"/>
                <circle class="nv-hub" cx="418" cy="120" r="3.5"/>
                <text class="nv-lbl" x="418" y="132">PROP</text>
                <!-- cabin pressure digital -->
                <rect class="nv-face nv-lcd" x="486" y="60" width="94" height="42" rx="3"/>
                <text class="nv-seg" x="533" y="89" data-press>—</text>
                <text class="nv-lbl" x="533" y="114">CABIN kPa</text>
                <!-- annunciators -->
                ${ann.join('')}
                <!-- MFD -->
                <rect class="nv-face nv-lcd" x="30" y="200" width="372" height="78" rx="4"/>
                <path class="nv-mfd" d="M44 262 C 120 250, 170 214, 240 222 S 350 250, 388 226"/>
                <path class="nv-mfd nv-mfd--pred" d="M44 262 C 120 252, 170 220, 240 230 S 350 258, 388 236"/>
                <text class="nv-lbl" x="48" y="214" text-anchor="start">TRAJ</text>`;
        }

        values() {
            const t = this.t;
            return {
                pitch: Math.sin(t * 0.4) * 8,
                roll: Math.sin(t * 0.27) * 12,
                alt: 412.6 + Math.sin(t * 0.2) * 0.8,
                vel: 7.66 + Math.sin(t * 0.5) * 0.04,
                fuel: 0.11 + Math.sin(t * 0.3) * 0.01,
                press: 101.3 + Math.sin(t * 0.6) * 0.3
            };
        }

        update(dt) {
            this.t += dt;
            const v = this.values();
            const svg = this.el;
            const hz = svg.querySelector('.nv-horizon');
            hz.setAttribute('transform', `rotate(${v.roll.toFixed(2)} 92 112) translate(0 ${(v.pitch * 1.6).toFixed(2)})`);
            // vel needle: 0..10 km/s over 270°
            const va = Math.PI * 0.75 + (v.vel / 10) * Math.PI * 1.5;
            const nv = svg.querySelector('[data-needle="vel"]');
            nv.setAttribute('x2', (294 + Math.cos(va) * 44).toFixed(1));
            nv.setAttribute('y2', (112 + Math.sin(va) * 44).toFixed(1));
            const fa = Math.PI + v.fuel * Math.PI;
            const nf = svg.querySelector('[data-needle="fuel"]');
            nf.setAttribute('x2', (418 + Math.cos(fa) * 36).toFixed(1));
            nf.setAttribute('y2', (120 + Math.sin(fa) * 36).toFixed(1));
            svg.querySelector('[data-alt]').textContent = v.alt.toFixed(1);
            svg.querySelector('[data-press]').textContent = v.press.toFixed(1);
            const tape = svg.querySelector('.nv-tape');
            let s = '';
            for (let k = -3; k <= 3; k++) {
                const val = Math.round(v.alt) + k;
                const y = 112 - (val - v.alt) * 18;
                if (y < 54 || y > 170) continue;
                s += `<line x1="176" y1="${y.toFixed(1)}" x2="184" y2="${y.toFixed(1)}"/><text x="208" y="${(y + 3).toFixed(1)}">${val}</text>`;
            }
            tape.innerHTML = s;
            // extracted readings derive from the same geometry the needles are drawn with
            this.read = {
                adi: `pitch ${v.pitch.toFixed(1)}° · roll ${v.roll.toFixed(1)}°`,
                alt: `${v.alt.toFixed(1)} km`,
                vel: `${(((va - Math.PI * 0.75) / (Math.PI * 1.5)) * 10).toFixed(2)} km/s`,
                fuel: `${Math.round(((fa - Math.PI) / Math.PI) * 100)} %`,
                press: `${v.press.toFixed(1)} kPa`,
                ann: '1 caution lit: O2 FLOW',
                mfd: 'trajectory overlay · 2 traces'
            };
            this.flags = { fuel: v.fuel < 0.15, ann: true };
            this.renderTable();
        }

        renderBoxes() {
            const z = ZONES.find((x) => x.id === this.zone);
            this.boxes.innerHTML = z.items.map((id) => {
                const it = INSTR[id];
                const [x, y, w, h] = it.box;
                const bad = id === 'fuel' || id === 'ann';
                // tags that would collide with a neighbour's tag sit under the box instead
                const ty = it.below ? y + h + 1 : y - 13;
                return `<g class="nv-box${bad ? ' is-flag' : ''}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3"/>
                    <rect class="nv-box__tag" x="${x}" y="${ty}" width="${Math.max(64, it.type.length * 5.6 + 10)}" height="12" rx="2"/>
                    <text x="${x + 5}" y="${ty + 9}">${it.type}</text></g>`;
            }).join('');
        }

        renderTable() {
            const z = ZONES.find((x) => x.id === this.zone);
            const html = z.items.map((id) => {
                const bad = this.flags && this.flags[id];
                return `<tr${bad ? ' class="is-flag"' : ''}><th scope="row">${INSTR[id].label}</th><td>${INSTR[id].type}</td><td class="nv-val">${this.read ? this.read[id] : '—'}</td><td>${bad ? '<span class="nv-flag">Outside band</span>' : '<span class="nv-ok">Nominal</span>'}</td></tr>`;
            }).join('');
            if (this.tbody._last !== html) { this.tbody.innerHTML = html; this.tbody._last = html; }
        }

        frame(dt) {
            this.acc = (this.acc || 0) + dt;
            if (this.acc < 1 / 15) return;
            this.update(this.acc);
            this.acc = 0;
        }
    }

    /* =====================================================================
       INFERENCE CYCLE
       ===================================================================== */
    const CYCLE = [
        ['capture', 'Input capture', 8, 'Frames and simulation state are snapshotted so inference sees one consistent world.'],
        ['pre', 'Pre-processing', 11, 'Inputs are normalized and batched; precomputable work is moved out of the loop.'],
        ['infer', 'Model inference', 38, 'The forward pass: the stage optimization work targeted, since it dominates the tick.'],
        ['post', 'Prediction', 10, 'Outputs become trajectory corrections and readings, bounds-checked before use.'],
        ['sim', 'Simulation update', 19, 'A fixed-timestep physics update keeps runs deterministic and repeatable.'],
        ['slack', 'Headroom', 14, 'Spare budget so an occasional slow frame never stalls training.']
    ];

    class InferenceCycle {
        constructor(el) {
            this.el = el;
            this.sel = 'infer';
            this.p = 1;
            let acc = 0;
            const bars = CYCLE.map(([k, n, w]) => {
                const s = `<button type="button" class="nw-bar" data-k="${k}" style="left:${acc}%;width:${w}%" aria-pressed="false"><span>${n}</span></button>`;
                acc += w;
                return s;
            }).join('');
            el.innerHTML = `
                <div class="no-head no-head--sm">
                    <div><p class="ns-kicker">Low-latency deterministic inference</p><h4 class="ns-title">One simulation tick</h4>
                    <p class="ns-sub">Inference and the physics step must both fit inside one tick. Proportions are illustrative.</p></div>
                    <button type="button" class="jr-btn" data-replay><span class="jr-btn__icon" aria-hidden="true">↻</span>Replay tick</button>
                </div>
                <div class="nw-wrap">
                    <div class="nw-scale" aria-hidden="true"><span>tick start</span><span>tick budget</span></div>
                    <div class="nw-track">${bars}<span class="nw-cursor" aria-hidden="true"></span></div>
                    <div class="nw-ticks" aria-hidden="true"><span class="nw-tick">n</span><span class="nw-tick">n + 1</span></div>
                </div>
                <div class="nw-detail" aria-live="polite"></div>
`;
            this.cursor = el.querySelector('.nw-cursor');
            el.querySelector('.nw-track').addEventListener('click', (e) => { const b = e.target.closest('[data-k]'); if (b) this.select(b.dataset.k); });
            el.querySelector('[data-replay]').addEventListener('click', () => this.replay());
            this.select('infer');
            this.paint();
        }

        select(k) {
            this.sel = k;
            const c = CYCLE.find((x) => x[0] === k);
            this.el.querySelectorAll('.nw-bar').forEach((b) => {
                b.classList.toggle('is-sel', b.dataset.k === k);
                b.setAttribute('aria-pressed', b.dataset.k === k ? 'true' : 'false');
            });
            this.el.querySelector('.nw-detail').innerHTML = `<h5>${c[1]}</h5><p>${c[3]}</p>`;
        }

        replay() {
            if (K.reduced) { this.p = 1; this.paint(); return; }
            this.p = 0;
            this.running = true;
            this.owner.loop.start();
        }

        paint() {
            const pct = this.p * 100;
            this.cursor.style.left = `${pct}%`;
            let acc = 0;
            this.el.querySelectorAll('.nw-bar').forEach((b, i) => {
                const w = CYCLE[i][2];
                const on = pct >= acc && pct < acc + w && this.running;
                b.classList.toggle('is-live', on);
                b.classList.toggle('is-done', pct >= acc + w || !this.running);
                acc += w;
            });
        }

        frame(dt) {
            if (!this.running) return;
            this.p = Math.min(1, this.p + dt / 2.4);
            if (this.p >= 1) this.running = false;
            this.paint();
        }
    }

    /* =====================================================================
       LAB
       ===================================================================== */
    class NasaLab {
        constructor(root) {
            root.classList.add('na');
            root.innerHTML = `
                <div class="na-orbit"></div>
                <div class="na-row">
                    <div class="na-card na-cv"></div>
                    <div class="na-card na-inf"></div>
                </div>`;
            this.loop = new K.Loop(root, (dt) => {
                this.orbit.frame(dt);
                this.vision.frame(dt);
                this.inf.frame(dt);
                return true;
            });
            this.orbit = new OrbitSim(root.querySelector('.na-orbit'), this);
            this.vision = new CockpitVision(root.querySelector('.na-cv'));
            this.inf = new InferenceCycle(root.querySelector('.na-inf'));
            this.inf.owner = this;
        }
        activate() {
            if (!K.reduced) {
                if (!this.started) { this.started = true; this.orbit.setPlaying(true); }
                this.loop.start();
            }
        }
        deactivate() { this.loop.stop(); }
    }

    window.JLabs.nasa = { mount: (root) => new NasaLab(root) };
})();
