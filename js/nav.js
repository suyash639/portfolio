/**
 * Global navigation (#main-header) — the single owner of header behaviour.
 *  - scroll state: integrated at the top, compact floating surface once scrolled
 *  - active section: IntersectionObserver-triggered, resolved deterministically from section
 *    positions (no flicker); a spring moves the indicator between links
 *  - anchor navigation: one offset (window.navOffset) shared with the Lenis handler
 *  - mobile menu: dialog with focus trap, Escape, scroll lock, closes after navigating
 *  - subtle magnetic response on the brand mark and CTA (fine pointers only)
 */
(() => {
    'use strict';

    function init() {
        const header = document.getElementById('main-header');
        if (!header || !header.classList.contains('nv')) return;

        const mqReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
        const mqFine = window.matchMedia('(hover: hover) and (pointer: fine)');
        const mqCompact = window.matchMedia('(max-width: 1060px)');

        const nav = header.querySelector('.nv__nav');
        const links = Array.from(header.querySelectorAll('.nv__link'));
        const hoverEl = header.querySelector('.nv__hover');
        const ind = header.querySelector('.nv__ind');
        const cta = header.querySelector('.nv__cta');
        const brand = header.querySelector('.nv__brand');
        const menu = document.getElementById('nv-menu');
        const menuBtn = header.querySelector('.nv__menu-btn');
        const menuLabel = header.querySelector('.nv__menu-label');
        const menuLinks = Array.from(header.querySelectorAll('.nv-menu__link'));

        // compact bar (54px) + its top inset (10px) + breathing room
        const OFFSET = 72;
        window.navOffset = () => (mqCompact.matches && window.innerWidth <= 560 ? 68 : OFFSET);

        /* ---------- scroll state ---------- */
        let ticking = false;
        const syncScrolled = () => {
            ticking = false;
            header.classList.toggle('is-scrolled', window.scrollY > 24);
        };
        window.addEventListener('scroll', () => {
            if (!ticking) { ticking = true; requestAnimationFrame(syncScrolled); }
        }, { passive: true });
        syncScrolled();

        /* ---------- indicator spring ---------- */
        const s = { x: 0, w: 0, vx: 0, vw: 0, tx: 0, tw: 0, init: false };
        let raf = 0;
        let last = 0;
        const paint = () => {
            ind.style.transform = `translate3d(${s.x.toFixed(2)}px,0,0)`;
            ind.style.width = `${Math.max(0, s.w).toFixed(2)}px`;
        };
        const step = (now) => {
            const dt = Math.min((now - last) / 1000, 1 / 30);
            last = now;
            const k = 260, c = 2 * Math.sqrt(k) * 0.82;
            s.vx += (-k * (s.x - s.tx) - c * s.vx) * dt; s.x += s.vx * dt;
            s.vw += (-k * (s.w - s.tw) - c * s.vw) * dt; s.w += s.vw * dt;
            paint();
            const moving = Math.abs(s.x - s.tx) > 0.05 || Math.abs(s.w - s.tw) > 0.05 || Math.abs(s.vx) > 0.05;
            raf = moving ? requestAnimationFrame(step) : 0;
            if (!moving) { s.x = s.tx; s.w = s.tw; paint(); }
        };
        const measure = (link) => {
            const nr = nav.getBoundingClientRect();
            const r = link.getBoundingClientRect();
            const pad = parseFloat(getComputedStyle(link).paddingLeft) || 12;
            return { x: r.left - nr.left + pad, w: r.width - pad * 2, hx: r.left - nr.left, hw: r.width };
        };
        const moveIndicator = (link, instant) => {
            if (!link || mqCompact.matches) return;
            const m = measure(link);
            s.tx = m.x; s.tw = m.w;
            if (instant || !s.init || mqReduced.matches) {
                s.x = s.tx; s.w = s.tw; s.vx = s.vw = 0; s.init = true; paint(); return;
            }
            if (!raf) { last = performance.now(); raf = requestAnimationFrame(step); }
        };

        /* ---------- active section ---------- */
        const ids = ['hero', ...links.map((l) => l.getAttribute('href').slice(1)), 'contact'];
        const sections = ids.map((id) => document.getElementById(id)).filter(Boolean);
        let active = null;

        function setActive(id) {
            if (id === active) return;
            active = id;
            let current = null;
            links.forEach((l) => {
                const on = l.getAttribute('href') === `#${id}`;
                if (on) { l.setAttribute('aria-current', 'true'); current = l; } else l.removeAttribute('aria-current');
            });
            menuLinks.forEach((l) => {
                if (l.getAttribute('href') === `#${id}`) l.setAttribute('aria-current', 'true'); else l.removeAttribute('aria-current');
            });
            if (cta) { if (id === 'contact') cta.setAttribute('aria-current', 'true'); else cta.removeAttribute('aria-current'); }
            nav.classList.toggle('has-active', !!current);
            if (current) moveIndicator(current, !nav.classList.contains('was-active'));
            nav.classList.toggle('was-active', !!current);
        }

        // The section whose top has passed a reading line (just under the bar) is active.
        // Positions are monotonic with scroll, so the result cannot flicker between neighbours.
        function resolve() {
            const line = window.navOffset() + window.innerHeight * 0.18;
            let id = sections[0] ? sections[0].id : null;
            for (const sec of sections) {
                if (sec.getBoundingClientRect().top <= line) id = sec.id;
            }
            // reaching the very bottom means the last section is in view
            if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) id = sections[sections.length - 1].id;
            setActive(id);
        }

        if ('IntersectionObserver' in window) {
            const io = new IntersectionObserver(() => resolve(), {
                rootMargin: `-${OFFSET}px 0px -60% 0px`,
                threshold: [0, 1]
            });
            sections.forEach((sec) => io.observe(sec));
        }
        // cheap safety net for long sections and fast jumps (rAF-throttled)
        let rTick = false;
        window.addEventListener('scroll', () => {
            if (!rTick) { rTick = true; requestAnimationFrame(() => { rTick = false; resolve(); }); }
        }, { passive: true });

        /* ---------- hover illumination ---------- */
        links.forEach((l) => {
            l.addEventListener('pointerenter', () => {
                const m = measure(l);
                hoverEl.style.transform = `translate3d(${m.hx}px,0,0)`;
                hoverEl.style.width = `${m.hw}px`;
                nav.classList.add('is-hovering');
            });
        });
        nav.addEventListener('pointerleave', () => nav.classList.remove('is-hovering'));

        /* ---------- anchor navigation ---------- */
        function scrollToTarget(hash, viaKeyboard) {
            const target = document.querySelector(hash);
            if (!target) return;
            const offset = hash === '#hero' ? 0 : window.navOffset();
            if (window.lenis && typeof window.lenis.scrollTo === 'function') {
                window.lenis.scrollTo(target, { offset: -offset, duration: 1.1 });
            } else {
                const top = target.getBoundingClientRect().top + window.scrollY - offset;
                window.scrollTo({ top, behavior: mqReduced.matches ? 'auto' : 'smooth' });
            }
            if (viaKeyboard) {
                // keyboard users continue from the section they jumped to
                if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
                target.focus({ preventScroll: true });
            }
        }

        header.addEventListener('click', (e) => {
            const a = e.target.closest('a[href^="#"]');
            if (!a || !header.contains(a)) return;
            const hash = a.getAttribute('href');
            if (hash.length < 2) return;
            e.preventDefault();
            const viaKeyboard = e.detail === 0;
            if (header.classList.contains('menu-open')) {
                closeMenu(false);
                // let the menu start retracting, then travel
                setTimeout(() => scrollToTarget(hash, viaKeyboard), mqReduced.matches ? 0 : 120);
            } else {
                scrollToTarget(hash, viaKeyboard);
            }
        });

        /* ---------- magnetic brand + CTA (subtle) ---------- */
        [[brand, 0.16], [cta, 0.2]].forEach(([el, f]) => {
            if (!el) return;
            el.addEventListener('pointermove', (e) => {
                if (!mqFine.matches || mqReduced.matches) return;
                const r = el.getBoundingClientRect();
                const dx = e.clientX - (r.left + r.width / 2);
                const dy = e.clientY - (r.top + r.height / 2);
                el.style.transform = `translate(${(dx * f).toFixed(1)}px,${(dy * f * 1.2).toFixed(1)}px)`;
            });
            el.addEventListener('pointerleave', () => { el.style.transform = ''; });
        });

        /* ---------- mobile menu ---------- */
        let closeTimer = 0;
        const focusables = () => [brand, menuBtn, ...menu.querySelectorAll('a, button')].filter((x) => x && x.offsetParent !== null);

        function openMenu() {
            clearTimeout(closeTimer);
            menu.hidden = false;
            menu.querySelectorAll('.nv-menu__list li').forEach((li, i) => li.style.setProperty('--i', i));
            void menu.offsetWidth;
            header.classList.add('menu-open');
            menuBtn.setAttribute('aria-expanded', 'true');
            menuLabel.textContent = 'Close';
            document.documentElement.style.overflow = 'hidden';
            if (window.lenis && window.lenis.stop) window.lenis.stop();
            const cur = menu.querySelector('[aria-current="true"]') || menuLinks[0];
            setTimeout(() => cur && cur.focus({ preventScroll: true }), mqReduced.matches ? 0 : 200);
        }

        function closeMenu(returnFocus) {
            if (!header.classList.contains('menu-open')) return;
            header.classList.remove('menu-open');
            menuBtn.setAttribute('aria-expanded', 'false');
            menuLabel.textContent = 'Menu';
            document.documentElement.style.overflow = '';
            if (window.lenis && window.lenis.start) window.lenis.start();
            closeTimer = setTimeout(() => { menu.hidden = true; }, mqReduced.matches ? 0 : 560);
            if (returnFocus) menuBtn.focus({ preventScroll: true });
        }

        menuBtn.addEventListener('click', () => {
            if (header.classList.contains('menu-open')) closeMenu(true); else openMenu();
        });

        document.addEventListener('keydown', (e) => {
            if (!header.classList.contains('menu-open')) return;
            if (e.key === 'Escape') { e.preventDefault(); closeMenu(true); return; }
            if (e.key !== 'Tab') return;
            const f = focusables();
            if (!f.length) return;
            const first = f[0], lastEl = f[f.length - 1];
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastEl.focus(); }
            else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); first.focus(); }
        });

        /* ---------- layout changes ---------- */
        const relayout = () => {
            if (!mqCompact.matches && header.classList.contains('menu-open')) closeMenu(false);
            const cur = links.find((l) => l.getAttribute('aria-current') === 'true');
            if (cur) moveIndicator(cur, true);
        };
        window.addEventListener('resize', relayout, { passive: true });
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);

        resolve();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
