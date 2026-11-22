/**
 * Engineer Profile (#about)
 *  - One-time entry reveal when the section scrolls into view (never replays).
 *  - Monogram depth response: the construction plane, guides and glyph layers shift by different
 *    amounts and the mark tilts toward the pointer, with a light that follows it. Damped springs
 *    drive everything; the rAF loop runs only while the springs are settling.
 */
(() => {
    'use strict';

    function init() {
        const section = document.getElementById('about');
        if (!section || !section.classList.contains('pf')) return;
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // reveal
        section.classList.add('js-pf');
        if (reduced || !('IntersectionObserver' in window)) {
            section.classList.add('is-in');
        } else {
            const io = new IntersectionObserver((en) => {
                if (en.some((e) => e.isIntersecting)) { section.classList.add('is-in'); io.disconnect(); }
            }, { threshold: 0.18 });
            io.observe(section);
        }

        // monogram depth
        const mark = section.querySelector('.pf-mark');
        const zone = section.querySelector('.pf__id-row');
        if (!mark || !zone || reduced || !window.matchMedia('(hover: hover)').matches) return;
        const layers = [
            [mark.querySelector('.pf-mark__l1'), -3],
            [mark.querySelector('.pf-mark__l2'), 2],
            [mark.querySelector('.pf-mark__l3'), 5]
        ];
        const s = { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0 };
        let raf = 0;
        let last = 0;
        const step = (now) => {
            const dt = Math.min((now - last) / 1000, 1 / 30);
            last = now;
            const k = 120, c = 2 * Math.sqrt(k) * 0.62;
            s.vx += (-k * (s.x - s.tx) - c * s.vx) * dt; s.x += s.vx * dt;
            s.vy += (-k * (s.y - s.ty) - c * s.vy) * dt; s.y += s.vy * dt;
            mark.style.setProperty('--ry', `${(s.x * 9).toFixed(2)}deg`);
            mark.style.setProperty('--rx', `${(-s.y * 9).toFixed(2)}deg`);
            mark.style.setProperty('--lx', `${(50 + s.x * 45).toFixed(1)}%`);
            mark.style.setProperty('--ly', `${(50 + s.y * 45).toFixed(1)}%`);
            layers.forEach(([el, d]) => { if (el) el.style.transform = `translate(${(s.x * d).toFixed(2)}px,${(s.y * d).toFixed(2)}px)`; });
            const moving = Math.abs(s.x - s.tx) > 0.001 || Math.abs(s.y - s.ty) > 0.001 || Math.abs(s.vx) > 0.001 || Math.abs(s.vy) > 0.001;
            raf = moving ? requestAnimationFrame(step) : 0;
        };
        const kick = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(step); } };

        zone.addEventListener('pointermove', (e) => {
            if (e.pointerType !== 'mouse') return;
            const r = mark.getBoundingClientRect();
            s.tx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width * 1.4)));
            s.ty = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height * 1.4)));
            kick();
        }, { passive: true });
        zone.addEventListener('pointerleave', () => { s.tx = 0; s.ty = 0; kick(); }, { passive: true });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
