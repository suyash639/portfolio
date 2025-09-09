// Animations JavaScript file for Suyash Tiwari's Portfolio

document.addEventListener('DOMContentLoaded', () => {
    // Initialize animations
    initCursorEffects();
    initCardTiltEffects();
    initMagneticElements();
    initParallaxEffects();
});

// Cursor Effects
function initCursorEffects() {
    const cursorDot = document.querySelector('.cursor-dot');
    const cursorCircle = document.querySelector('.cursor-circle');
    
    // Track mouse movement
    document.addEventListener('mousemove', e => {
        // Add spring physics to cursor movement
        gsap.to(cursorDot, {
            x: e.clientX,
            y: e.clientY,
            duration: 0.1,
            ease: 'power2.out'
        });
        
        gsap.to(cursorCircle, {
            x: e.clientX,
            y: e.clientY,
            duration: 0.5,
            ease: 'elastic.out(1, 0.3)'
        });
    });
    
    // Hover effects for interactive elements
    const interactiveElements = document.querySelectorAll('a, button, .project-card, .skill-bubble');
    
    interactiveElements.forEach(element => {
        element.addEventListener('mouseenter', () => {
            cursorDot.style.transform = 'translate(-50%, -50%) scale(1.5)';
            cursorCircle.style.transform = 'translate(-50%, -50%) scale(1.5)';
            cursorCircle.style.borderColor = 'var(--color-accent)';
            cursorCircle.style.backgroundColor = 'rgba(255, 122, 0, 0.1)';
        });
        
        element.addEventListener('mouseleave', () => {
            cursorDot.style.transform = 'translate(-50%, -50%) scale(1)';
            cursorCircle.style.transform = 'translate(-50%, -50%) scale(1)';
            cursorCircle.style.borderColor = 'var(--color-accent)';
            cursorCircle.style.backgroundColor = 'transparent';
        });
    });
    
    // Hide cursor when leaving window
    document.addEventListener('mouseleave', () => {
        cursorDot.style.opacity = '0';
        cursorCircle.style.opacity = '0';
    });
    
    document.addEventListener('mouseenter', () => {
        cursorDot.style.opacity = '1';
        cursorCircle.style.opacity = '1';
    });
}

// Card Tilt Effects
function initCardTiltEffects() {
    // About card tilt effect
    const aboutCard = document.querySelector('.about-card');
    const mtxoCard = document.querySelector('.mtxo-card');
    const projectCards = document.querySelectorAll('.project-card');
    
    // Function to create tilt effect
    function createTiltEffect(element) {
        element.addEventListener('mousemove', e => {
            const rect = element.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const xPercent = x / rect.width - 0.5;
            const yPercent = y / rect.height - 0.5;
            
            const rotateX = yPercent * -10; // Rotate around X-axis (horizontal)
            const rotateY = xPercent * 10; // Rotate around Y-axis (vertical)
            
            gsap.to(element, {
                rotationX: rotateX,
                rotationY: rotateY,
                transformPerspective: 1000,
                duration: 0.5,
                ease: 'power2.out'
            });
        });
        
        element.addEventListener('mouseleave', () => {
            gsap.to(element, {
                rotationX: 0,
                rotationY: 0,
                duration: 0.7,
                ease: 'elastic.out(1, 0.3)'
            });
        });
    }
    
    // Apply tilt effect to cards
    if (aboutCard) createTiltEffect(aboutCard);
    if (mtxoCard) createTiltEffect(mtxoCard);
    
    projectCards.forEach(card => {
        createTiltEffect(card);
    });
}

// Magnetic Elements
function initMagneticElements() {
    const magneticElements = document.querySelectorAll('.btn, .nav-link, .social-link');
    
    magneticElements.forEach(element => {
        element.addEventListener('mousemove', e => {
            const rect = element.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            
            // Magnetic effect strength
            const strength = 20;
            const magnetX = x * strength / rect.width;
            const magnetY = y * strength / rect.height;
            
            gsap.to(element, {
                x: magnetX,
                y: magnetY,
                duration: 0.3,
                ease: 'power2.out'
            });
        });
        
        element.addEventListener('mouseleave', () => {
            gsap.to(element, {
                x: 0,
                y: 0,
                duration: 0.7,
                ease: 'elastic.out(1, 0.3)'
            });
        });
    });
}

// Parallax Effects
function initParallaxEffects() {
    // Hero section parallax
    const heroSection = document.querySelector('.hero');
    const heroTitle = document.querySelector('.hero-title');
    const heroSubtitle = document.querySelector('.hero-subtitle');
    
    if (heroSection && heroTitle && heroSubtitle) {
        window.addEventListener('scroll', () => {
            const scrollY = window.scrollY;
            const heroHeight = heroSection.offsetHeight;
            const scrollPercent = Math.min(scrollY / heroHeight, 1);
            
            // Parallax effect on scroll
            heroTitle.style.transform = `translateY(${scrollPercent * 100}px) scale(${1 - scrollPercent * 0.2})`;
            heroSubtitle.style.transform = `translateY(${scrollPercent * 50}px)`;
        });
    }
    
    // Parallax for section titles
    const sectionTitles = document.querySelectorAll('.section-title');
    
    sectionTitles.forEach(title => {
        ScrollTrigger.create({
            trigger: title,
            start: 'top bottom',
            end: 'bottom top',
            onUpdate: self => {
                const progress = self.progress;
                gsap.to(title, {
                    y: progress * -30,
                    duration: 0.1,
                    ease: 'none'
                });
            }
        });
    });
}

// Text Scramble Effect for Hero Title
class TextScramble {
    constructor(el) {
        this.el = el;
        this.chars = '!<>-_\\/*&^%$#@[]{}=+?~';
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
            const start = Math.floor(Math.random() * 40);
            const end = start + Math.floor(Math.random() * 40);
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
                output += `<span class="scramble-text">${char}</span>`;
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

// Initialize text scramble effect on page load
document.addEventListener('DOMContentLoaded', () => {
    const heroTitle = document.querySelector('.hero-title');
    
    if (heroTitle) {
        const originalText = heroTitle.textContent;
        const scramble = new TextScramble(heroTitle);
        
        // Start scramble effect after a short delay
        setTimeout(() => {
            scramble.setText(originalText);
        }, 1000);
    }
});

// Button Click Animation
document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('.btn');
    
    buttons.forEach(button => {
        button.addEventListener('click', e => {
            // Create ripple effect
            const ripple = document.createElement('span');
            ripple.classList.add('btn-ripple');
            button.appendChild(ripple);
            
            // Position ripple at click point
            const rect = button.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;
            
            // Remove ripple after animation
            setTimeout(() => {
                ripple.remove();
            }, 600);
            
            // Add spring animation
            gsap.to(button, {
                scale: 0.95,
                duration: 0.1,
                ease: 'power2.out',
                onComplete: () => {
                    gsap.to(button, {
                        scale: 1,
                        duration: 0.5,
                        ease: 'elastic.out(1, 0.3)'
                    });
                }
            });
        });
    });
});

// Form Input Animation
document.addEventListener('DOMContentLoaded', () => {
    const formControls = document.querySelectorAll('.form-control');
    
    formControls.forEach(control => {
        control.addEventListener('focus', () => {
            // Spring animation on focus
            gsap.to(control, {
                y: -5,
                duration: 0.3,
                ease: 'power2.out'
            });
        });
        
        control.addEventListener('blur', () => {
            if (!control.value) {
                gsap.to(control, {
                    y: 0,
                    duration: 0.5,
                    ease: 'elastic.out(1, 0.3)'
                });
            }
        });
    });
});