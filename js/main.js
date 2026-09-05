/**
 * Suyash Tiwari — AI Systems & Infrastructure Portfolio
 * Main Application Logic & Component Systems (Phase 2)
 */

document.addEventListener('DOMContentLoaded', () => {
    // 01. Core Systems Initialization
    initTheme();
    initNavigation();
    initISTClock();
    initModalSystem();
    initArbiterInteractiveGraph();
    initInferOptSimulator();
    initPipelineInteractions();
    initContactForm();
    initSkillsControls();
});

/* --------------------------------------------------------------------------
   01. THEME TOGGLE SYSTEM
   -------------------------------------------------------------------------- */
function initTheme() {
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    const savedTheme = localStorage.getItem('suyash_theme');

    if (savedTheme === 'light') {
        document.body.classList.remove('dark-mode');
        document.body.classList.add('light-mode');
        document.documentElement.setAttribute('data-theme', 'light');
    } else {
        document.body.classList.add('dark-mode');
        document.body.classList.remove('light-mode');
        document.documentElement.setAttribute('data-theme', 'dark');
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const isDark = document.body.classList.contains('dark-mode');
            if (isDark) {
                document.body.classList.remove('dark-mode');
                document.body.classList.add('light-mode');
                document.documentElement.setAttribute('data-theme', 'light');
                localStorage.setItem('suyash_theme', 'light');
            } else {
                document.body.classList.add('dark-mode');
                document.body.classList.remove('light-mode');
                document.documentElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('suyash_theme', 'dark');
            }
        });
    }
}

/* --------------------------------------------------------------------------
   02. NAVIGATION & HUD SCROLL STATE
   -------------------------------------------------------------------------- */
function initNavigation() {
    const header = document.getElementById('main-header');
    const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
    const mobileNavBtn = document.getElementById('mobile-nav-btn');
    const mobileDrawer = document.getElementById('mobile-nav-drawer');
    const sections = document.querySelectorAll('section[id]');

    // Header glass blur on scroll
    window.addEventListener('scroll', () => {
        if (window.scrollY > 40) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        // Section awareness
        let activeId = '';
        const scrollPos = window.scrollY + 200;

        sections.forEach(section => {
            const top = section.offsetTop;
            const height = section.offsetHeight;
            if (scrollPos >= top && scrollPos < top + height) {
                activeId = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${activeId}`) {
                link.classList.add('active');
            }
        });
    }, { passive: true });

    // Smooth scroll for nav links
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href && href.startsWith('#')) {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    if (mobileDrawer) mobileDrawer.classList.remove('open');
                    window.scrollTo({
                        top: target.offsetTop - 80,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    // Mobile drawer toggle
    if (mobileNavBtn && mobileDrawer) {
        mobileNavBtn.addEventListener('click', () => {
            const isOpen = mobileDrawer.classList.contains('open');
            mobileDrawer.classList.toggle('open');
            mobileNavBtn.setAttribute('aria-expanded', !isOpen);
        });
    }
}

/* --------------------------------------------------------------------------
   03. LIVE IST CLOCK (UTC+5:30)
   -------------------------------------------------------------------------- */
function initISTClock() {
    const clockEl = document.getElementById('live-ist-clock');
    if (!clockEl) return;

    function updateTime() {
        const now = new Date();
        const options = {
            timeZone: 'Asia/Kolkata',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        };
        const istString = now.toLocaleTimeString('en-US', options);
        clockEl.textContent = `${istString} IST (UTC+5:30)`;
    }

    updateTime();
    setInterval(updateTime, 1000);
}

/* --------------------------------------------------------------------------
   04. COMPLETE PROJECT DETAILS & MODAL SPEC SYSTEM
   -------------------------------------------------------------------------- */
const PROJECT_SPECS = {
    'arbiter': {
        title: 'Arbiter — Autonomous Multi-Agent Financial Operations Console',
        tagline: 'Deterministic Multi-Agent Financial Querying with 6 Desks, 24 Verified Tools & 100% Eval Benchmark',
        description: 'Arbiter is a production-grade multi-agent financial operations orchestrator engineered to eliminate hallucinations, enforce prompt injection guards, and execute deterministic financial operations over sensitive client datasets and regulatory rulesets.',
        features: [
            '6 Domain Specialist Desks: Book QA, KYC Profile, Notes Desk, Market Desk, Compliance Refusal, and Arbiter Orchestrator',
            '24 Deterministic Verified Tools with strict Pydantic schemas and client-scoped isolation',
            'Untrusted-to-Trusted Security Boundary Gateway with injection defenses and automated PII redaction',
            'Reliability Engine featuring Circuit Breakers, non-retryable error taxonomy, and exponential jitter backoff',
            '100.0% Offline Benchmark Score across 45 test scenarios (Routing, Factual, Citation, Safety, and Schema compliance)',
            'Full regression suite with 390+ Pytest tests passed in 37.5s'
        ],
        tech: ['React 19', 'TypeScript', 'FastAPI', 'Pytest (390+ Tests)', 'Pydantic', 'Vite', 'Tailwind CSS'],
        links: [
            { label: 'GitHub Profile', url: 'https://github.com/suyash639' }
        ]
    },
    'inferopt': {
        title: 'InferOpt — High-Throughput LLM Dynamic Routing Engine',
        tagline: 'Dynamic Latency/Cost-Aware Routing with Prefix KV-Cache Reuse & Speculative Coordination',
        description: 'InferOpt is an intelligent model inference gateway and latency optimization engine that dispatches dynamic query streams across local speculative engines and cloud reasoning models, reducing API costs and latency spikes.',
        features: [
            'Dynamic Latency & Cost Router evaluating token complexity, budget constraints, and SLA limits in under 100ms',
            'Prefix KV-Cache matching for over 40% reduction in redundant prompt token processing',
            'Speculative Decoding coordination pairing small local draft models with large model verification',
            'Real-time output confidence evaluation and zero-downtime automated fallbacks',
            'Observability dashboard tracking P50/P95/P99 latency percentiles and GPU memory utilization'
        ],
        tech: ['Python', 'FastAPI', 'vLLM / Ollama APIs', 'Redis Caching', 'Speculative Routing', 'Async Queues'],
        links: [
            { label: 'GitHub Profile', url: 'https://github.com/suyash639' }
        ]
    },
    'pipeline': {
        title: 'Financial AI Data Pipeline — Streaming Vector Intelligence',
        tagline: 'Resilient Multi-Source Streaming ETL, Semantic Vector Indexing & Automated AI Alert Triggers',
        description: 'An enterprise-grade streaming and batch financial data pipeline that ingests unstructured SEC filings, market news, and transaction streams, validates schemas, generates dense embeddings, and powers real-time semantic analytics.',
        features: [
            'Resilient multi-source streaming ingestion handling Kafka, SQS, and webhook events',
            'Automated schema enforcement, idempotent deduplication, and semantic chunking',
            'ChromaDB vector embedding store with rich metadata relationship graphs',
            'Automated AI anomaly detection and event-driven alerting triggers',
            'Sub-second semantic search retrieval over millions of indexed document chunks'
        ],
        tech: ['Python', 'FastAPI', 'ChromaDB', 'AWS S3 / SQS', 'Semantic Chunking', 'LLM Embeddings'],
        links: [
            { label: 'GitHub Profile', url: 'https://github.com/suyash639' }
        ]
    },
    'vscode-debug-agent': {
        title: 'VSCode Debug Agent',
        tagline: 'Intelligent Autonomous Assistant Automating Code Debugging in Visual Studio Code',
        description: 'An intelligent IDE assistant extension that automates runtime code debugging in Visual Studio Code by analyzing compiler errors, inspecting stack traces, and proposing validated code patches.',
        features: [
            'Real-time runtime error analysis and contextual suggestion synthesis',
            'Deep integration with VSCode Debugging API and language servers',
            'AI-powered code fix recommendations with syntax validation',
            'Multi-language support for TypeScript, Python, and JavaScript'
        ],
        tech: ['TypeScript', 'VSCode API', 'Node.js', 'AI Models'],
        links: [
            { label: 'GitHub Repository', url: 'https://github.com/suyash639/vscodedebug' }
        ]
    },
    'email-push-system': {
        title: 'Email & Push Notification System',
        tagline: 'High-Concurrency Event-Driven Notification Engine Built with FastAPI & AWS',
        description: 'A robust backend service for delivering high-throughput email and push notifications at scale. Engineered with FastAPI, AWS SES, Firebase Cloud Messaging, and Amazon SQS/SNS for decoupled queuing.',
        features: [
            'High-throughput scalable email delivery via AWS SES',
            'Push notification broadcast and targeted delivery through Firebase FCM',
            'Decoupled message queueing and dead-letter handling with AWS SQS & SNS',
            'Dynamic template management and personalization engine',
            'Delivery analytics, bounce tracking, and telemetry logging'
        ],
        tech: ['FastAPI', 'AWS SES/SNS/SQS/S3', 'Firebase FCM', 'MongoDB', 'Python'],
        links: [
            { label: 'GitHub Repository', url: 'https://github.com/suyash639/notification_services' }
        ]
    },
    'multi-agent-taskforce': {
        title: 'Multi-Agent Taskforce',
        tagline: 'Autonomous AI Agents Collaborating on Complex Multi-Step Tasks with LLaMA & ChromaDB',
        description: 'A collaborative multi-agent reasoning architecture where autonomous LLaMA-powered nodes decompose complex user tasks, execute tool actions, and synchronize state via ChromaDB vector memory and React frontend.',
        features: [
            'Autonomous agent communication protocols and task delegation graphs',
            'Dynamic task decomposition with tree-of-thought verification',
            'Shared vector memory and knowledge synchronization via ChromaDB',
            'Interactive frontend visualization of agent deliberation and state transitions',
            'Customizable agent roles, system prompts, and tool boundaries'
        ],
        tech: ['LLaMA', 'FastAPI', 'ChromaDB', 'React', 'Python'],
        links: [
            { label: 'GitHub Profile', url: 'https://github.com/suyash639' }
        ]
    },
    'soyeahlink': {
        title: 'SoYeahLink — Outreach Automation Pipeline',
        tagline: 'AI Automation Pipeline for Contextual Outreach & Message Generation',
        description: 'An AI-powered automation tool that analyzes professional profiles, crafts personalized conversational outreach, and manages scheduling pipelines.',
        features: [
            'Contextual profile analysis and classification',
            'Personalized conversational message generation using LLM prompting',
            'Outreach campaign management, rate-limiting, and scheduling',
            'Engagement tracking, response analytics, and conversion metrics'
        ],
        tech: ['FastAPI', 'AI Models', 'Automation Pipelines', 'React', 'Python'],
        links: [
            { label: 'GitHub Repository', url: 'https://github.com/suyash639/soyeahlink' }
        ]
    }
};

function initModalSystem() {
    const modal = document.getElementById('project-modal');
    if (!modal) return;

    const modalBody = modal.querySelector('.modal-body');
    const modalCloseBtn = modal.querySelector('.modal-close');
    const modalBackdrop = modal.querySelector('.modal-backdrop');
    const modalTitleBar = document.getElementById('modal-terminal-title');

    function openModal(projectId) {
        const spec = PROJECT_SPECS[projectId];
        if (!spec) return;

        if (modalTitleBar) {
            modalTitleBar.textContent = `${projectId}_spec.md`;
        }

        modalBody.innerHTML = `
            <div class="modal-project-content">
                <h3 class="modal-project-title">${spec.title}</h3>
                <div class="modal-project-tagline">${spec.tagline}</div>
                <p class="modal-project-desc">${spec.description}</p>
                
                <h4 style="font-family: var(--font-heading); font-size: 1.8rem; margin-bottom: 1.2rem; color: #ffffff;">Key Architecture & Features</h4>
                <ul class="modal-features-list">
                    ${spec.features.map(f => `<li>${f}</li>`).join('')}
                </ul>
                
                <h4 style="font-family: var(--font-heading); font-size: 1.8rem; margin-bottom: 1.2rem; color: #ffffff;">Technology Stack</h4>
                <div class="modal-tech-stack">
                    ${spec.tech.map(t => `<span class="tech-tag">${t}</span>`).join('')}
                </div>
                
                <div class="modal-links-row">
                    ${spec.links.map(l => `
                        <a href="${l.url}" class="btn btn-primary" target="_blank" rel="noopener noreferrer">
                            <span>${l.label}</span>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                        </a>
                    `).join('')}
                </div>
            </div>
        `;

        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    // Attach open triggers
    document.querySelectorAll('.open-modal-btn, [data-project]').forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            if (e.target.closest('a') && !trigger.classList.contains('open-modal-btn')) {
                return;
            }
            const projectId = trigger.getAttribute('data-project');
            if (projectId && PROJECT_SPECS[projectId]) {
                e.preventDefault();
                openModal(projectId);
            }
        });
    });

    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
    if (modalBackdrop) modalBackdrop.addEventListener('click', closeModal);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });
}

/* --------------------------------------------------------------------------
   05. ARBITER INTERACTIVE ORCHESTRATION GRAPH
   -------------------------------------------------------------------------- */
function initArbiterInteractiveGraph() {
    const nodes = document.querySelectorAll('#arbiter-arch-graph .interactive-node');
    const telemetryText = document.getElementById('arbiter-telemetry-text');
    if (!nodes.length || !telemetryText) return;

    nodes.forEach(node => {
        const info = node.getAttribute('data-info');

        node.addEventListener('mouseenter', () => {
            nodes.forEach(n => n.classList.remove('active-node'));
            node.classList.add('active-node');
            if (info) {
                telemetryText.textContent = info;
            }
        });

        node.addEventListener('click', () => {
            nodes.forEach(n => n.classList.remove('active-node'));
            node.classList.add('active-node');
            if (info) {
                telemetryText.textContent = info;
            }
        });
    });
}

/* --------------------------------------------------------------------------
   06. INFEROPT DYNAMIC ROUTING SIMULATOR
   -------------------------------------------------------------------------- */
function initInferOptSimulator() {
    const modeBtns = document.querySelectorAll('.infer-mode-switcher .mode-btn');
    const routeFast = document.getElementById('route-fast');
    const routeDeep = document.getElementById('route-deep');
    const routerStatus = document.getElementById('infer-router-status');
    const captionText = document.getElementById('infer-caption-text');

    if (!modeBtns.length) return;

    const SIMULATION_STATES = {
        'speculative': {
            fastActive: true,
            deepActive: false,
            status: 'Matching Speculative Draft // ~35ms P50 Latency',
            caption: 'Dynamic dispatch active: Routing query to fast local speculative draft model with sub-100ms verification.'
        },
        'deep': {
            fastActive: false,
            deepActive: true,
            status: 'High Budget Complex Query // Cloud Reasoning Model Fallback',
            caption: 'Complex multi-step task detected: Bypassing draft model to execute cloud-scale deep reasoning.'
        },
        'cached': {
            fastActive: true,
            deepActive: false,
            status: 'Prefix KV-Cache Hit // Zero Token Redundancy',
            caption: 'KV Cache matching active: Reusing cached attention key-values for 40%+ token cost savings.'
        }
    };

    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const mode = btn.getAttribute('data-mode');
            const state = SIMULATION_STATES[mode];
            if (!state) return;

            if (routeFast) {
                if (state.fastActive) routeFast.classList.add('active-route');
                else routeFast.classList.remove('active-route');
            }

            if (routeDeep) {
                if (state.deepActive) routeDeep.classList.add('active-route');
                else routeDeep.classList.remove('active-route');
            }

            if (routerStatus) routerStatus.textContent = state.status;
            if (captionText) captionText.textContent = state.caption;
        });
    });
}

/* --------------------------------------------------------------------------
   07. FINANCIAL AI PIPELINE STAGE INTERACTIONS
   -------------------------------------------------------------------------- */
function initPipelineInteractions() {
    const stages = document.querySelectorAll('.pipeline-stage');
    stages.forEach(stage => {
        stage.addEventListener('mouseenter', () => {
            stages.forEach(s => s.classList.remove('active-node'));
            stage.classList.add('active-node');
        });
    });
}

/* --------------------------------------------------------------------------
   08. CONTACT FORM DISPATCH TO WHATSAPP & FEEDBACK
   -------------------------------------------------------------------------- */
function initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    const submitBtn = form.querySelector('.submit-btn');

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const name = formData.get('name') || '';
        const email = formData.get('email') || '';
        const message = formData.get('message') || '';

        submitBtn.classList.add('loading');
        submitBtn.querySelector('.btn-text').textContent = 'Formatting Transmission...';

        const whatsappPayload = `Hello Suyash, my name is ${name} (${email}). Transmission: ${message}`;
        const encoded = encodeURIComponent(whatsappPayload);
        const whatsappUrl = `https://wa.me/919335729924?text=${encoded}`;

        setTimeout(() => {
            submitBtn.classList.remove('loading');
            submitBtn.classList.add('success');
            submitBtn.querySelector('.btn-text').textContent = 'Opening Secure Dispatch...';

            window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
            form.reset();

            setTimeout(() => {
                submitBtn.classList.remove('success');
                submitBtn.querySelector('.btn-text').textContent = 'Transmit Transmission';
            }, 3000);
        }, 1000);
    });
}

/* --------------------------------------------------------------------------
   09. SKILLS CONTROLS (CATEGORY FILTERS & SHORTCUTS)
   -------------------------------------------------------------------------- */
function initSkillsControls() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const shuffleBtn = document.getElementById('skills-shuffle');
    const explodeBtn = document.getElementById('skills-explode');
    const groupBtn = document.getElementById('skills-group');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filter = btn.getAttribute('data-filter');
            const bubbles = document.querySelectorAll('.skill-bubble');

            bubbles.forEach(bubble => {
                const cat = bubble.getAttribute('data-category');
                if (filter === 'all' || cat === filter) {
                    bubble.classList.remove('filtered-out');
                } else {
                    bubble.classList.add('filtered-out');
                }
            });
        });
    });

    if (shuffleBtn) {
        shuffleBtn.addEventListener('click', () => {
            if (window.skillPhysics && window.skillPhysics.resetPositions) {
                window.skillPhysics.resetPositions();
            }
        });
    }

    if (explodeBtn) {
        explodeBtn.addEventListener('click', () => {
            if (window.skillPhysics && window.skillPhysics.applyExplosion) {
                window.skillPhysics.applyExplosion();
            }
        });
    }

    if (groupBtn) {
        groupBtn.addEventListener('click', () => {
            if (window.skillPhysics && window.skillPhysics.groupByCategory) {
                window.skillPhysics.groupByCategory();
            }
        });
    }

    // Keyboard controls for skills
    document.addEventListener('keydown', (e) => {
        const skillsSection = document.getElementById('skills');
        if (!skillsSection) return;
        const rect = skillsSection.getBoundingClientRect();
        const inView = rect.top < window.innerHeight && rect.bottom > 0;
        if (!inView) return;

        if (e.code === 'Space') {
            e.preventDefault();
            if (explodeBtn) explodeBtn.click();
        } else if (e.code === 'KeyS' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
            if (shuffleBtn) shuffleBtn.click();
        } else if (e.code === 'KeyG' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
            if (groupBtn) groupBtn.click();
        }
    });
}