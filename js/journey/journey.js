/**
 * Professional Journey — chapter navigator.
 * Timeline tabs with a spring-driven progress marker, per-environment lighting,
 * and lazy mounting of each laboratory (js/journey/lab-*.js) on first view.
 */
(() => {
    'use strict';
    const K = window.JKit;

    function init() {
        const section = document.getElementById('experience');
        if (!section || !section.classList.contains('jr') || !K) return;

        const list = section.querySelector('.jr-nav__list');
        const track = section.querySelector('.jr-nav__track');
        const fill = section.querySelector('.jr-nav__fill');
        const marker = section.querySelector('.jr-nav__marker');
        const tabsEls = Array.from(list.querySelectorAll('.jr-tab'));
        const panes = new Map(Array.from(section.querySelectorAll('.jr-ch')).map((p) => [p.dataset.env, p]));
        const order = tabsEls.map((t) => t.dataset.chapter);
        tabsEls.forEach((t) => { t.dataset.key = t.dataset.chapter; });

        const labs = new Map(); // key -> lab instance
        let current = order[0];
        let near = false;
        let swapTimer = 0;

        /* ---------- lazy lab mounting ---------- */
        function ensureLab(key) {
            if (labs.has(key) || !near) return labs.get(key);
            const def = window.JLabs[key];
            const root = panes.get(key).querySelector('.jr-lab');
            if (!def || !root) return null;
            try {
                const inst = def.mount(root);
                labs.set(key, inst);
                return inst;
            } catch (err) {
                console.warn(`Journey lab "${key}" failed to mount:`, err);
                labs.set(key, null);
                return null;
            }
        }

        // Mount the visible lab on idle right after load rather than on approach: mounting adds
        // ~1,000–1,500px to this section, and doing it mid-navigation shifted every anchor below
        // (e.g. the nav's #flagship link landed far past its target). Loops still only run on screen.
        const mountNow = () => {
            if (near) return;
            near = true;
            const inst = ensureLab(current);
            if (inst && inst.activate) inst.activate();
        };
        if ('requestIdleCallback' in window) requestIdleCallback(mountNow, { timeout: 1200 });
        else setTimeout(mountNow, 300);

        /* ---------- progress marker (spring) ---------- */
        const m = { x: 0, v: 0, target: 0 };
        function markerTarget() {
            // the marker lands where the active chapter's vertical rule meets the timeline
            const tab = tabsEls[order.indexOf(current)];
            const body = tab.querySelector('.jr-tab__body');
            const tr = track.getBoundingClientRect();
            return body.getBoundingClientRect().left - tr.left;
        }
        function paintMarker() {
            marker.style.transform = `translate3d(${m.x.toFixed(2)}px,0,0)`;
            fill.style.transform = `scaleX(${Math.max(0, m.x / (track.clientWidth || 1)).toFixed(4)})`;
        }
        const loop = new K.Loop(track, (dt) => {
            K.spring(m, 'x', 'v', m.target, 120, 0.62, dt);
            paintMarker();
            return !(Math.abs(m.x - m.target) < 0.1 && Math.abs(m.v) < 0.1);
        });
        function moveMarker(instant) {
            m.target = markerTarget();
            if (instant || K.reduced) {
                m.x = m.target; m.v = 0; paintMarker();
            } else {
                loop.start();
            }
        }
        K.onResize(track, () => moveMarker(true));
        requestAnimationFrame(() => moveMarker(true));

        /* ---------- chapter switching ---------- */
        function show(key, opts = {}) {
            if (!panes.has(key)) return;
            const prev = current;
            if (key === prev && !opts.force) return;
            current = key;
            section.dataset.env = key;
            moveMarker(false);

            const prevPane = panes.get(prev);
            const nextPane = panes.get(key);
            const prevLab = labs.get(prev);
            if (prevLab && prevLab.deactivate) prevLab.deactivate();

            clearTimeout(swapTimer);
            const enter = () => {
                panes.forEach((p, k) => {
                    if (k !== key) { p.hidden = true; p.classList.remove('is-leaving', 'is-entering'); }
                });
                nextPane.hidden = false;
                nextPane.classList.remove('is-leaving');
                if (!K.reduced) {
                    nextPane.classList.remove('is-entering');
                    void nextPane.offsetWidth;
                    nextPane.classList.add('is-entering');
                }
                const inst = ensureLab(key);
                if (inst && inst.activate) inst.activate();
                if (opts.focusPane) nextPane.focus({ preventScroll: true });
            };
            if (prev !== key && !K.reduced && prevPane && !prevPane.hidden) {
                prevPane.classList.add('is-leaving');
                swapTimer = setTimeout(enter, 170);
            } else {
                enter();
            }
        }

        const tabCtl = K.tabs(list, (key) => show(key));

        // Prev / next footers: switch, then bring the chapter start into view (never hijacks wheel scrolling)
        section.addEventListener('click', (e) => {
            const b = e.target.closest('[data-goto]');
            if (!b) return;
            const key = b.dataset.goto;
            tabCtl.select(key);
            const nav = section.querySelector('.jr-nav');
            const top = nav.getBoundingClientRect().top;
            if (top < 0 || top > window.innerHeight * 0.6) {
                if (window.lenis && typeof window.lenis.scrollTo === 'function') {
                    window.lenis.scrollTo(nav, { offset: -90, duration: 0.9 });
                } else {
                    window.scrollTo({ top: window.scrollY + top - 90, behavior: K.reduced ? 'auto' : 'smooth' });
                }
            }
            setTimeout(() => panes.get(key).focus({ preventScroll: true }), 200);
        });

        // Deep link: #experience-nasa etc.
        const m2 = /^#experience-(\w+)$/.exec(location.hash);
        if (m2 && panes.has(m2[1])) tabCtl.select(m2[1]);

        window.journey = { show: (k) => tabCtl.select(k), labs };
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
