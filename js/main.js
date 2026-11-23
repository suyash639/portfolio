/**
 * Suyash Tiwari — AI Systems & Infrastructure Portfolio
 * Main Application Logic & Component Systems (Phase 2)
 */

document.addEventListener('DOMContentLoaded', () => {
    // 01. Core Systems Initialization
    initTheme();
    initISTClock();
    initModalSystem();
    initContactForm();
});

/* --------------------------------------------------------------------------
   01. THEME — dark only
   -------------------------------------------------------------------------- */
function initTheme() {
    document.body.classList.add('dark-mode');
    document.body.classList.remove('light-mode');
    document.documentElement.setAttribute('data-theme', 'dark');
    try { localStorage.removeItem('suyash_theme'); } catch (e) { /* storage unavailable */ }
}

/* --------------------------------------------------------------------------
   02. NAVIGATION → see js/nav.js
   -------------------------------------------------------------------------- */

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
            'Prefix KV-Cache matching so repeated prompt prefixes are not reprocessed',
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
            'Semantic search retrieval over the indexed document chunks'
        ],
        tech: ['Python', 'FastAPI', 'ChromaDB', 'AWS S3 / SQS', 'Semantic Chunking', 'LLM Embeddings'],
        links: [
            { label: 'GitHub Profile', url: 'https://github.com/suyash639' }
        ]
    },
    'vscode-debug-agent': {
        title: 'VSCode Debug Agent',
        tagline: 'An AI debugging agent inside VS Code, built on the open-source Blinky agent',
        description: 'A VS Code extension that runs an AI agent against a failing case: it navigates the codebase through language-server tools and code search, edits files, and re-runs a verification step until the fix holds. Built on the open-source Blinky agent (github.com/seahyinghang8/blinky).',
        features: [
            'Code navigation tools: ReadFile, GetFileSymbols, GoToDefinition, GetAllReferences',
            'Search with ripgrep (FindTextInFiles, FindFiles) and endpoint-aware entry discovery (GetFilesRelevantToEndpoint)',
            'Editing tools: ReplaceText, CreateFile, RenameFile, DeleteFile',
            'Verify tool re-runs the check after each fix; Backtrack restores an earlier state to try another path',
            'OpenAI or Azure OpenAI models with a cap on model calls',
            'Sidebar chat UI as a React webview (Vite, VS Code webview UI toolkit)'
        ],
        tech: ['TypeScript', 'VS Code Extension API', 'OpenAI / Azure OpenAI', 'React webview', 'ripgrep'],
        links: [
            { label: 'GitHub Repository', url: 'https://github.com/suyash639/vscodedebug' },
            { label: 'Original Blinky project', url: 'https://github.com/seahyinghang8/blinky' }
        ]
    },
    'email-push-system': {
        title: 'Email & Push Notification System',
        tagline: 'FastAPI notification backend with AWS SES, Firebase Cloud Messaging and an inbound email pipeline',
        description: 'A FastAPI backend that sends email through AWS SES and push notifications through Firebase Cloud Messaging, and processes inbound email: SES stores raw messages in S3, SNS calls a webhook, and a background task parses each message into a MongoDB inbox.',
        features: [
            'Outbound email via AWS SES, recorded in MongoDB with its SES message id',
            'Push notifications via Firebase FCM to a single device, multiple devices or a topic',
            'Inbound email: SES → S3 (raw .eml) → SNS → /webhook/ses → parser → MongoDB inbox, with failures logged to an error collection',
            'Inbox, email detail, delete and per-sender stats endpoints',
            'SQS service for queue messaging and S3 file management routes'
        ],
        tech: ['FastAPI', 'AWS SES / SNS / SQS / S3', 'Firebase FCM', 'MongoDB (Motor)', 'Python'],
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
        title: 'SoYeahLink — LinkedIn Outreach Automation',
        tagline: 'AI profile analysis and personalized outreach, organised into campaigns',
        description: 'A Next.js platform for LinkedIn outreach: it analyzes prospect profiles, generates personalized messages with Groq, and organises outreach into campaigns with engagement analytics.',
        features: [
            'AI profile analysis, single and batch, per prospect and per campaign',
            'Personalized message generation and a reusable message library',
            'Campaigns, automation activity and prospect bulk import / enrichment',
            'LinkedIn account connection and profile search',
            'Engagement analytics dashboards and data export'
        ],
        tech: ['Next.js', 'TypeScript', 'Supabase', 'Groq', 'Tailwind / Radix UI'],
        links: [
            { label: 'Live App', url: 'https://soyeahlink.vercel.app' },
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
   05–07. FLAGSHIP INTERACTIONS → see js/flagship.js
   -------------------------------------------------------------------------- */

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

/* --------------------------------------------------------------------------
   10. MODERN AI SYSTEMS MAP → see js/ai-systems.js
   -------------------------------------------------------------------------- */

/* --------------------------------------------------------------------------
   11. PROFESSIONAL JOURNEY → see js/journey/*.js
   -------------------------------------------------------------------------- */
