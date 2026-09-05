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
    initFluidContextualCursor();
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
   03. FLUID CONTEXTUAL CURSOR ENGINE (INSPECT / DRAG / LINK / DEFAULT)
   -------------------------------------------------------------------------- */
function initFluidContextualCursor() {
    const dot = document.getElementById('cursor-dot');
    const circle = document.getElementById('cursor-circle');
    const tag = document.getElementById('cursor-tag');
    const glow = document.getElementById('cursor-glow');

    if (!dot || !circle || window.matchMedia('(pointer: coarse)').matches) return;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let circleX = mouseX;
    let circleY = mouseY;
    let isHovering = false;

    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;

        dot.style.left = `${mouseX}px`;
        dot.style.top = `${mouseY}px`;

        if (glow) {
            glow.style.left = `${mouseX}px`;
            glow.style.top = `${mouseY}px`;
        }
    }, { passive: true });

    // Smooth spring follower
    function renderCursor() {
        circleX += (mouseX - circleX) * 0.18;
        circleY += (mouseY - circleY) * 0.18;

        circle.style.left = `${circleX}px`;
        circle.style.top = `${circleY}px`;

        requestAnimationFrame(renderCursor);
    }
    renderCursor();

    // Contextual Hover Delegations
    document.addEventListener('mouseover', (e) => {
        const target = e.target.closest('[data-cursor], a, button, .project-card, .philosophy-card, .timeline-card, .chapter-card, .arch-node, .desk-pill, .skill-bubble');
        if (!target) {
            resetCursor();
            return;
        }

        isHovering = true;
        const cursorType = target.getAttribute('data-cursor');

        if (cursorType === 'inspect') {
            circle.className = 'cursor-circle cursor-inspect has-tag';
            if (tag) tag.textContent = 'INSPECT';
        } else if (cursorType === 'drag') {
            circle.className = 'cursor-circle cursor-drag has-tag';
            if (tag) tag.textContent = 'DRAG';
        } else if (cursorType === 'link' || target.tagName === 'A' || target.tagName === 'BUTTON' || target.classList.contains('desk-pill')) {
            circle.className = 'cursor-circle cursor-link';
            if (tag) tag.textContent = '';
        } else {
            circle.className = 'cursor-circle cursor-link';
            if (tag) tag.textContent = '';
        }
    });

    document.addEventListener('mouseout', (e) => {
        const fromTarget = e.target.closest('[data-cursor], a, button, .project-card, .philosophy-card, .timeline-card, .chapter-card, .arch-node, .desk-pill, .skill-bubble');
        if (fromTarget && !e.relatedTarget?.closest('[data-cursor], a, button, .project-card, .philosophy-card, .timeline-card, .chapter-card, .arch-node, .desk-pill, .skill-bubble')) {
            resetCursor();
        }
    });

    function resetCursor() {
        isHovering = false;
        circle.className = 'cursor-circle';
        if (tag) tag.textContent = '';
    }

    document.addEventListener('mouseleave', () => {
        dot.style.opacity = '0';
        circle.style.opacity = '0';
        if (glow) glow.style.opacity = '0';
    });

    document.addEventListener('mouseenter', () => {
        dot.style.opacity = '1';
        circle.style.opacity = '1';
        if (glow) glow.style.opacity = '1';
    });
}

/* --------------------------------------------------------------------------
   04. MAGNETIC BUTTON & ELEMENT PHYSICS
   -------------------------------------------------------------------------- */
function initMagneticElements() {
    const magneticElements = document.querySelectorAll('.magnetic-btn, .nav-link, .social-pill, .modal-close');
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
    const cards = document.querySelectorAll('.philosophy-card, .about-main-card, .project-card, .capability-box, .timeline-card, .chapter-card');
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