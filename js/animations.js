/**
 * Suyash Tiwari — AI Systems & Infrastructure Portfolio
 * Cinematic Motion Engine: Lenis Smooth Scroll, GSAP, Contextual Cursor & Specular Physics
 */

document.addEventListener('DOMContentLoaded', () => {
    // Check reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Initialize Smooth Scroll Engine
    initLenisSmoothScroll(prefersReducedMotion);

    if (prefersReducedMotion) return;

    // Initialize Animation Systems
    initCustomPhysicsCursor();
    initMagneticElements();
    initSpecularCardTilt();
    initScrollReveal();
    initTextScramble();
    initNarrativeScrollProgress();
});

/* --------------------------------------------------------------------------
   01. LENIS SMOOTH SCROLL INTEGRATION WITH GSAP SCROLLTRIGGER
   -------------------------------------------------------------------------- */
function initLenisSmoothScroll(prefersReducedMotion) {
    if (prefersReducedMotion || typeof window.Lenis === 'undefined' || window.matchMedia('(pointer: coarse)').matches) {
        return;
    }

    try {
        const lenis = new window.Lenis({
            duration: 1.15,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            wheelMultiplier: 1.0,
            touchMultiplier: 1.5,
            infinite: false
        });

        window.lenis = lenis;

        // Hook into GSAP ScrollTrigger if available
        if (window.ScrollTrigger) {
            lenis.on('scroll', window.ScrollTrigger.update);

            if (window.gsap) {
                window.gsap.ticker.add((time) => {
                    lenis.raf(time * 1000);
                });
                window.gsap.ticker.lagSmoothing(0);
            }
        } else {
            function raf(time) {
                lenis.raf(time);
                requestAnimationFrame(raf);
            }
            requestAnimationFrame(raf);
        }

        // Anchor link smooth scrolling
        document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
            anchor.addEventListener('click', function (e) {
                const targetId = this.getAttribute('href');
                if (targetId && targetId !== '#') {
                    const targetEl = document.querySelector(targetId);
                    if (targetEl) {
                        e.preventDefault();
                        lenis.scrollTo(targetEl, { offset: -60, duration: 1.2 });
                    }
                }
            });
        });
    } catch (err) {
        console.warn('Lenis smooth scroll initialization skipped:', err);
    }
}

/* --------------------------------------------------------------------------
   02. TOP NARRATIVE SCROLL PROGRESS INDICATOR
   -------------------------------------------------------------------------- */
function initNarrativeScrollProgress() {
    const progressBar = document.getElementById('scroll-progress-bar');
    if (!progressBar) return;

    function updateProgress() {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
        progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
    }

    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();
}

/* --------------------------------------------------------------------------
   03. TARGETED CUSTOM PHYSICS CURSOR ENGINE
   -------------------------------------------------------------------------- */
function initCustomPhysicsCursor() {
    const cursor = document.getElementById('custom-cursor');
    const dot = document.getElementById('cursor-dot');
    const label = document.getElementById('cursor-label');

    if (!cursor || !dot || window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
    }

    let targetX = -100;
    let targetY = -100;
    let currX = -100;
    let currY = -100;
    let isInitialized = false;
    let isVisible = false;
    let animationFrameId = null;

    // Pointer move listener
    function onPointerMove(e) {
        targetX = e.clientX;
        targetY = e.clientY;

        if (!isInitialized) {
            currX = targetX;
            currY = targetY;
            cursor.style.transform = `translate3d(${currX}px, ${currY}px, 0)`;
            dot.style.opacity = '1';
            document.documentElement.classList.add('has-custom-cursor');
            isInitialized = true;
            isVisible = true;
            render();
            return;
        }

        if (!isVisible) {
            dot.classList.remove('is-hidden');
            isVisible = true;
        }

        // Check if pointer is over text input or textarea
        const targetEl = e.target && typeof e.target.closest === 'function' ? e.target : document.elementFromPoint(e.clientX, e.clientY);
        const isInput = targetEl && typeof targetEl.closest === 'function' && targetEl.closest('input, textarea, select, [contenteditable="true"]');
        if (isInput) {
            dot.classList.add('is-text-input');
        } else {
            dot.classList.remove('is-text-input');
        }
    }

    // Pointer down / up for tactile press response
    function onPointerDown(e) {
        const targetEl = e.target && typeof e.target.closest === 'function' ? e.target : document.elementFromPoint(e.clientX, e.clientY);
        const isInput = targetEl && typeof targetEl.closest === 'function' && targetEl.closest('input, textarea, select');
        if (!isInput) {
            dot.classList.add('is-pressed');
        }
    }

    function onPointerUp() {
        dot.classList.remove('is-pressed');
    }

    // Hover state management via event delegation
    const INTERACTIVE_SELECTOR = '[data-cursor], a, button, [role="button"], .rail-btn, .map-node, .console-nav-btn, .desk-pill, .journey-nav-tab, .stage-btn, .chapter-nav-btn, .social-pill, .interactive-node, .ppo-highlight-card, .vessel-rig, .rocket-rig, .space-pillar-card, .scene-canvas';

    function onPointerOver(e) {
        if (!e.target || typeof e.target.closest !== 'function') return;
        const target = e.target.closest(INTERACTIVE_SELECTOR);
        if (!target) return;

        const cursorAttr = (target.getAttribute('data-cursor') || '').toLowerCase().trim();
        const customLabel = target.getAttribute('data-cursor-label');

        // Reset previous states
        dot.classList.remove('is-hover-interactive', 'is-hover-accent', 'is-hover-inspect', 'is-hover-view', 'is-hover-read', 'is-hover-open', 'is-hover-drag', 'has-label');

        if (cursorAttr === 'inspect' || cursorAttr === 'explore') {
            dot.classList.add('is-hover-inspect', 'has-label');
            if (label) label.textContent = customLabel || (cursorAttr === 'explore' ? 'EXPLORE' : 'INSPECT');
        } else if (cursorAttr === 'view') {
            dot.classList.add('is-hover-view', 'has-label');
            if (label) label.textContent = customLabel || 'VIEW';
        } else if (cursorAttr === 'read') {
            dot.classList.add('is-hover-read', 'has-label');
            if (label) label.textContent = customLabel || 'READ';
        } else if (cursorAttr === 'open') {
            dot.classList.add('is-hover-open', 'has-label');
            if (label) label.textContent = customLabel || 'OPEN';
        } else if (cursorAttr === 'drag') {
            dot.classList.add('is-hover-drag', 'has-label');
            if (label) label.textContent = customLabel || 'DRAG';
        } else if (customLabel) {
            dot.classList.add('is-hover-inspect', 'has-label');
            if (label) label.textContent = customLabel;
        } else if (target.tagName === 'A' && target.getAttribute('target') === '_blank') {
            dot.classList.add('is-hover-open', 'has-label');
            if (label) label.textContent = 'OPEN';
        } else {
            // Standard clickable interactive element: intentional smooth orange outline expansion
            dot.classList.add('is-hover-interactive');
            if (label) label.textContent = '';
        }
    }

    function onPointerOut(e) {
        if (!e.target || typeof e.target.closest !== 'function') return;
        const fromTarget = e.target.closest(INTERACTIVE_SELECTOR);
        const toTarget = e.relatedTarget && typeof e.relatedTarget.closest === 'function' ? e.relatedTarget.closest(INTERACTIVE_SELECTOR) : null;
        if (fromTarget && !toTarget) {
            dot.classList.remove('is-hover-interactive', 'is-hover-accent', 'is-hover-inspect', 'is-hover-view', 'is-hover-read', 'is-hover-open', 'is-hover-drag', 'has-label');
            if (label) label.textContent = '';
        }
    }

    function onPointerLeave() {
        isVisible = false;
        dot.classList.add('is-hidden');
    }

    function onPointerEnter(e) {
        targetX = e.clientX;
        targetY = e.clientY;
        isVisible = true;
        dot.classList.remove('is-hidden');
    }

    // High performance rAF loop with spring-like 0.28 damping lerp
    function render() {
        const dx = targetX - currX;
        const dy = targetY - currY;

        // Lerp update
        currX += dx * 0.28;
        currY += dy * 0.28;

        cursor.style.transform = `translate3d(${currX}px, ${currY}px, 0)`;

        animationFrameId = requestAnimationFrame(render);
    }

    // Bind event listeners
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { passive: true });
    document.addEventListener('mouseover', onPointerOver, { passive: true });
    document.addEventListener('mouseout', onPointerOut, { passive: true });
    document.addEventListener('pointerleave', onPointerLeave);
    document.addEventListener('pointerenter', onPointerEnter);
}

/* --------------------------------------------------------------------------
   04. MAGNETIC BUTTON & ELEMENT PHYSICS
   -------------------------------------------------------------------------- */
function initMagneticElements() {
    const magneticElements = document.querySelectorAll('.magnetic-btn, .nav-link, .social-pill, .modal-close, .stage-btn');
    if (!window.gsap) return;

    magneticElements.forEach(el => {
        el.addEventListener('mousemove', (e) => {
            const rect = el.getBoundingClientRect();
            const x = e.clientX - (rect.left + rect.width / 2);
            const y = e.clientY - (rect.top + rect.height / 2);

            gsap.to(el, {
                x: x * 0.32,
                y: y * 0.32,
                duration: 0.3,
                ease: 'power2.out'
            });
        });

        el.addEventListener('mouseleave', () => {
            gsap.to(el, {
                x: 0,
                y: 0,
                duration: 0.6,
                ease: 'elastic.out(1, 0.35)'
            });
        });
    });
}

/* --------------------------------------------------------------------------
   05. SPECULAR GLARE & 3D CARD PERSPECTIVE TILT
   -------------------------------------------------------------------------- */
function initSpecularCardTilt() {
    const cards = document.querySelectorAll('.philosophy-card, .about-main-card, .project-card, .capability-box, .timeline-card, .chapter-card, .space-pillar-card, .ppo-highlight-card, .stage-metric-box');
    if (!window.gsap) return;

    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Set CSS custom properties for specular dynamic lighting sheen
            card.style.setProperty('--mouse-x', `${(x / rect.width) * 100}%`);
            card.style.setProperty('--mouse-y', `${(y / rect.height) * 100}%`);

            const percentX = (x / rect.width) - 0.5;
            const percentY = (y / rect.height) - 0.5;

            const rotateY = percentX * 8;
            const rotateX = percentY * -8;

            gsap.to(card, {
                rotationX: rotateX,
                rotationY: rotateY,
                transformPerspective: 1200,
                duration: 0.35,
                ease: 'power2.out'
            });
        });

        card.addEventListener('mouseleave', () => {
            gsap.to(card, {
                rotationX: 0,
                rotationY: 0,
                duration: 0.7,
                ease: 'elastic.out(1, 0.4)'
            });
        });
    });
}

/* --------------------------------------------------------------------------
   06. GSAP SCROLLTRIGGER PROGRESSIVE REVEALS
   -------------------------------------------------------------------------- */
function initScrollReveal() {
    if (!window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);

    const revealElements = document.querySelectorAll('[data-reveal]');
    revealElements.forEach((el) => {
        gsap.fromTo(el,
            {
                opacity: 0,
                y: 35
            },
            {
                opacity: 1,
                y: 0,
                duration: 0.85,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: el,
                    start: 'top 88%',
                    toggleActions: 'play none none none'
                }
            }
        );
    });
}

/* --------------------------------------------------------------------------
   07. TEXT SCRAMBLE CYBER DECODER EFFECT
   -------------------------------------------------------------------------- */
class TextScrambleEffect {
    constructor(el) {
        this.el = el;
        this.chars = '!<>-_\\/[]{}—=+*^?#________';
        this.update = this.update.bind(this);
    }

    setText(newText) {
        const oldText = this.el.innerText;
        const length = Math.max(oldText.length, newText.length);
        const promise = new Promise(resolve => this.resolve = resolve);
        this.queue = [];

        for (let i = 0; i < length; i++) {
            const from = oldText[i] || '';
            const to = newText[i] || '';
            const start = Math.floor(Math.random() * 25);
            const end = start + Math.floor(Math.random() * 25);
            this.queue.push({ from, to, start, end });
        }

        cancelAnimationFrame(this.frameRequest);
        this.frame = 0;
        this.update();
        return promise;
    }

    update() {
        let output = '';
        let complete = 0;

        for (let i = 0, n = this.queue.length; i < n; i++) {
            let { from, to, start, end, char } = this.queue[i];

            if (this.frame >= end) {
                complete++;
                output += to;
            } else if (this.frame >= start) {
                if (!char || Math.random() < 0.28) {
                    char = this.randomChar();
                    this.queue[i].char = char;
                }
                output += `<span style="color: var(--accent-orange);">${char}</span>`;
            } else {
                output += from;
            }
        }

        this.el.innerHTML = output;

        if (complete === this.queue.length) {
            this.resolve();
        } else {
            this.frameRequest = requestAnimationFrame(this.update);
            this.frame++;
        }
    }

    randomChar() {
        return this.chars[Math.floor(Math.random() * this.chars.length)];
    }
}

function initTextScramble() {
    const glitchEl = document.querySelector('.glitch-text');
    if (!glitchEl) return;

    const scrambler = new TextScrambleEffect(glitchEl);
    setTimeout(() => {
        scrambler.setText('Suyash Tiwari');
    }, 300);
}