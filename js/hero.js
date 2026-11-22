/**
 * Hero signature visual — "orchestration constellation".
 * A rotating lattice core with five agent stages on two inclined orbital rings. The stages form the
 * agent loop (reason → retrieve → tools → execute → evaluate → reason) and packets circulate it.
 *
 * Canvas 2D with a small perspective projection (no WebGL needed); DOM buttons track the projected
 * stage positions for hover, focus and touch. Springs drive assembly, camera parallax, magnetism and
 * hover emphasis. The loop runs only while the hero is visible; reduced motion renders a still frame.
 */
(() => {
    'use strict';

    const STAGES = [
        { id: 'reason', name: 'Reason', desc: 'Plan and decompose the goal', ring: 0, a: 0.15 },
        { id: 'retrieve', name: 'Retrieve', desc: 'Ground it in the right context', ring: 1, a: 1.35 },
        { id: 'tools', name: 'Tools', desc: 'Call typed, validated tools', ring: 0, a: 2.55 },
        { id: 'execute', name: 'Execute', desc: 'Act, with checkpoints', ring: 1, a: 3.75 },
        { id: 'evaluate', name: 'Evaluate', desc: 'Verify before anything ships', ring: 0, a: 4.95 }
    ];
    // two inclined orbital pathways: radius, inclination, node longitude
    const RINGS = [
        { r: 0.84, inc: 0.42, lon: 0.3 },
        { r: 0.96, inc: -0.58, lon: 1.4 }
    ];
    const TAU = Math.PI * 2;

    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    function spring(o, p, v, t, k, z, dt) {
        const c = 2 * Math.sqrt(k) * z;
        o[v] += (-k * (o[p] - t) - c * o[v]) * dt;
        o[p] += o[v] * dt;
    }

    // rotate a point around Y (yaw) then X (pitch)
    function rot(p, yaw, pitch, out) {
        const cy = Math.cos(yaw), sy = Math.sin(yaw);
        const x = p[0] * cy + p[2] * sy;
        const z = -p[0] * sy + p[2] * cy;
        const cp = Math.cos(pitch), sp = Math.sin(pitch);
        out[0] = x;
        out[1] = p[1] * cp - z * sp;
        out[2] = p[1] * sp + z * cp;
        return out;
    }

    // point on an inclined ring at angle a
    function ringPoint(ring, a, out) {
        const x = Math.cos(a) * ring.r, z = Math.sin(a) * ring.r;
        const ci = Math.cos(ring.inc), si = Math.sin(ring.inc);
        const y = z * si, z2 = z * ci;
        const cl = Math.cos(ring.lon), sl = Math.sin(ring.lon);
        out[0] = x * cl - z2 * sl;
        out[1] = y;
        out[2] = x * sl + z2 * cl;
        return out;
    }

    function fibSphere(n, r) {
        const pts = [];
        const g = Math.PI * (3 - Math.sqrt(5));
        for (let i = 0; i < n; i++) {
            const y = 1 - (i / (n - 1)) * 2;
            const rr = Math.sqrt(1 - y * y);
            pts.push([Math.cos(g * i) * rr * r, y * r, Math.sin(g * i) * rr * r]);
        }
        return pts;
    }

    function latticeEdges(pts, k) {
        const set = new Set();
        const edges = [];
        pts.forEach((p, i) => {
            const d = pts.map((q, j) => [j, (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 + (p[2] - q[2]) ** 2]).filter(([j]) => j !== i).sort((a, b) => a[1] - b[1]);
            for (let m = 0; m < k; m++) {
                const j = d[m][0];
                const key = i < j ? `${i}-${j}` : `${j}-${i}`;
                if (!set.has(key)) { set.add(key); edges.push([i, j]); }
            }
        });
        return edges;
    }

    class Constellation {
        constructor(fig) {
            this.fig = fig;
            this.cv = fig.querySelector('.hx__canvas');
            this.ctx = this.cv.getContext ? this.cv.getContext('2d') : null;
            this.layer = fig.querySelector('.hx__nodes');
            this.mqReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
            this.coarse = window.matchMedia('(hover: none)').matches;
            this.reduced = this.mqReduced.matches;

            this.lattice = fibSphere(64, 0.31);
            this.edges = latticeEdges(this.lattice, 3);
            this.cam = { yaw: 0.6, pitch: -0.32, py: 0, pp: 0, vy: 0, vp: 0 };
            this.pointer = { x: 0, y: 0, in: false };
            this.time = 0;
            this.spread = { v: 0, x: this.reduced ? 1 : 0 };
            this.assemble = this.reduced ? 1 : 0;
            this.active = null;
            this.hover = null;
            this.packets = [];
            this.loopT = 0;
            this.loopEdge = 0;
            this._a = [0, 0, 0];
            this._b = [0, 0, 0];

            this.nodes = STAGES.map((s, i) => {
                const el = document.createElement('button');
                el.type = 'button';
                el.className = 'hx-node';
                el.dataset.id = s.id;
                el.setAttribute('aria-label', `${s.name}: ${s.desc}`);
                el.innerHTML = `<span class="hx-node__hit" aria-hidden="true"></span><span class="hx-node__tag" aria-hidden="true"><b>${s.name}</b><span>${s.desc}</span></span>`;
                this.layer.appendChild(el);
                return Object.assign({}, s, { i, el, sx: 0, sy: 0, z: 0, mx: 0, my: 0, vmx: 0, vmy: 0, glow: 0, vg: 0 });
            });

            const cap = fig.querySelector('.hx__caption-hint');
            if (cap && this.coarse) cap.textContent = 'tap a stage';

            this.readTheme(); // colours must exist before the first draw
            this.bind();
            this.resize();
            if (this.reduced) this.draw();
        }

        bind() {
            const fig = this.fig;
            fig.addEventListener('pointermove', (e) => {
                const r = this.rect || fig.getBoundingClientRect();
                this.pointer.x = e.clientX - r.left;
                this.pointer.y = e.clientY - r.top;
                this.pointer.in = e.pointerType === 'mouse';
                this.kick();
            }, { passive: true });
            fig.addEventListener('pointerleave', () => { this.pointer.in = false; this.hover = null; this.kick(); }, { passive: true });
            window.addEventListener('scroll', () => { this.rect = null; }, { passive: true });

            this.layer.addEventListener('pointerover', (e) => {
                if (e.pointerType !== 'mouse') return;
                const b = e.target.closest('.hx-node');
                this.setHover(b ? b.dataset.id : null);
            });
            this.layer.addEventListener('focusin', (e) => {
                const b = e.target.closest('.hx-node');
                if (b) this.setHover(b.dataset.id);
            });
            this.layer.addEventListener('focusout', () => this.setHover(null));
            this.layer.addEventListener('click', (e) => {
                const b = e.target.closest('.hx-node');
                if (!b) return;
                const id = b.dataset.id;
                this.active = this.active === id ? null : id;
                const n = this.nodes.find((x) => x.id === id);
                n.vg += 6; // spring kick
                this.burst(n.i);
                this.syncClasses();
                this.kick();
            });
            document.addEventListener('pointerdown', (e) => {
                if (this.active && !e.target.closest('.hx-node')) { this.active = null; this.syncClasses(); this.kick(); }
            });

            if ('ResizeObserver' in window) new ResizeObserver(() => this.resize()).observe(fig);
            else window.addEventListener('resize', () => this.resize());

            if ('IntersectionObserver' in window) {
                new IntersectionObserver((en) => { this.visible = en[0].isIntersecting; this.kick(); }, { threshold: 0 }).observe(fig);
            } else this.visible = true;
            document.addEventListener('visibilitychange', () => this.kick());
            if (this.mqReduced.addEventListener) {
                this.mqReduced.addEventListener('change', () => {
                    this.reduced = this.mqReduced.matches;
                    if (this.reduced) { this.spread.x = 1; this.assemble = 1; this.draw(); } else this.kick();
                });
            }
            new MutationObserver(() => { this.readTheme(); if (!this.raf) this.draw(); }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
        }

        readTheme() {
            const light = document.body.classList.contains('light-mode');
            this.ink = light ? [24, 24, 27] : [243, 241, 236];
            this.acc = [255, 122, 0];
            this.light = light;
        }

        resize() {
            const r = this.fig.getBoundingClientRect();
            this.rect = r;
            if (!r.width || !this.ctx) return;
            const dpr = Math.min(window.devicePixelRatio || 1, r.width < 420 ? 1.5 : 2);
            this.W = r.width; this.H = r.height; this.dpr = dpr;
            this.cv.width = Math.round(r.width * dpr);
            this.cv.height = Math.round(r.height * dpr);
            this.scale = Math.min(this.W, this.H) * 0.44;
            if (!this.raf) this.draw();
        }

        setHover(id) {
            if (this.hover === id) return;
            this.hover = id;
            if (id) {
                const n = this.nodes.find((x) => x.id === id);
                n.vg += 3.5;
                this.burst(n.i);
            }
            this.syncClasses();
            this.kick();
        }

        focusId() { return this.hover || this.active; }

        syncClasses() {
            const f = this.focusId();
            this.nodes.forEach((n) => {
                n.el.classList.toggle('is-focus', n.id === f);
                n.el.classList.toggle('is-active', n.id === this.active);
                n.el.setAttribute('aria-pressed', n.id === this.active ? 'true' : 'false');
            });
            this.fig.classList.toggle('has-focus', !!f);
        }

        // packets: core → stage and along the stage's outgoing loop edge
        burst(i) {
            if (this.reduced) return;
            this.packets.push({ kind: 'spoke', i, t: 0, v: 1.6 });
            this.packets.push({ kind: 'loop', i, t: -0.35, v: 1.1 });
        }

        kick() {
            if (this.reduced) { this.draw(); return; }
            const run = this.visible && !document.hidden;
            if (run && !this.raf) {
                this.last = performance.now();
                this.raf = requestAnimationFrame((t) => this.frame(t));
            }
        }

        frame(now) {
            this.raf = 0;
            if (!this.visible || document.hidden || this.reduced) return;
            const dt = Math.min((now - this.last) / 1000, 1 / 30);
            this.last = now;
            this.time += dt;
            this.update(dt);
            this.draw();
            this.raf = requestAnimationFrame((t) => this.frame(t));
        }

        update(dt) {
            // assembly: lattice grows, then stages spring out of the core (overshoot = spring)
            this.assemble = Math.min(1, this.assemble + dt / 0.9);
            if (this.time > 0.25) spring(this.spread, 'x', 'v', 1, 60, 0.52, dt);

            // camera: slow auto-yaw plus pointer parallax with inertia
            const px = this.pointer.in ? (this.pointer.x / this.W - 0.5) : 0;
            const py = this.pointer.in ? (this.pointer.y / this.H - 0.5) : 0;
            spring(this.cam, 'py', 'vy', px * 0.5, 16, 0.9, dt);
            spring(this.cam, 'pp', 'vp', py * 0.28, 16, 0.9, dt);
            this.cam.yaw += dt * (this.focusId() ? 0.02 : 0.075);

            this.nodes.forEach((n) => {
                // magnetic pull toward a nearby cursor, in screen space
                let tx = 0, ty = 0;
                if (this.pointer.in) {
                    const dx = this.pointer.x - n.sx, dy = this.pointer.y - n.sy;
                    const d = Math.hypot(dx, dy);
                    if (d < 110) { const f = (1 - d / 110) ** 2 * 0.28; tx = clamp(dx * f, -12, 12); ty = clamp(dy * f, -12, 12); }
                }
                spring(n, 'mx', 'vmx', tx, 140, 0.6, dt);
                spring(n, 'my', 'vmy', ty, 140, 0.6, dt);
                spring(n, 'glow', 'vg', n.id === this.focusId() ? 1 : 0, 90, 0.45, dt);
            });

            // the loop token circulates the agent cycle
            if (this.spread.x > 0.9) {
                this.loopT += dt / 1.25;
                if (this.loopT >= 1) { this.loopT = 0; this.loopEdge = (this.loopEdge + 1) % 5; this.nodes[this.loopEdge].vg += 1.2; }
            }
            for (let i = this.packets.length - 1; i >= 0; i--) {
                const p = this.packets[i];
                p.t += dt * p.v;
                if (p.t >= 1) this.packets.splice(i, 1);
            }
        }

        project(p, out) {
            rot(p, this.cam.yaw + this.cam.py, this.cam.pitch + this.cam.pp, this._a);
            const f = 3.2;
            const s = f / (f + this._a[2]);
            out[0] = this.W / 2 + this._a[0] * this.scale * s;
            out[1] = this.H / 2 + this._a[1] * this.scale * s;
            out[2] = this._a[2];
            out[3] = s;
            return out;
        }

        stagePos(n, out) {
            ringPoint(RINGS[n.ring], n.a, out);
            const k = this.spread.x;
            out[0] *= k; out[1] *= k; out[2] *= k;
            return out;
        }

        draw() {
            const ctx = this.ctx;
            if (!ctx || !this.W) return;
            const { W, H } = this;
            ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
            ctx.clearRect(0, 0, W, H);
            const ink = this.ink, acc = this.acc;
            const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
            const A = this.reduced ? 1 : this.assemble;
            const P = [0, 0, 0, 0], Q = [0, 0, 0, 0], tmp = [0, 0, 0];
            const focus = this.focusId();
            const depthA = (z) => clamp(0.55 - z * 0.55, 0.18, 1); // front brighter

            // core illumination
            const cg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, this.scale * 0.75);
            cg.addColorStop(0, rgba(acc, this.light ? 0.08 : 0.1 * A));
            cg.addColorStop(1, rgba(acc, 0));
            ctx.fillStyle = cg;
            ctx.fillRect(0, 0, W, H);

            // orbital pathways (drawn progressively during assembly)
            RINGS.forEach((ring) => {
                const segs = 96;
                const upto = Math.floor(segs * A);
                for (let i = 0; i < upto; i++) {
                    this.project(ringPoint(ring, (i / segs) * TAU, tmp), P);
                    this.project(ringPoint(ring, ((i + 1) / segs) * TAU, tmp), Q);
                    ctx.strokeStyle = rgba(ink, 0.13 * depthA((P[2] + Q[2]) / 2));
                    ctx.lineWidth = 1;
                    ctx.beginPath(); ctx.moveTo(P[0], P[1]); ctx.lineTo(Q[0], Q[1]); ctx.stroke();
                }
            });
            // outer field ring (flat, very faint)
            ctx.strokeStyle = rgba(ink, 0.05 * A);
            ctx.beginPath(); ctx.arc(W / 2, H / 2, this.scale * 1.12, 0, TAU); ctx.stroke();

            // lattice core: rotates on its own axis, counter to the camera drift
            const spin = this.time * 0.22;
            const lp = this.lattice.map((p, i) => {
                const grow = clamp(A * 1.6 - (i / this.lattice.length) * 0.6, 0, 1);
                const q = rot([p[0] * grow, p[1] * grow, p[2] * grow], -spin, 0.3, [0, 0, 0]);
                return this.project(q, [0, 0, 0, 0]);
            });
            ctx.lineWidth = 0.8;
            this.edges.forEach(([i, j]) => {
                const a = lp[i], b = lp[j];
                ctx.strokeStyle = rgba(ink, 0.2 * depthA((a[2] + b[2]) / 2) * A);
                ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
            });
            lp.forEach((p) => {
                ctx.fillStyle = rgba(ink, 0.55 * depthA(p[2]) * A);
                ctx.fillRect(p[0] - 0.9, p[1] - 0.9, 1.8, 1.8);
            });
            // nucleus
            this.project([0, 0, 0], P);
            ctx.fillStyle = rgba(acc, 0.9 * A);
            ctx.beginPath(); ctx.arc(P[0], P[1], 2.6, 0, TAU); ctx.fill();
            ctx.strokeStyle = rgba(acc, 0.35 * A);
            ctx.beginPath(); ctx.arc(P[0], P[1], 7 + Math.sin(this.time * 1.4) * 1.2, 0, TAU); ctx.stroke();
            const core = [P[0], P[1]];

            // stage positions
            const sp = this.nodes.map((n) => {
                const pr = this.project(this.stagePos(n, tmp), [0, 0, 0, 0]);
                pr[0] += n.mx; pr[1] += n.my;
                n.sx = pr[0]; n.sy = pr[1]; n.z = pr[2]; n.s = pr[3];
                return pr;
            });

            // spokes core → stage
            this.nodes.forEach((n, i) => {
                const on = n.id === focus;
                ctx.setLineDash([2, 5]);
                ctx.strokeStyle = on ? rgba(acc, 0.55) : rgba(ink, 0.1 * depthA(sp[i][2]) * this.spread.x);
                ctx.beginPath(); ctx.moveTo(core[0], core[1]); ctx.lineTo(sp[i][0], sp[i][1]); ctx.stroke();
                ctx.setLineDash([]);
            });

            // loop edges: curved, directional, bowing away from the core
            const loopCurve = (i) => {
                const a = sp[i], b = sp[(i + 1) % 5];
                const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
                const ox = mx - core[0], oy = my - core[1];
                const ol = Math.hypot(ox, oy) || 1;
                const bow = Math.hypot(b[0] - a[0], b[1] - a[1]) * 0.18;
                return { a, b, cx: mx + (ox / ol) * bow, cy: my + (oy / ol) * bow };
            };
            const qAt = (c, t) => {
                const u = 1 - t;
                return [u * u * c.a[0] + 2 * u * t * c.cx + t * t * c.b[0], u * u * c.a[1] + 2 * u * t * c.cy + t * t * c.b[1]];
            };
            for (let i = 0; i < 5; i++) {
                const c = loopCurve(i);
                const lit = focus && (this.nodes[i].id === focus || this.nodes[(i + 1) % 5].id === focus);
                const live = i === this.loopEdge && !this.reduced;
                ctx.strokeStyle = lit ? rgba(acc, 0.7) : rgba(ink, (live ? 0.3 : 0.18) * this.spread.x * depthA((c.a[2] + c.b[2]) / 2) * 1.4);
                ctx.lineWidth = lit ? 1.3 : 1;
                ctx.beginPath(); ctx.moveTo(c.a[0], c.a[1]); ctx.quadraticCurveTo(c.cx, c.cy, c.b[0], c.b[1]); ctx.stroke();
                // chevron at mid-curve
                const m = qAt(c, 0.5), m2 = qAt(c, 0.54);
                const dx = m2[0] - m[0], dy = m2[1] - m[1], dl = Math.hypot(dx, dy) || 1;
                const ux = dx / dl, uy = dy / dl;
                ctx.beginPath();
                ctx.moveTo(m[0] - ux * 4 - uy * 3, m[1] - uy * 4 + ux * 3);
                ctx.lineTo(m[0], m[1]);
                ctx.lineTo(m[0] - ux * 4 + uy * 3, m[1] - uy * 4 - ux * 3);
                ctx.stroke();
            }

            // packets
            const drawPacket = (x, y, a, r) => {
                ctx.fillStyle = rgba(acc, 0.18 * a);
                ctx.beginPath(); ctx.arc(x, y, r * 3, 0, TAU); ctx.fill();
                ctx.fillStyle = rgba(this.light ? acc : [255, 236, 214], a);
                ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
            };
            if (!this.reduced && this.spread.x > 0.9) {
                const c = loopCurve(this.loopEdge);
                const e = this.loopT < 0.5 ? 2 * this.loopT * this.loopT : 1 - Math.pow(-2 * this.loopT + 2, 2) / 2;
                const p = qAt(c, e);
                drawPacket(p[0], p[1], 1, 2.2);
                const tail = qAt(c, Math.max(0, e - 0.09));
                ctx.strokeStyle = rgba(acc, 0.5); ctx.lineWidth = 1.6;
                ctx.beginPath(); ctx.moveTo(tail[0], tail[1]); ctx.lineTo(p[0], p[1]); ctx.stroke();
            }
            this.packets.forEach((pk) => {
                if (pk.t < 0) return;
                if (pk.kind === 'spoke') {
                    const b = sp[pk.i];
                    drawPacket(core[0] + (b[0] - core[0]) * pk.t, core[1] + (b[1] - core[1]) * pk.t, 1 - pk.t * 0.3, 1.8);
                } else {
                    const p = qAt(loopCurve(pk.i), pk.t);
                    drawPacket(p[0], p[1], 1, 1.8);
                }
            });

            // stage nodes, back to front
            const order = this.nodes.slice().sort((a, b) => b.z - a.z);
            order.forEach((n) => {
                const on = n.id === focus;
                const a = depthA(n.z) * this.spread.x;
                const r = (3.2 + n.glow * 2.2) * (0.8 + n.s * 0.25);
                ctx.fillStyle = this.light ? '#f6f5f2' : '#0a0a0c';
                ctx.beginPath(); ctx.arc(n.sx, n.sy, r + 3, 0, TAU); ctx.fill();
                ctx.strokeStyle = on ? rgba(acc, 0.9) : rgba(ink, 0.55 * a + 0.15);
                ctx.lineWidth = 1.2;
                ctx.beginPath(); ctx.arc(n.sx, n.sy, r + 3, 0, TAU); ctx.stroke();
                ctx.fillStyle = on ? rgba(acc, 1) : rgba(ink, 0.85 * a + 0.1);
                ctx.beginPath(); ctx.arc(n.sx, n.sy, r * 0.55, 0, TAU); ctx.fill();
                if (n.glow > 0.02) {
                    ctx.strokeStyle = rgba(acc, 0.25 * clamp(n.glow, 0, 1));
                    ctx.beginPath(); ctx.arc(n.sx, n.sy, r + 9 + n.glow * 3, 0, TAU); ctx.stroke();
                }
                // DOM label follows the projected point, on the outer side of the core —
                // unless that would push it past the viewport edge
                if (!n.tagW) n.tagW = n.el.querySelector('.hx-node__tag').offsetWidth || 90;
                const vw = document.documentElement.clientWidth;
                const fx = (this.rect || this.fig.getBoundingClientRect()).left;
                let left = n.sx < W / 2;
                if (!left && fx + n.sx + 16 + n.tagW > vw - 8) left = true;
                if (left && fx + n.sx - 16 - n.tagW < 8) left = false;
                if (n._left !== left) { n.el.classList.toggle('is-left', left); n._left = left; }
                n.el.style.transform = `translate3d(${n.sx.toFixed(1)}px,${n.sy.toFixed(1)}px,0)`;
                // labels appear only once their stage has travelled out of the core (staggered)
                const reveal = clamp((this.spread.x - 0.75 - n.i * 0.03) / 0.2, 0, 1);
                n.el.style.opacity = String((clamp(0.45 + a * 0.6, 0, 1) * reveal).toFixed(3));
                n.el.style.zIndex = String(Math.round((2 - n.z) * 10));
            });
        }
    }

    function init() {
        const fig = document.querySelector('#hero .hx__visual');
        if (!fig) return;
        try {
            window.heroConstellation = new Constellation(fig);
        } catch (err) {
            console.warn('Hero constellation failed to initialise:', err);
        }
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
