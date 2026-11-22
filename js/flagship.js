/**
 * Flagship — three expanding architectural pillars (#flagship)
 *
 * State lives on the row, never on individual pillars:
 *   - pointer moving over a pillar makes it active (mouse only);
 *   - leaving the whole row collapses after a short grace delay;
 *   - tap / Enter / Space toggle; tap or focus outside collapses; Escape closes.
 * Pillar widths are flex-grow weights driven by damped springs, so switching mid-animation keeps
 * its momentum instead of restarting. On phones (≤760px) the row becomes a vertical accordion.
 * SVG animations in a pillar run only while it is open.
 */
(() => {
    'use strict';

    const INFER_CAPTIONS = {
        local: 'Routed to a small local draft model; a larger model verifies the draft before it streams.',
        cloud: 'Complex multi-step request: the draft path is bypassed and the request goes to cloud reasoning.',
        cache: 'The prompt prefix matches a cached KV entry, so repeated prefix tokens are not recomputed.'
    };

    function init() {
        const section = document.getElementById('flagship');
        const row = section && section.querySelector('[data-fx-row]');
        if (!row) return;

        const mqStack = window.matchMedia('(max-width: 760px)');
        const mqTablet = window.matchMedia('(max-width: 1000px)');
        const mqReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
        const pillars = Array.from(row.querySelectorAll('.fx-p')).map((el) => ({
            el,
            id: el.dataset.p,
            trigger: el.querySelector('.fx-p__trigger'),
            body: el.querySelector('.fx-p__body'),
            svgs: Array.from(el.querySelectorAll('svg.fx-viz')),
            w: 1,
            v: 0
        }));

        let active = null;
        let hovering = false;
        let leaveTimer = 0;
        let raf = 0;
        let last = 0;

        const activeWeight = () => (mqTablet.matches ? 4.4 : 3.3);

        /* ---------- spring-driven widths ---------- */
        function targetOf(p) {
            if (!active) return 1;
            return p.id === active ? activeWeight() : 1;
        }

        function paint() {
            pillars.forEach((p) => { p.el.style.flexGrow = mqStack.matches ? '' : p.w.toFixed(4); });
        }

        function step(now) {
            const dt = Math.min((now - last) / 1000, 1 / 30);
            last = now;
            let moving = false;
            pillars.forEach((p) => {
                const t = targetOf(p);
                const k = 190, c = 2 * Math.sqrt(k) * 0.8; // slightly under-damped: a physical settle
                p.v += (-k * (p.w - t) - c * p.v) * dt;
                p.w += p.v * dt;
                if (Math.abs(p.w - t) > 0.001 || Math.abs(p.v) > 0.001) moving = true;
                else { p.w = t; p.v = 0; }
            });
            paint();
            raf = moving ? requestAnimationFrame(step) : 0;
        }

        function animate() {
            if (mqStack.matches || mqReduced.matches) {
                pillars.forEach((p) => { p.w = targetOf(p); p.v = 0; });
                paint();
                return;
            }
            if (!raf) { last = performance.now(); raf = requestAnimationFrame(step); }
        }

        // the open body is laid out at its final width so text never reflows while the pillar grows
        function measure() {
            if (mqStack.matches) return;
            const w = row.clientWidth;
            const aw = activeWeight();
            row.style.setProperty('--fx-open', `${Math.round((w * aw) / (aw + 2))}px`);
        }

        /* ---------- state ---------- */
        function setActive(id) {
            if (active === id) return;
            active = id;
            row.classList.toggle('has-active', !!id);
            pillars.forEach((p) => {
                const on = p.id === id;
                p.el.classList.toggle('is-active', on);
                p.trigger.setAttribute('aria-expanded', on ? 'true' : 'false');
                // collapsed bodies leave the tab order and the accessibility tree
                if (on) p.body.removeAttribute('inert'); else p.body.setAttribute('inert', '');
                p.svgs.forEach((svg) => {
                    if (!svg.pauseAnimations) return;
                    if (on && !mqReduced.matches) svg.unpauseAnimations(); else svg.pauseAnimations();
                });
            });
            animate();
        }

        const pillarOf = (node) => {
            const el = node && node.closest ? node.closest('.fx-p') : null;
            return el ? pillars.find((p) => p.el === el) : null;
        };

        // hover is owned by the row: moving between pillars switches directly, gaps never collapse
        row.addEventListener('pointerover', (e) => {
            if (e.pointerType !== 'mouse' || mqStack.matches) return;
            hovering = true;
            clearTimeout(leaveTimer);
            const p = pillarOf(e.target);
            if (p) setActive(p.id);
        });
        row.addEventListener('pointerleave', (e) => {
            if (e.pointerType !== 'mouse' || mqStack.matches) return;
            hovering = false;
            clearTimeout(leaveTimer);
            // leaving the whole row always returns to the default state, even if a control inside
            // was clicked (that click leaves focus inside; the panel becomes inert and drops it)
            leaveTimer = setTimeout(() => { if (!hovering) setActive(null); }, 160);
        });

        // tap / keyboard. Safari's click events carry no pointerType, so remember it from pointerdown.
        let lastPointer = '';
        row.addEventListener('pointerdown', (e) => { lastPointer = e.pointerType; }, { passive: true });
        pillars.forEach((p) => {
            p.trigger.addEventListener('click', (e) => {
                const viaMouse = e.detail > 0 && lastPointer === 'mouse' && !mqStack.matches;
                if (viaMouse) { setActive(p.id); return; }
                setActive(active === p.id ? null : p.id);
                if (active === p.id && !mqStack.matches) {
                    const first = p.body.querySelector('button, [tabindex="0"]');
                    if (first && e.detail === 0) first.focus({ preventScroll: true });
                }
            });
        });
        document.addEventListener('pointerdown', (e) => {
            if (active && !row.contains(e.target) && e.pointerType !== 'mouse') setActive(null);
        });
        row.addEventListener('focusin', (e) => {
            const p = pillarOf(e.target);
            if (p && p.body.contains(e.target)) setActive(p.id);
        });
        row.addEventListener('focusout', () => {
            setTimeout(() => {
                if (!row.contains(document.activeElement) && !hovering) setActive(null);
            }, 0);
        });
        row.addEventListener('keydown', (e) => {
            if (e.key !== 'Escape' || !active) return;
            const p = pillars.find((x) => x.id === active);
            setActive(null);
            p.trigger.focus({ preventScroll: true });
        });

        /* ---------- Arbiter: inspect a node ---------- */
        const arb = section.querySelector('.fx-viz--arbiter');
        if (arb) {
            const cap = arb.parentElement.querySelector('.fx-viz__cap');
            const nodes = arb.querySelectorAll('.fxv-node');
            const show = (n) => {
                nodes.forEach((x) => x.classList.toggle('is-sel', x === n));
                cap.textContent = n.dataset.info;
            };
            nodes.forEach((n) => {
                n.addEventListener('pointerenter', () => show(n));
                n.addEventListener('focus', () => show(n));
                n.addEventListener('click', () => show(n));
                n.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(n); } });
            });
        }

        /* ---------- InferOpt: routing scenarios (radio group) ---------- */
        const inf = section.querySelector('.fx-viz--infer');
        if (inf) {
            const wrap = inf.parentElement;
            const cap = wrap.querySelector('.fx-viz__cap');
            const radios = Array.from(wrap.querySelectorAll('.fx-modes [data-mode]'));
            const setMode = (m, focus) => {
                inf.dataset.mode = m;
                cap.textContent = INFER_CAPTIONS[m];
                radios.forEach((r) => {
                    const on = r.dataset.mode === m;
                    r.setAttribute('aria-checked', on ? 'true' : 'false');
                    r.tabIndex = on ? 0 : -1;
                    if (on && focus) r.focus();
                });
            };
            radios.forEach((r, i) => {
                r.addEventListener('click', () => setMode(r.dataset.mode));
                r.addEventListener('keydown', (e) => {
                    const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
                    if (!d) return;
                    e.preventDefault();
                    setMode(radios[(i + d + radios.length) % radios.length].dataset.mode, true);
                });
            });
            setMode('local');
        }

        /* ---------- lifecycle ---------- */
        pillars.forEach((p) => {
            p.body.setAttribute('inert', '');
            p.svgs.forEach((svg) => { if (svg.pauseAnimations) svg.pauseAnimations(); });
        });
        measure();
        paint();
        const onLayout = () => { measure(); animate(); };
        if ('ResizeObserver' in window) new ResizeObserver(onLayout).observe(row);
        else window.addEventListener('resize', onLayout);
        [mqStack, mqTablet].forEach((mq) => mq.addEventListener && mq.addEventListener('change', onLayout));

        window.flagshipPillars = { setActive, get active() { return active; } };
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
