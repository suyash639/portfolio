// Main JavaScript file for Suyash Tiwari's Portfolio

document.addEventListener('DOMContentLoaded', () => {
    // Initialize all components
    initThemeToggle();
    initNavigation();
    initProjectCards();
    initContactForm();
    initSkillBubbles();
    initParticleSystem();
    
    // Animate hero section on load
    setTimeout(() => {
        animateHero();
    }, 500);
    
    // Initialize scroll animations
    initScrollAnimations();
});

// Particle System for MTXO Labs section
function initParticleSystem() {
    const particleContainer = document.querySelector('.particle-container');
    if (!particleContainer) return;
    
    const mtxoCard = document.querySelector('.mtxo-card');
    const particleCount = 30;
    const particles = [];
    
    // Create particles
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        
        // Random size between 2-6px
        const size = Math.random() * 4 + 2;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        
        // Random position
        const posX = Math.random() * 100;
        const posY = Math.random() * 100;
        particle.style.left = `${posX}%`;
        particle.style.top = `${posY}%`;
        
        // Random opacity
        particle.style.opacity = Math.random() * 0.5 + 0.2;
        
        // Random animation delay
        particle.style.animationDelay = `${Math.random() * 5}s`;
        
        // Store particle data for animation
        const particleData = {
            element: particle,
            x: posX,
            y: posY,
            size: size,
            speedX: Math.random() * 0.2 - 0.1,
            speedY: Math.random() * 0.2 - 0.1,
            opacity: parseFloat(particle.style.opacity)
        };
        
        particles.push(particleData);
        particleContainer.appendChild(particle);
    }
    
    // Add CSS for particles
    const style = document.createElement('style');
    style.textContent = `
        .particle {
            position: absolute;
            background: var(--color-accent);
            border-radius: 50%;
            pointer-events: none;
            transition: transform 0.3s ease;
        }
        
        .particle-line {
            position: absolute;
            height: 1px;
            background: linear-gradient(90deg, var(--color-accent), transparent);
            pointer-events: none;
            transform-origin: left center;
            opacity: 0.3;
            z-index: 0;
        }
    `;
    document.head.appendChild(style);
    
    // Animation loop
    function animateParticles() {
        particles.forEach(particle => {
            // Update position
            particle.x += particle.speedX;
            particle.y += particle.speedY;
            
            // Boundary check
            if (particle.x < 0 || particle.x > 100) particle.speedX *= -1;
            if (particle.y < 0 || particle.y > 100) particle.speedY *= -1;
            
            // Apply position
            particle.element.style.left = `${particle.x}%`;
            particle.element.style.top = `${particle.y}%`;
        });
        
        requestAnimationFrame(animateParticles);
    }
    
    // Start animation
    animateParticles();
    
    // Connect particles with lines when they're close
    function connectParticles() {
        // Remove old lines
        document.querySelectorAll('.particle-line').forEach(line => line.remove());
        
        // Check distances between particles and create lines
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = (particles[i].x - particles[j].x) / 100 * particleContainer.offsetWidth;
                const dy = (particles[i].y - particles[j].y) / 100 * particleContainer.offsetHeight;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Connect if close enough
                if (distance < 100) {
                    const line = document.createElement('div');
                    line.classList.add('particle-line');
                    
                    // Calculate line position and length
                    const x1 = particles[i].x;
                    const y1 = particles[i].y;
                    const x2 = particles[j].x;
                    const y2 = particles[j].y;
                    
                    // Calculate angle
                    const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
                    
                    // Set line properties
                    line.style.width = `${distance}px`;
                    line.style.left = `${x1}%`;
                    line.style.top = `${y1}%`;
                    line.style.transform = `rotate(${angle}deg)`;
                    line.style.opacity = (1 - distance / 100) * 0.3;
                    
                    particleContainer.appendChild(line);
                }
            }
        }
        
        requestAnimationFrame(connectParticles);
    }
    
    connectParticles();
    
    // Mouse interaction
    mtxoCard.addEventListener('mousemove', (e) => {
        const rect = mtxoCard.getBoundingClientRect();
        const mouseX = ((e.clientX - rect.left) / rect.width) * 100;
        const mouseY = ((e.clientY - rect.top) / rect.height) * 100;
        
        particles.forEach(particle => {
            // Calculate distance from mouse
            const dx = mouseX - particle.x;
            const dy = mouseY - particle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Apply force if close enough
            if (distance < 20) {
                const force = 0.2 * (1 - distance / 20);
                particle.speedX += dx * force * 0.01;
                particle.speedY += dy * force * 0.01;
                
                // Limit speed
                const maxSpeed = 0.5;
                const currentSpeed = Math.sqrt(particle.speedX * particle.speedX + particle.speedY * particle.speedY);
                if (currentSpeed > maxSpeed) {
                    particle.speedX = (particle.speedX / currentSpeed) * maxSpeed;
                    particle.speedY = (particle.speedY / currentSpeed) * maxSpeed;
                }
            }
        });
    });
    
    // CTA hover effect with particles
    const mtxoCta = document.querySelector('.mtxo-cta');
    if (mtxoCta) {
        mtxoCta.addEventListener('mouseenter', () => {
            const ctaRect = mtxoCta.getBoundingClientRect();
            const cardRect = mtxoCard.getBoundingClientRect();
            
            // Calculate CTA center position relative to card
            const ctaCenterX = ((ctaRect.left + ctaRect.width / 2) - cardRect.left) / cardRect.width * 100;
            const ctaCenterY = ((ctaRect.top + ctaRect.height / 2) - cardRect.top) / cardRect.height * 100;
            
            // Attract particles to CTA
            particles.forEach(particle => {
                // Add attraction force towards CTA
                const dx = ctaCenterX - particle.x;
                const dy = ctaCenterY - particle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                particle.speedX += dx * 0.01;
                particle.speedY += dy * 0.01;
                
                // Increase particle glow
                particle.element.style.boxShadow = '0 0 10px var(--color-glow)';
            });
        });
        
        mtxoCta.addEventListener('mouseleave', () => {
            // Reset particle glow
            particles.forEach(particle => {
                particle.element.style.boxShadow = 'none';
            });
        });
    }
}

// Theme Toggle Functionality
function initThemeToggle() {
    const themeToggle = document.querySelector('.theme-toggle');
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Check for saved theme preference or use OS preference
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme === 'dark' || (!currentTheme && prefersDarkScheme.matches)) {
        document.body.classList.add('dark-mode');
    }
    
    // Toggle theme on button click
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        
        // Save preference to localStorage
        const theme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
        localStorage.setItem('theme', theme);
    });
}

// Navigation Functionality
function initNavigation() {
    const header = document.querySelector('.header');
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section[id]');
    
    // Add scrolled class to header on scroll
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        
        // Update active nav link based on scroll position
        let currentSection = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.offsetHeight;
            if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
                currentSection = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSection}`) {
                link.classList.add('active');
            }
        });
    });
    
    // Smooth scroll to section on nav link click
    navLinks.forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            window.scrollTo({
                top: targetSection.offsetTop - 80,
                behavior: 'smooth'
            });
        });
    });
}

// Project Cards Functionality
function initProjectCards() {
    const projectCards = document.querySelectorAll('.project-card');
    const modal = document.getElementById('project-modal');
    const modalContent = modal.querySelector('.modal-body');
    const modalClose = modal.querySelector('.modal-close');
    
    // Project details data
    const projectDetails = {
        'vscode-debug-agent': {
            title: 'VSCode Debug Agent',
            description: 'An intelligent assistant that automates code debugging in Visual Studio Code. This extension uses AI to analyze error messages, suggest fixes, and help developers resolve issues faster.',
            features: [
                'Real-time error analysis and suggestions',
                'Integration with VSCode debugging tools',
                'AI-powered code fix recommendations',
                'Support for multiple programming languages'
            ],
            tech: ['TypeScript', 'VSCode API', 'Node.js', 'AI Models'],
            image: 'assets/projects/vscode-debug-agent.jpg'
        },
        'email-push-system': {
            title: 'Email & Push Notification System',
            description: 'A robust backend service for handling email and push notifications at scale. Built with FastAPI and integrated with AWS services and Firebase Cloud Messaging.',
            features: [
                'Scalable email delivery via AWS SES',
                'Push notifications through Firebase FCM',
                'Message queueing with AWS SQS',
                'Template management and personalization',
                'Delivery analytics and tracking'
            ],
            tech: ['FastAPI', 'AWS SES/SNS/SQS/S3', 'Firebase FCM', 'MongoDB'],
            image: 'assets/projects/email-push-system.jpg'
        },
        'multi-agent-taskforce': {
            title: 'Multi-Agent Taskforce',
            description: 'A system of autonomous AI agents that collaborate to solve complex tasks. Built with LLaMA for reasoning, FastAPI for the backend, ChromaDB for vector storage, and React for the frontend.',
            features: [
                'Agent communication and coordination',
                'Task decomposition and delegation',
                'Knowledge sharing between agents',
                'Interactive visualization of agent activities',
                'Customizable agent behaviors and capabilities'
            ],
            tech: ['LLaMA', 'FastAPI', 'ChromaDB', 'React', 'Python'],
            image: 'assets/projects/multi-agent-taskforce.jpg'
        },
        'soyeahlink': {
            title: 'SoYeahLink',
            description: 'An AI automation tool that sends personalized LinkedIn messages for users. It analyzes profiles, generates relevant messages, and manages outreach campaigns.',
            features: [
                'Profile analysis and categorization',
                'Personalized message generation',
                'Campaign management and scheduling',
                'Response tracking and analytics',
                'Integration with LinkedIn API'
            ],
            tech: ['FastAPI', 'AI Models', 'Automation Pipelines', 'React'],
            image: 'assets/projects/soyeahlink.jpg'
        }
    };
    
    // Add click event to project cards
    projectCards.forEach(card => {
        card.addEventListener('click', () => {
            const projectId = card.getAttribute('data-project');
            const project = projectDetails[projectId];
            
            if (project) {
                // Populate modal with project details
                modalContent.innerHTML = `
                    <div class="modal-project">
                        <div class="modal-project-image">
                            <div class="placeholder-image">${project.title.charAt(0)}${project.title.split(' ')[1]?.charAt(0) || ''}</div>
                        </div>
                        <div class="modal-project-content">
                            <h3 class="modal-project-title">${project.title}</h3>
                            <p class="modal-project-description">${project.description}</p>
                            
                            <h4 class="modal-project-subtitle">Key Features</h4>
                            <ul class="modal-project-features">
                                ${project.features.map(feature => `<li>${feature}</li>`).join('')}
                            </ul>
                            
                            <h4 class="modal-project-subtitle">Technologies</h4>
                            <div class="project-tech">
                                ${project.tech.map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
                            </div>
                        </div>
                    </div>
                `;
                
                // Show modal with animation
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        });
    });
    
    // Close modal on button click
    modalClose.addEventListener('click', () => {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    });
    
    // Close modal on outside click
    modal.addEventListener('click', e => {
        if (e.target === modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
    
    // Close modal on escape key
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

// Contact Form Functionality
function initContactForm() {
    const contactForm = document.getElementById('contact-form');
    const submitBtn = contactForm.querySelector('.submit-btn');
    
    contactForm.addEventListener('submit', e => {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(contactForm);
        const formValues = Object.fromEntries(formData.entries());
        
        // Disable submit button and show loading state
        submitBtn.disabled = true;
        submitBtn.classList.add('loading');
        submitBtn.querySelector('.btn-text').textContent = 'Sending...';
        
        // Create WhatsApp message with form data
        const name = formValues.name;
        const email = formValues.email;
        const message = formValues.message;
        const whatsappMessage = `Hello, my name is ${name}. Email: ${email}. Message: ${message}`;
        const encodedMessage = encodeURIComponent(whatsappMessage);
        const whatsappURL = `https://wa.me/919335729924?text=${encodedMessage}`;
        
        // Simulate form submission and then redirect to WhatsApp
        setTimeout(() => {
            // Show success state
            submitBtn.classList.remove('loading');
            submitBtn.classList.add('success');
            submitBtn.querySelector('.btn-text').textContent = 'Opening WhatsApp...';
            
            // Reset form
            contactForm.reset();
            
            // Open WhatsApp in a new tab
            window.open(whatsappURL, '_blank', 'noopener,noreferrer');
            
            // Reset button after delay
            setTimeout(() => {
                submitBtn.disabled = false;
                submitBtn.classList.remove('success');
                submitBtn.querySelector('.btn-text').textContent = 'Send Message';
            }, 3000);
        }, 1500);
    });
}

// Skill Bubbles Functionality
function initSkillBubbles() {
    const skillsContainer = document.querySelector('.skills-container');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const shuffleButton = document.getElementById('skills-shuffle');
    const explodeButton = document.getElementById('skills-explode');
    const groupButton = document.getElementById('skills-group');
    
    // Skills data with categories and sizes
    const skills = [
        { name: 'AI', size: 'large', category: 'ai' },
        { name: 'Python', size: 'large', category: 'language' },
        { name: 'TypeScript', size: 'large', category: 'language' },
        { name: 'React', size: 'large', category: 'frontend' },
        { name: 'FastAPI', size: 'medium', category: 'backend' },
        { name: 'Node.js', size: 'medium', category: 'backend' },
        { name: 'LangChain', size: 'medium', category: 'ai' },
        { name: 'LLaMA', size: 'medium', category: 'ai' },
        { name: 'MongoDB', size: 'medium', category: 'database' },
        { name: 'AWS', size: 'medium', category: 'cloud' },
        { name: 'Docker', size: 'small', category: 'devops' },
        { name: 'Git', size: 'small', category: 'devops' },
        { name: 'HTML/CSS', size: 'small', category: 'frontend' },
        { name: 'JavaScript', size: 'medium', category: 'language' },
        { name: 'SQL', size: 'small', category: 'database' },
        { name: 'Firebase', size: 'small', category: 'cloud' },
        { name: 'ChromaDB', size: 'small', category: 'database' },
        { name: 'REST API', size: 'small', category: 'backend' },
        { name: 'UI/UX', size: 'small', category: 'design' },
        { name: 'VSCode API', size: 'small', category: 'tools' },
        { name: 'TensorFlow', size: 'medium', category: 'ai' },
        { name: 'PyTorch', size: 'medium', category: 'ai' },
        { name: 'Next.js', size: 'medium', category: 'frontend' },
        { name: 'GraphQL', size: 'small', category: 'backend' },
        { name: 'Redis', size: 'small', category: 'database' },
        { name: 'Kubernetes', size: 'small', category: 'devops' },
        { name: 'Azure', size: 'small', category: 'cloud' },
        { name: 'Java', size: 'small', category: 'language' },
        { name: 'C++', size: 'small', category: 'language' },
        { name: 'DSA', size: 'large', category: 'language' }
    ];
    
    // Create and position skill bubbles
    skills.forEach(skill => {
        const bubble = document.createElement('div');
        bubble.className = `skill-bubble ${skill.size}`;
        bubble.setAttribute('data-category', skill.category);
        bubble.textContent = skill.name;
        
        // Random initial position within container
        const randomX = Math.random() * 80 + 10; // 10% to 90% of container width
        const randomY = Math.random() * 80 + 10; // 10% to 90% of container height
        
        bubble.style.left = `${randomX}%`;
        bubble.style.top = `${randomY}%`;
        
        // Add double-click event for fun animation
        bubble.addEventListener('dblclick', () => {
            bubble.classList.add('exploding');
            setTimeout(() => {
                bubble.classList.remove('exploding');
            }, 1000);
        });
        
        // Add to container
        skillsContainer.appendChild(bubble);
    });
    
    // Filter functionality
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Update active button
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            const filter = button.getAttribute('data-filter');
            const bubbles = document.querySelectorAll('.skill-bubble');
            
            bubbles.forEach(bubble => {
                if (filter === 'all' || bubble.getAttribute('data-category') === filter) {
                    bubble.classList.remove('filtered-out');
                } else {
                    bubble.classList.add('filtered-out');
                }
            });
        });
    });
    
    // Shuffle functionality - connect to physics engine if available
    shuffleButton.addEventListener('click', () => {
        // Check if physics engine is available
        if (window.skillPhysics && window.skillPhysics.resetPositions) {
            window.skillPhysics.resetPositions();
        } else {
            // Fallback to CSS animation if physics engine not available
            const bubbles = document.querySelectorAll('.skill-bubble');
            
            bubbles.forEach(bubble => {
                // Generate new random positions
                const randomX = Math.random() * 80 + 10;
                const randomY = Math.random() * 80 + 10;
                
                // Animate to new positions with GSAP
                gsap.to(bubble, {
                    left: `${randomX}%`,
                    top: `${randomY}%`,
                    duration: 0.8,
                    ease: 'back.out(1.7)'
                });
            });
        }
    });
    
    // Explode functionality - connect to physics engine if available
    explodeButton.addEventListener('click', () => {
        // Check if physics engine is available
        if (window.skillPhysics && window.skillPhysics.applyExplosion) {
            window.skillPhysics.applyExplosion();
            
            // Add visual effect to bubbles
            const bubbles = document.querySelectorAll('.skill-bubble');
            bubbles.forEach(bubble => {
                bubble.classList.add('exploding');
                setTimeout(() => {
                    bubble.classList.remove('exploding');
                }, 1000);
            });
        } else {
            // Fallback to CSS animation if physics engine not available
            const bubbles = document.querySelectorAll('.skill-bubble');
            
            bubbles.forEach(bubble => {
                // Add exploding class for animation
                bubble.classList.add('exploding');
                
                // Generate extreme positions (outside the container)
                const extremeX = Math.random() * 200 - 50; // -50% to 150%
                const extremeY = Math.random() * 200 - 50; // -50% to 150%
                
                // Animate to extreme positions
                gsap.to(bubble, {
                    left: `${extremeX}%`,
                    top: `${extremeY}%`,
                    duration: 0.5,
                    ease: 'power2.out'
                });
                
                // Return to container after delay
                setTimeout(() => {
                    const returnX = Math.random() * 80 + 10;
                    const returnY = Math.random() * 80 + 10;
                    
                    gsap.to(bubble, {
                        left: `${returnX}%`,
                        top: `${returnY}%`,
                        duration: 0.8,
                        ease: 'elastic.out(1, 0.5)'
                    });
                    
                    bubble.classList.remove('exploding');
                }, 1000);
            });
        }
    });
    
    // Group functionality - connect to physics engine if available
    groupButton.addEventListener('click', () => {
        // Check if physics engine is available
        if (window.skillPhysics && window.skillPhysics.groupByCategory) {
            window.skillPhysics.groupByCategory();
        } else {
            // Fallback to CSS animation if physics engine not available
            const bubbles = document.querySelectorAll('.skill-bubble');
            const categories = ['ai', 'language', 'frontend', 'backend', 'database', 'cloud', 'devops', 'tools', 'design'];
            
            // Define positions for each category group
            const positions = {
                'ai': { x: 20, y: 20 },
                'language': { x: 80, y: 20 },
                'frontend': { x: 20, y: 50 },
                'backend': { x: 80, y: 50 },
                'database': { x: 20, y: 80 },
                'cloud': { x: 80, y: 80 },
                'devops': { x: 50, y: 30 },
                'tools': { x: 50, y: 50 },
                'design': { x: 50, y: 70 }
            };
            
            bubbles.forEach(bubble => {
                const category = bubble.getAttribute('data-category');
                const basePosition = positions[category] || { x: 50, y: 50 };
                
                // Add some randomness within the group
                const offsetX = (Math.random() - 0.5) * 15;
                const offsetY = (Math.random() - 0.5) * 15;
                
                gsap.to(bubble, {
                    left: `${basePosition.x + offsetX}%`,
                    top: `${basePosition.y + offsetY}%`,
                    duration: 1,
                    ease: 'back.out(1.7)'
                });
            });
        }
    });
    
    // Add keyboard controls for fun interactions
    document.addEventListener('keydown', (e) => {
        // Only trigger when focus is on the skills section
        const skillsSection = document.querySelector('.skills-section');
        const rect = skillsSection.getBoundingClientRect();
        const isInView = (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
        
        if (!isInView) return;
        
        // Space bar - Explode
        if (e.code === 'Space') {
            e.preventDefault();
            explodeButton.click();
        }
        // S key - Shuffle
        else if (e.code === 'KeyS') {
            shuffleButton.click();
        }
        // G key - Group
        else if (e.code === 'KeyG') {
            groupButton.click();
        }
    });
}

// Hero Animation
function animateHero() {
    const heroTitle = document.querySelector('.hero-title');
    const heroSubtitle = document.querySelector('.hero-subtitle');
    const heroCta = document.querySelector('.hero-cta');
    
    // Animate with slight delay between elements
    heroTitle.style.opacity = '1';
    heroTitle.style.transform = 'scale(1)';
    heroTitle.style.transition = 'opacity 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275), transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    
    setTimeout(() => {
        heroSubtitle.style.opacity = '1';
        heroSubtitle.style.transform = 'translateY(0)';
        heroSubtitle.style.transition = 'opacity 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275), transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    }, 200);
    
    setTimeout(() => {
        heroCta.style.opacity = '1';
        heroCta.style.transform = 'translateY(0)';
        heroCta.style.transition = 'opacity 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275), transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    }, 400);
}

// Scroll Animations
function initScrollAnimations() {
    // Elements to animate on scroll
    const animatedElements = document.querySelectorAll('.section-title, .about-card, .project-card, .mtxo-card, .timeline-item, .contact-form');
    
    // Add animation classes
    animatedElements.forEach(element => {
        if (element.classList.contains('section-title')) {
            element.classList.add('fade-in');
        } else if (element.classList.contains('about-card') || element.classList.contains('mtxo-card')) {
            element.classList.add('scale-in');
        } else if (element.classList.contains('project-card')) {
            element.classList.add('fade-in');
        } else if (element.classList.contains('timeline-item')) {
            // Alternate slide-in direction for timeline items
            const isEven = Array.from(document.querySelectorAll('.timeline-item')).indexOf(element) % 2 === 0;
            element.classList.add(isEven ? 'slide-in-right' : 'slide-in-left');
        } else if (element.classList.contains('contact-form')) {
            element.classList.add('fade-in');
        }
    });
    
    // Check if element is in viewport and add animate class
    function checkScroll() {
        animatedElements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const elementVisible = 150;
            
            if (elementTop < window.innerHeight - elementVisible) {
                element.classList.add('animate');
            }
        });
    }
    
    // Initial check and add scroll event listener
    checkScroll();
    window.addEventListener('scroll', checkScroll);
}

// Easter Egg - Double Click
document.addEventListener('dblclick', e => {
    // Create AI bot element
    const bot = document.createElement('div');
    bot.className = 'ai-bot';
    bot.innerHTML = '👋';
    bot.style.position = 'fixed';
    bot.style.left = `${e.clientX}px`;
    bot.style.top = `${e.clientY}px`;
    bot.style.fontSize = '3rem';
    bot.style.zIndex = '1000';
    bot.style.opacity = '0';
    bot.style.transform = 'scale(0)';
    bot.style.transition = 'opacity 0.3s, transform 0.3s';
    
    // Add to body and animate
    document.body.appendChild(bot);
    
    setTimeout(() => {
        bot.style.opacity = '1';
        bot.style.transform = 'scale(1)';
    }, 10);
    
    // Remove after animation
    setTimeout(() => {
        bot.style.opacity = '0';
        bot.style.transform = 'scale(0)';
        
        setTimeout(() => {
            document.body.removeChild(bot);
        }, 300);
    }, 2000);
});