/**
 * Journey kit — shared primitives for the Professional Journey laboratories.
 *   JKit.spring      damped-spring step (semi-implicit Euler, mass = 1)
 *   JKit.Loop        rAF loop that only runs while its element is on screen and the tab is visible
 *   JKit.canvas      DPR-aware canvas sizing
 *   JKit.tabs        roving-tabindex keyboard tabs (arrow keys / Home / End)
 *   JKit.h           tiny HTML → element helper
 * Labs register themselves on window.JLabs and are mounted lazily by journey.js.
 */
(() => {
    'use strict';

    const mqReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mqFine = window.matchMedia('(hover: hover) and (pointer: fine)');

    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    const lerp = (a, b, t) => a + (b - a) * t;
    const easeOut = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
    const easeInOut = (t) => { t = clamp(t, 0, 1); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };

    function spring(o, p, v, target, k, z, dt) {
        const c = 2 * Math.sqrt(k) * z;
        o[v] += (-k * (o[p] - target) - c * o[v]) * dt;
        o[p] += o[v] * dt;
    }

    function h(html) {
        const t = document.createElement('template');
        t.innerHTML = html.trim();
        return t.content.firstElementChild;
    }

    const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    /** Visibility-gated animation loop. fn(dt, t) returns false to request stopping. */
    class Loop {
        constructor(el, fn) {
            this.el = el;
            this.fn = fn;
            this.raf = 0;
            this.visible = false;
            this.wanted = false;
            this.t = 0;
            this.last = 0;
            this._tick = (now) => this.tick(now);
            if ('IntersectionObserver' in window) {
                this.io = new IntersectionObserver((en) => {
                    this.visible = en[0].isIntersecting;
                    this.sync();
                }, { rootMargin: '80px' });
                this.io.observe(el);
            } else {
                this.visible = true;
            }
            this._vis = () => this.sync();
            document.addEventListener('visibilitychange', this._vis);
        }
        start() { this.wanted = true; this.sync(); }
        stop() { this.wanted = false; this.sync(); }
        sync() {
            const run = this.wanted && this.visible && !document.hidden;
            if (run && !this.raf) {
                this.last = performance.now();
                this.raf = requestAnimationFrame(this._tick);
            } else if (!run && this.raf) {
                cancelAnimationFrame(this.raf);
                this.raf = 0;
            }
        }
        tick(now) {
            this.raf = 0;
            const dt = Math.min((now - this.last) / 1000, 1 / 30);
            this.last = now;
            this.t += dt;
            const keep = this.fn(dt, this.t);
            if (keep === false) { this.wanted = false; return; }
            if (this.wanted && this.visible && !document.hidden) this.raf = requestAnimationFrame(this._tick);
        }
        destroy() {
            this.stop();
            if (this.io) this.io.disconnect();
            document.removeEventListener('visibilitychange', this._vis);
        }
    }

    /** Size a canvas to its CSS box at device pixel ratio. Returns a handle with ctx, w, h. */
    function canvas(cv, maxDpr = 2) {
        const ctx = cv.getContext ? cv.getContext('2d') : null;
        const hd = { cv, ctx, w: 0, h: 0, dpr: 1 };
        hd.resize = () => {
            const r = cv.getBoundingClientRect();
            if (!r.width || !r.height) return false;
            const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
            hd.w = r.width; hd.h = r.height; hd.dpr = dpr;
            cv.width = Math.round(r.width * dpr);
            cv.height = Math.round(r.height * dpr);
            if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            return true;
        };
        hd.clear = () => { if (ctx) { ctx.setTransform(hd.dpr, 0, 0, hd.dpr, 0, 0); ctx.clearRect(0, 0, hd.w, hd.h); } };
        hd.resize();
        return hd;
    }

    function onResize(el, fn) {
        if ('ResizeObserver' in window) {
            let p = 0;
            const ro = new ResizeObserver(() => { cancelAnimationFrame(p); p = requestAnimationFrame(fn); });
            ro.observe(el);
            return () => ro.disconnect();
        }
        window.addEventListener('resize', fn);
        return () => window.removeEventListener('resize', fn);
    }

    /**
     * Keyboard-accessible tabs. `list` contains [role=tab] buttons with data-key.
     * onSelect(key, {fromKeyboard}) is called on activation.
     */
    function tabs(list, onSelect) {
        const all = () => Array.from(list.querySelectorAll('[role="tab"]'));
        const select = (btn, opts = {}) => {
            all().forEach((b) => {
                const on = b === btn;
                b.setAttribute('aria-selected', on ? 'true' : 'false');
                b.tabIndex = on ? 0 : -1;
                b.classList.toggle('is-active', on);
            });
            onSelect(btn.dataset.key, opts);
        };
        list.addEventListener('click', (e) => {
            const b = e.target.closest('[role="tab"]');
            if (b && list.contains(b)) select(b);
        });
        list.addEventListener('keydown', (e) => {
            const items = all();
            const i = items.indexOf(document.activeElement);
            if (i < 0) return;
            let n = -1;
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (i + 1) % items.length;
            else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (i - 1 + items.length) % items.length;
            else if (e.key === 'Home') n = 0;
            else if (e.key === 'End') n = items.length - 1;
            if (n < 0) return;
            e.preventDefault();
            items[n].focus();
            select(items[n], { fromKeyboard: true });
        });
        return {
            select: (key) => { const b = all().find((x) => x.dataset.key === key); if (b) select(b); }
        };
    }

    const fmt = (n) => Math.round(n).toLocaleString('en-US');

    window.JKit = {
        clamp, lerp, easeOut, easeInOut, spring, h, esc, Loop, canvas, onResize, tabs, fmt,
        get reduced() { return mqReduced.matches; },
        get fine() { return mqFine.matches; },
        mqReduced
    };
    window.JLabs = window.JLabs || {};
})();
