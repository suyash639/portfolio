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
    initPhilosophySystemMap();
    initExperienceJourney();
});

/* --------------------------------------------------------------------------
   01. PERMANENT DARK THEME SYSTEM
   -------------------------------------------------------------------------- */
function initTheme() {
    document.body.classList.add('dark-mode');
    document.body.classList.remove('light-mode');
    document.documentElement.setAttribute('data-theme', 'dark');
    try {
        localStorage.setItem('suyash_theme', 'dark');
    } catch (e) {
        // Ignore localStorage restrictions if sandboxed
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

/* --------------------------------------------------------------------------
   10. INTERACTIVE AI SYSTEM MAP & ARCHITECTURAL PILLARS (PHASE 2)
   -------------------------------------------------------------------------- */
function initPhilosophySystemMap() {
    const container = document.getElementById('philosophy-system-map');
    if (!container) return;

    // Preserving all 6 original pillars with complete headings, technical descriptions, and tags
    const pillarsData = {
        1: {
            num: "01",
            title: "AI Should Reason",
            badge: "PILLAR 01",
            domain: "CORE COGNITIVE GRAPH",
            desc: "Beyond naive generation, systems require structured decomposition, multi-step tree-of-thought verification, stateful graph memory, and explicit consensus loops.",
            tag: "Graph State Machines & Intent Decoders",
            icon: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
            status: "NODE 01 ONLINE // REASONING ENGINE",
            telemetry: "STABILITY: 99.98% • LATENCY: <14MS",
            specExec: "Deterministic Graph State Decomposition",
            specGuard: "Verified Consensus Loop & Tree-of-Thought"
        },
        2: {
            num: "02",
            title: "AI Should Retrieve",
            badge: "PILLAR 02",
            domain: "CONTEXTUAL GROUNDING FABRIC",
            desc: "Grounding output with hybrid sparse-dense vector search, contextual chunking, re-ranking algorithms, and cryptographically verified provenance citations.",
            tag: "ChromaDB • Hybrid RAG • Citation Graphs",
            icon: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path><path d="M10 7v6l4 2"></path></svg>`,
            status: "NODE 02 ONLINE // RETRIEVAL FABRIC",
            telemetry: "RECALL@5: 98.4% • LATENCY: <18MS",
            specExec: "Hybrid Dense/Sparse Vector Search & Re-rank",
            specGuard: "Cryptographically Verified Citation Graphs"
        },
        3: {
            num: "03",
            title: "AI Should Use Tools",
            badge: "PILLAR 03",
            domain: "DETERMINISTIC INTERFACES",
            desc: "Deterministic interaction via strict Pydantic schemas, Model Context Protocol (MCP) integrations, parameter sandboxing, and idempotent API execution.",
            tag: "MCP Protocols • Deterministic Tools",
            icon: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>`,
            status: "NODE 03 ONLINE // MCP PROTOCOL BUS",
            telemetry: "SCHEMA MATCH: 100% • IDEMPOTENT: TRUE",
            specExec: "Strict Pydantic Schema Validation",
            specGuard: "Isolated Sandboxed API Execution & Audits"
        },
        4: {
            num: "04",
            title: "AI Should Act",
            badge: "PILLAR 04",
            domain: "AUTONOMOUS ORCHESTRATION",
            desc: "Autonomous multi-agent taskforces orchestrating specialist roles (Book QA, Notes Desk, Market Analysis) with human-in-the-loop validation checkpoints.",
            tag: "Multi-Agent Taskforces • Specialist Desks",
            icon: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`,
            status: "NODE 04 ONLINE // MULTI-AGENT SWARM",
            telemetry: "ACTIVE AGENTS: 3 • HITL GATES: ARMED",
            specExec: "Autonomous Multi-Agent Task Delegation",
            specGuard: "Human-in-the-Loop Validation Checkpoints"
        },
        5: {
            num: "05",
            title: "AI Should Be Evaluated",
            badge: "PILLAR 05",
            domain: "CONTINUOUS BENCHMARKING",
            desc: "Continuous regression suites, prompt injection boundary testing, schema compliance checks, and deterministic offline benchmark suites ensuring zero regressions.",
            tag: "Pytest • 100% Eval Suites • Injection Guards",
            icon: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`,
            status: "NODE 05 ONLINE // EVALUATION TESTBENCH",
            telemetry: "TEST PASS: 100% • INJECTION DEFENSE: 99.9%",
            specExec: "Continuous Pytest Regression Test Suites",
            specGuard: "Prompt Injection Boundary & Schema Compliance"
        },
        6: {
            num: "06",
            title: "AI Should Work in Production",
            badge: "PILLAR 06",
            domain: "HARDENED INFRASTRUCTURE",
            desc: "Hardened with circuit breakers, exponential jitter backoff, PII redaction gateways, P50/P95 telemetry observability, and dynamic inference cache reuse.",
            tag: "Circuit Breakers • Telemetry • Sub-100ms",
            icon: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`,
            status: "NODE 06 ONLINE // RESILIENT PRODUCTION",
            telemetry: "P95 LATENCY: <85MS • CIRCUIT BREAKER: ARMED",
            specExec: "Circuit Breakers & Exponential Jitter Backoff",
            specGuard: "PII Redaction Gateways & Realtime Telemetry"
        }
    };

    let activePillar = 1;
    const railBtns = container.querySelectorAll('.rail-btn');
    const mapNodes = container.querySelectorAll('.map-node');
    const busLines = container.querySelectorAll('.bus-line');

    const statusTextEl = document.getElementById('console-status-text');
    const telemetryEl = document.getElementById('console-telemetry');
    const badgeEl = document.getElementById('console-badge');
    const domainEl = document.getElementById('console-domain');
    const iconEl = document.getElementById('console-icon');
    const titleEl = document.getElementById('console-title');
    const descEl = document.getElementById('console-desc');
    const tagEl = document.getElementById('console-tag');
    const specExecEl = document.getElementById('console-spec-exec');
    const specGuardEl = document.getElementById('console-spec-guard');
    const currentNumEl = document.getElementById('console-current-num');
    const prevBtn = document.getElementById('console-prev-btn');
    const nextBtn = document.getElementById('console-next-btn');
    const coreHub = document.getElementById('core-hub');

    function updatePillar(index, smooth = true) {
        if (!pillarsData[index]) return;
        activePillar = index;
        const data = pillarsData[index];

        // 1. Update rail buttons
        railBtns.forEach(btn => {
            const btnPillar = parseInt(btn.getAttribute('data-pillar'), 10);
            const isActive = btnPillar === index;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });

        // 2. Update map nodes
        mapNodes.forEach(node => {
            const nodePillar = parseInt(node.getAttribute('data-pillar'), 10);
            const isActive = nodePillar === index;
            node.classList.toggle('active', isActive);
            node.classList.toggle('dimmed', !isActive);
        });

        // 3. Update SVG bus lines
        busLines.forEach(line => {
            const isTargetLine = line.classList.contains(`bus-line-${index}`);
            line.classList.toggle('active', isTargetLine);
        });

        // 4. Update inspection console content
        if (titleEl && descEl) {
            if (smooth) {
                const consoleBody = document.getElementById('console-content');
                if (consoleBody) {
                    consoleBody.style.transition = 'opacity 0.15s ease';
                    consoleBody.style.opacity = '0.4';
                    setTimeout(() => {
                        applyContent(data);
                        consoleBody.style.opacity = '1';
                    }, 120);
                } else {
                    applyContent(data);
                }
            } else {
                applyContent(data);
            }
        }
    }

    function applyContent(data) {
        if (statusTextEl) statusTextEl.textContent = data.status;
        if (telemetryEl) {
            const parts = data.telemetry.split(' • ');
            telemetryEl.innerHTML = `<span class="telemetry-item">${parts[0]}</span><span class="telemetry-separator">•</span><span class="telemetry-item">${parts[1]}</span>`;
        }
        if (badgeEl) badgeEl.textContent = data.badge;
        if (domainEl) domainEl.textContent = data.domain;
        if (iconEl) iconEl.innerHTML = data.icon;
        if (titleEl) titleEl.textContent = data.title;
        if (descEl) descEl.textContent = data.desc;
        if (tagEl) tagEl.textContent = data.tag;
        if (specExecEl) specExecEl.textContent = data.specExec;
        if (specGuardEl) specGuardEl.textContent = data.specGuard;
        if (currentNumEl) currentNumEl.textContent = data.num;
    }

    // Bind Rail Buttons
    railBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const pillar = parseInt(btn.getAttribute('data-pillar'), 10);
            updatePillar(pillar);
        });
    });

    // Bind Map Nodes (Click + Hover preview)
    mapNodes.forEach(node => {
        node.addEventListener('click', () => {
            const pillar = parseInt(node.getAttribute('data-pillar'), 10);
            updatePillar(pillar);
        });

        node.addEventListener('mouseenter', () => {
            const pillar = parseInt(node.getAttribute('data-pillar'), 10);
            busLines.forEach(line => {
                const isTargetLine = line.classList.contains(`bus-line-${pillar}`);
                if (isTargetLine) {
                    line.style.stroke = 'var(--accent-orange)';
                    line.style.opacity = '1';
                }
            });
        });

        node.addEventListener('mouseleave', () => {
            busLines.forEach(line => {
                const isTargetLine = line.classList.contains(`bus-line-${activePillar}`);
                if (!isTargetLine) {
                    line.style.stroke = '';
                    line.style.opacity = '';
                }
            });
        });
    });

    // Core Hub click cycles to next
    if (coreHub) {
        coreHub.addEventListener('click', () => {
            const next = activePillar >= 6 ? 1 : activePillar + 1;
            updatePillar(next);
        });
    }

    // Prev / Next Controls
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            const prev = activePillar <= 1 ? 6 : activePillar - 1;
            updatePillar(prev);
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const next = activePillar >= 6 ? 1 : activePillar + 1;
            updatePillar(next);
        });
    }

    // Keyboard Arrow Accessibility (Left/Right to switch active pillar)
    container.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault();
            const next = activePillar >= 6 ? 1 : activePillar + 1;
            updatePillar(next);
            const targetBtn = container.querySelector(`.rail-btn[data-pillar="${next}"]`);
            if (targetBtn) targetBtn.focus();
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            const prev = activePillar <= 1 ? 6 : activePillar - 1;
            updatePillar(prev);
            const targetBtn = container.querySelector(`.rail-btn[data-pillar="${prev}"]`);
            if (targetBtn) targetBtn.focus();
        }
    });

    function updateBusLineCoordinates() {
        const canvas = document.getElementById('system-canvas');
        const hub = document.getElementById('core-hub');
        const ringPath = document.getElementById('circuit-ring-path');
        if (!canvas || !hub) return;

        const canvasRect = canvas.getBoundingClientRect();
        if (canvasRect.width === 0 || canvasRect.height === 0) return;

        const hubRect = hub.getBoundingClientRect();
        const hx = hubRect.left + hubRect.width / 2 - canvasRect.left;
        const hy = hubRect.top + hubRect.height / 2 - canvasRect.top;

        const nodeCoords = [];

        mapNodes.forEach(node => {
            const pillar = node.getAttribute('data-pillar');
            const line = document.getElementById(`bus-line-${pillar}`);
            const nRect = node.getBoundingClientRect();
            const nx = nRect.left + nRect.width / 2 - canvasRect.left;
            const ny = nRect.top + nRect.height / 2 - canvasRect.top;

            if (line) {
                line.setAttribute('x1', hx.toFixed(1));
                line.setAttribute('y1', hy.toFixed(1));
                line.setAttribute('x2', nx.toFixed(1));
                line.setAttribute('y2', ny.toFixed(1));
            }

            nodeCoords.push({ pillar: parseInt(pillar, 10), x: nx, y: ny });
        });

        // Connect ring path linking 1 -> 4 -> 5 -> 6 -> 3 -> 2 -> 1
        if (ringPath && nodeCoords.length === 6) {
            nodeCoords.sort((a, b) => a.pillar - b.pillar);
            const p1 = nodeCoords[0];
            const p2 = nodeCoords[1];
            const p3 = nodeCoords[2];
            const p4 = nodeCoords[3];
            const p5 = nodeCoords[4];
            const p6 = nodeCoords[5];
            ringPath.setAttribute('d', `M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} L ${p4.x.toFixed(1)} ${p4.y.toFixed(1)} L ${p5.x.toFixed(1)} ${p5.y.toFixed(1)} L ${p6.x.toFixed(1)} ${p6.y.toFixed(1)} L ${p3.x.toFixed(1)} ${p3.y.toFixed(1)} L ${p2.x.toFixed(1)} ${p2.y.toFixed(1)} Z`);
        }
    }

    // Initialize with Pillar 01 and update bus line geometry
    updatePillar(1, false);
    updateBusLineCoordinates();
    setTimeout(updateBusLineCoordinates, 80);
    setTimeout(updateBusLineCoordinates, 300);
    window.addEventListener('resize', () => requestAnimationFrame(updateBusLineCoordinates), { passive: true });
}

/* --------------------------------------------------------------------------
   11. PROFESSIONAL JOURNEY INTERACTION ENGINE
   -------------------------------------------------------------------------- */
function initExperienceJourney() {
    const navTabs = document.querySelectorAll('.journey-nav-tab');
    const chapters = document.querySelectorAll('.experience-chapter');
    const stageBtns = document.querySelectorAll('.stage-btn');
    const stagePanels = document.querySelectorAll('.stage-panel');

    if (!navTabs.length || !chapters.length) return;

    // Handle Chapter Tab Switching
    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const chapterId = tab.getAttribute('data-chapter');
            if (!chapterId) return;

            // Update Tab Active States
            navTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Switch Active Chapter
            chapters.forEach(ch => {
                if (ch.id === `chapter-${chapterId}`) {
                    ch.classList.add('active');
                } else {
                    ch.classList.remove('active');
                }
            });

            // If ScrollTrigger exists, refresh layout positions smoothly
            if (window.ScrollTrigger) {
                window.ScrollTrigger.refresh();
            }
        });
    });

    // Handle Neptunus Pipeline Stage Switching
    if (stageBtns.length && stagePanels.length) {
        stageBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const stageKey = btn.getAttribute('data-stage');
                if (!stageKey) return;

                stageBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                stagePanels.forEach(panel => {
                    if (panel.id === `stage-${stageKey}`) {
                        panel.classList.add('active');
                    } else {
                        panel.classList.remove('active');
                    }
                });
            });
        });
    }

    // Handle Chapter Navigation Footer Buttons (Prev / Next Chapter)
    const chapterNavBtns = document.querySelectorAll('.chapter-nav-btn');
    chapterNavBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetChapter = btn.getAttribute('data-target-chapter');
            if (!targetChapter) return;

            const targetTab = document.querySelector(`.journey-nav-tab[data-chapter="${targetChapter}"]`);
            if (targetTab) {
                targetTab.click();

                // Smoothly scroll back to the chapter view if scrolled down
                const expSection = document.getElementById('experience');
                if (expSection) {
                    const yOffset = -80;
                    const y = expSection.getBoundingClientRect().top + window.pageYOffset + yOffset;
                    window.scrollTo({ top: y, behavior: 'smooth' });
                }
            }
        });
    });
}