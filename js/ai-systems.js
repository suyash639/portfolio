/**
 * Suyash Tiwari — AI Systems & Infrastructure Portfolio
 * "Modern AI Systems" interactive reference architecture (#philosophy section).
 *
 * Rendering model
 *   - Canvas 2D: orbits, directed edges, data packets, atmospheric dust (one draw pass per frame).
 *   - DOM <button>s: core, subsystems and components (accessible, keyboard-navigable, crisp text).
 *   - A small damped-spring integrator drives every node: position, scale, magnetic pull,
 *     click impulses, satellite orbits and pointer parallax all settle physically.
 *
 * The loop only runs while the section is on screen and the tab is visible.
 * With prefers-reduced-motion the map renders as a static, fully interactive diagram.
 */
(() => {
    'use strict';

    /* ----------------------------------------------------------------------
       DATA — conceptual reference architecture
       Pillar copy is carried over verbatim from the previous section.
       ---------------------------------------------------------------------- */
    const svg = (body, size = 22) =>
        `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

    const ICON = {
        core: svg('<rect x="5" y="5" width="14" height="14" rx="2"/><rect x="9.5" y="9.5" width="5" height="5" rx="0.6"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M19 9h3M19 15h3M2 9h3M2 15h3"/>', 26),
        reason: svg('<circle cx="12" cy="12" r="9.5"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>'),
        retrieve: svg('<ellipse cx="12" cy="5.5" rx="7.5" ry="2.8"/><path d="M4.5 5.5v6c0 1.55 3.36 2.8 7.5 2.8s7.5-1.25 7.5-2.8v-6"/><path d="M4.5 11.5v6c0 1.55 3.36 2.8 7.5 2.8s7.5-1.25 7.5-2.8v-6"/>'),
        tools: svg('<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>'),
        act: svg('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'),
        evaluate: svg('<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4 12 14.01l-3-3"/>'),
        production: svg('<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>'),
        play: svg('<path d="M7 5v14l11-7z" fill="currentColor" stroke="none"/>', 12),
        prev: svg('<path d="M15 18l-6-6 6-6"/>', 16),
        next: svg('<path d="M9 18l6-6-6-6"/>', 16),
        back: svg('<path d="M19 12H5M11 18l-6-6 6-6"/>', 14)
    };

    const KINDS = {
        query: { label: 'Request & plan', dark: [226, 232, 240], light: [51, 65, 85] },
        context: { label: 'Context & evidence', dark: [56, 206, 232], light: [8, 128, 160] },
        action: { label: 'Actions & tool calls', dark: [255, 122, 0], light: [221, 98, 0] },
        verify: { label: 'Verification & recovery', dark: [16, 185, 129], light: [4, 140, 98] },
        infra: { label: 'Serving & telemetry', dark: [140, 154, 178], light: [100, 116, 139] }
    };

    const CORE = {
        id: 'core',
        name: 'Orchestration Core',
        kicker: 'Control plane',
        desc: 'The control plane every request passes through. It holds task state, routes work to models and agents, gathers evidence and tool results, and only releases an answer once it has been verified.',
        lifecycle: [
            { name: 'Input', desc: 'A request arrives with its user and session context.', links: [] },
            { name: 'Orchestration', desc: 'The core decomposes the goal, assembles context and decides what runs next.', links: [] },
            { name: 'Agents', desc: 'Specialized agents execute sub-tasks under the orchestrator’s control.', links: ['act'] },
            { name: 'Tools & Memory', desc: 'Agents act through typed tool interfaces and ground themselves in retrieved knowledge.', links: ['tools', 'retrieve'] },
            { name: 'Evaluation', desc: 'Outputs are verified against schemas, sources and policy; failures loop back for recovery.', links: ['evaluate'] },
            { name: 'Output', desc: 'Only verified responses leave the system, with every step traced by the serving layer.', links: ['production'] }
        ]
    };

    const DOMAINS = [
        {
            id: 'reason', num: '01', verb: 'Reason', name: 'AI Intelligence', short: 'Intelligence',
            angle: 210, angleCompact: 240, lbl: 'left', lblCompact: 'above',
            pillar: {
                title: 'AI Should Reason',
                domain: 'Core Cognitive Graph',
                desc: 'Beyond naive generation, systems require structured decomposition, multi-step tree-of-thought verification, stateful graph memory, and explicit consensus loops.',
                tag: 'Graph State Machines & Intent Decoders',
                specExec: 'Deterministic Graph State Decomposition',
                specGuard: 'Verified Consensus Loop & Tree-of-Thought'
            },
            sats: [
                { id: 'foundation-models', name: 'Foundation Models', desc: 'The base reasoning engine. Model choice trades capability against latency, cost and context length, and is a per-task decision rather than a global one.', concepts: ['Model routing', 'Context windows', 'Structured outputs', 'Prompting vs. fine-tuning'] },
                { id: 'reasoning', name: 'Reasoning', desc: 'Decomposing a goal into verifiable steps: planning, reflection and self-checking before the system commits to an action.', concepts: ['Task decomposition', 'Plan-then-execute', 'Self-critique', 'Tree-of-thought'] },
                { id: 'context-engineering', name: 'Context Engineering', desc: 'Deciding exactly what the model sees: instructions, retrieved evidence, tool results and history, assembled, ranked and compressed to fit the window.', concepts: ['Prompt assembly', 'Token budgeting', 'Context compression', 'Few-shot selection'] }
            ]
        },
        {
            id: 'act', num: '04', verb: 'Act', name: 'Agent Runtime', short: 'Agents',
            angle: 270, angleCompact: 300, lbl: 'above', lblCompact: 'above',
            pillar: {
                title: 'AI Should Act',
                domain: 'Autonomous Orchestration',
                desc: 'Autonomous multi-agent taskforces orchestrating specialist roles (Book QA, Notes Desk, Market Analysis) with human-in-the-loop validation checkpoints.',
                tag: 'Multi-Agent Taskforces • Specialist Desks',
                specExec: 'Autonomous Multi-Agent Task Delegation',
                specGuard: 'Human-in-the-Loop Validation Checkpoints'
            },
            sats: [
                { id: 'agent-orchestration', name: 'Agent Orchestration', desc: 'The control loop that plans, delegates and tracks state across agents, deciding who acts next and when a task is actually complete.', concepts: ['Graph state machines', 'Task routing', 'Checkpointing', 'Human-in-the-loop gates'] },
                { id: 'specialized-agents', name: 'Specialized Agents', desc: 'Narrow agents with a single responsibility, their own prompts and their own tools: easier to evaluate and safer to compose than one generalist.', concepts: ['Role isolation', 'Scoped tool access', 'Handoffs', 'Consensus'] },
                { id: 'tool-execution', name: 'Tool Execution', desc: 'Turning model intent into side effects safely: validated arguments, sandboxed calls, timeouts and idempotent retries.', concepts: ['Schema validation', 'Sandboxing', 'Timeouts', 'Idempotency'] }
            ]
        },
        {
            id: 'tools', num: '03', verb: 'Tools', name: 'Connectivity', short: 'Connectivity',
            angle: 330, angleCompact: 0, lbl: 'right', lblCompact: 'below',
            pillar: {
                title: 'AI Should Use Tools',
                domain: 'Deterministic Interfaces',
                desc: 'Deterministic interaction via strict Pydantic schemas, Model Context Protocol (MCP) integrations, parameter sandboxing, and idempotent API execution.',
                tag: 'MCP Protocols • Deterministic Tools',
                specExec: 'Strict Pydantic Schema Validation',
                specGuard: 'Isolated Sandboxed API Execution & Audits'
            },
            sats: [
                { id: 'mcp', name: 'MCP', desc: 'Model Context Protocol: a standard interface for exposing tools, resources and prompts to models, decoupling agents from the integrations they use.', concepts: ['Tool discovery', 'Resources', 'Transports', 'Capability negotiation'] },
                { id: 'external-apis', name: 'External APIs', desc: 'Third-party services wrapped behind typed, rate-aware clients, so a model never talks to the network directly.', concepts: ['Typed clients', 'Rate limits', 'Scoped auth', 'Backoff & retry'] },
                { id: 'databases', name: 'Databases', desc: 'Structured state the system reads and writes, reached through constrained, parameterized interfaces rather than free-form queries.', concepts: ['Parameterized queries', 'Read / write separation', 'Transactions', 'Access control'] },
                { id: 'integrated-tools', name: 'Integrated Tools', desc: 'Code execution, search, file systems and internal services, each exposed with a strict contract and an audit trail.', concepts: ['Strict contracts', 'Audit logs', 'Permissioning', 'Dry runs'] }
            ]
        },
        {
            id: 'evaluate', num: '05', verb: 'Evaluate', name: 'Evaluation & Reliability', short: 'Evaluation',
            angle: 30, angleCompact: 60, lbl: 'right', lblCompact: 'right',
            pillar: {
                title: 'AI Should Be Evaluated',
                domain: 'Continuous Benchmarking',
                desc: 'Continuous regression suites, prompt injection boundary testing, schema compliance checks, and deterministic offline benchmark suites ensuring zero regressions.',
                tag: 'Pytest • 100% Eval Suites • Injection Guards',
                specExec: 'Continuous Pytest Regression Test Suites',
                specGuard: 'Prompt Injection Boundary & Schema Compliance'
            },
            sats: [
                { id: 'evals', name: 'Evals', desc: 'Offline suites that score model and agent behaviour against fixed cases and run on every change, so regressions are caught before users see them.', concepts: ['Golden datasets', 'LLM-as-judge', 'Regression gates', 'Pytest suites'] },
                { id: 'verification', name: 'Verification', desc: 'Checking outputs before they leave the system: schema conformance, grounding against sources and policy constraints.', concepts: ['Schema checks', 'Source grounding', 'Injection guards', 'Policy filters'] },
                { id: 'observability', name: 'Observability', desc: 'A trace for every model call, tool call and decision, so failures can be reproduced and latency attributed to the step that caused it.', concepts: ['Distributed tracing', 'Token accounting', 'P50 / P95 latency', 'Structured logs'] },
                { id: 'error-recovery', name: 'Error Recovery', desc: 'Degrading gracefully when a model, tool or provider fails, instead of failing the whole request.', concepts: ['Circuit breakers', 'Jittered backoff', 'Fallback models', 'Partial results'] }
            ]
        },
        {
            id: 'production', num: '06', verb: 'Production', name: 'Infrastructure', short: 'Infrastructure',
            angle: 90, angleCompact: 120, lbl: 'below', lblCompact: 'below',
            pillar: {
                title: 'AI Should Work in Production',
                domain: 'Hardened Infrastructure',
                desc: 'Hardened with circuit breakers, exponential jitter backoff, PII redaction gateways, P50/P95 telemetry observability, and dynamic inference cache reuse.',
                tag: 'Circuit Breakers • Telemetry • Sub-100ms',
                specExec: 'Circuit Breakers & Exponential Jitter Backoff',
                specGuard: 'PII Redaction Gateways & Realtime Telemetry'
            },
            sats: [
                { id: 'inference-optimization', name: 'Inference Optimization', desc: 'Maximizing useful throughput per accelerator while holding latency targets, by keeping the GPU busy and its memory well used.', concepts: ['Continuous batching', 'KV-cache management', 'Request scheduling', 'Quantization'] },
                { id: 'caching', name: 'Caching', desc: 'Avoiding repeated work at every layer, from exact-match responses to reused prompt prefixes and embeddings.', concepts: ['Prompt-prefix reuse', 'Semantic cache', 'Embedding cache', 'Invalidation'] },
                { id: 'resource-management', name: 'Resource Management', desc: 'Allocating finite GPU memory and compute across concurrent requests and models without starving any of them.', concepts: ['GPU memory budgets', 'Concurrency limits', 'Autoscaling', 'Load shedding'] },
                { id: 'deployment', name: 'Deployment', desc: 'Shipping model and prompt changes like code: versioned, gradually rolled out and reversible.', concepts: ['Versioned prompts', 'Canary rollouts', 'Rollbacks', 'PII redaction'] }
            ]
        },
        {
            id: 'retrieve', num: '02', verb: 'Retrieve', name: 'Knowledge & Memory', short: 'Memory',
            angle: 150, angleCompact: 180, lbl: 'left', lblCompact: 'below',
            pillar: {
                title: 'AI Should Retrieve',
                domain: 'Contextual Grounding Fabric',
                desc: 'Grounding output with hybrid sparse-dense vector search, contextual chunking, re-ranking algorithms, and cryptographically verified provenance citations.',
                tag: 'ChromaDB • Hybrid RAG • Citation Graphs',
                specExec: 'Hybrid Dense/Sparse Vector Search & Re-rank',
                specGuard: 'Cryptographically Verified Citation Graphs'
            },
            sats: [
                { id: 'rag', name: 'RAG', desc: 'Grounding generation in retrieved evidence, so answers cite sources instead of relying on what the model memorised.', concepts: ['Chunking', 'Re-ranking', 'Citations', 'Grounded generation'] },
                { id: 'vector-retrieval', name: 'Vector Retrieval', desc: 'Embedding-based similarity search, usually combined with keyword search to catch the exact matches dense vectors miss.', concepts: ['Embeddings', 'Hybrid dense / sparse', 'ANN indexes', 'Metadata filters'] },
                { id: 'contextual-memory', name: 'Contextual Memory', desc: 'Working memory for the current task, and long-term memory that keeps facts and preferences across sessions.', concepts: ['Working memory', 'Episodic memory', 'Summarization', 'Eviction'] }
            ]
        }
    ];

    // [from, to, kind, label]
    const EDGE_DEFS = [
        ['input', 'core', 'query', 'request'],
        ['core', 'reason', 'context', 'assembled context'],
        ['reason', 'core', 'query', 'plan & decisions'],
        ['core', 'retrieve', 'query', 'retrieval query'],
        ['retrieve', 'reason', 'context', 'retrieved evidence'],
        ['core', 'act', 'action', 'task dispatch'],
        ['act', 'core', 'query', 'agent results'],
        ['act', 'tools', 'action', 'tool calls'],
        ['tools', 'act', 'context', 'tool results'],
        ['core', 'evaluate', 'verify', 'candidate answer'],
        ['evaluate', 'core', 'verify', 'retry & recovery', { dashed: true }],
        ['evaluate', 'output', 'verify', 'verified response'],
        ['production', 'core', 'infra', 'model serving'],
        ['production', 'evaluate', 'infra', 'traces & metrics']
    ];

    const TRACE_ROUTE = [
        'input>core', 'core>retrieve', 'retrieve>reason', 'reason>core',
        'core>act', 'act>tools', 'tools>act', 'act>core', 'core>evaluate', 'evaluate>output'
    ];

    const ORDER = ['core', 'reason', 'retrieve', 'act', 'tools', 'evaluate', 'production'];

    /* ----------------------------------------------------------------------
       MATH HELPERS
       ---------------------------------------------------------------------- */
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    const TAU = Math.PI * 2;
    const easeOut = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);

    // Damped harmonic oscillator, semi-implicit Euler. k = stiffness, z = damping ratio (mass = 1).
    function springStep(o, p, v, target, k, z, dt) {
        const c = 2 * Math.sqrt(k) * z;
        o[v] += (-k * (o[p] - target) - c * o[v]) * dt;
        o[p] += o[v] * dt;
    }

    function qPoint(e, t, out) {
        const u = 1 - t;
        out.x = u * u * e.x0 + 2 * u * t * e.cx + t * t * e.x1;
        out.y = u * u * e.y0 + 2 * u * t * e.cy + t * t * e.y1;
        return out;
    }

    function qTangent(e, t, out) {
        out.x = 2 * (1 - t) * (e.cx - e.x0) + 2 * t * (e.x1 - e.cx);
        out.y = 2 * (1 - t) * (e.cy - e.y0) + 2 * t * (e.y1 - e.cy);
        const l = Math.hypot(out.x, out.y) || 1;
        out.x /= l; out.y /= l;
        return out;
    }

    const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

    /* ----------------------------------------------------------------------
       SYSTEM MAP
       ---------------------------------------------------------------------- */
    class SystemMap {
        constructor(section) {
            this.section = section;
            this.stage = section.querySelector('.ai-stage');
            this.canvas = section.querySelector('.ai-stage__canvas');
            this.ctx = this.canvas && this.canvas.getContext ? this.canvas.getContext('2d') : null;
            this.nodeLayer = section.querySelector('.ai-stage__nodes');
            this.gridLayer = section.querySelector('.ai-stage__grid');
            this.atmoLayer = section.querySelector('.ai-stage__atmo');
            this.inspector = section.querySelector('.ai-inspector');
            this.inspBody = section.querySelector('.ai-insp__body');
            this.inspPath = section.querySelector('.ai-insp__path');
            this.inspCount = section.querySelector('.ai-insp__count');
            this.traceBtn = section.querySelector('.ai-trace-btn');

            this.mqReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
            this.mqFine = window.matchMedia('(hover: hover) and (pointer: fine)');
            this.reduced = this.mqReduced.matches;

            this.nodes = new Map();
            this.edges = [];
            this.edgeById = new Map();
            this.packets = [];
            this.dust = [];
            this.selection = 'core';
            this.hover = null;
            this.pointer = { x: 0, y: 0, inside: false };
            this.parallax = { x: 0, y: 0, vx: 0, vy: 0 };
            this.tilt = { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0 };
            this.time = 0;
            this.last = 0;
            this.raf = 0;
            this.inView = false;
            this.booted = false;
            this.bootTime = 0;
            this.trace = null;
            this.nextAutoTrace = 3.2;
            this.swapTimer = 0;
            this.dark = !document.body.classList.contains('light-mode');
            this._p = { x: 0, y: 0 };
            this._t = { x: 0, y: 0 };

            this.build();
            this.bind();
            this.layout(true);
            this.renderInspector(false);
            this.applyStates();
            section.classList.add('js-ai');

            if (this.reduced) {
                this.boot(true);
            }
        }

        /* ---------------- construction ---------------- */
        build() {
            const frag = document.createDocumentFragment();
            const mk = (tag, cls, html) => {
                const el = document.createElement(tag);
                el.className = cls;
                if (html) el.innerHTML = html;
                return el;
            };

            const addNode = (cfg) => {
                const node = Object.assign({
                    x: 0, y: 0, vx: 0, vy: 0, hx: 0, hy: 0,
                    s: 1, vs: 0, r: 26, depth: 1, phase: Math.random() * TAU,
                    released: false, releaseAt: 0
                }, cfg);
                this.nodes.set(node.id, node);
                frag.appendChild(node.el);
                return node;
            };

            // Core
            const coreEl = mk('button', 'ai-node ai-node--core is-pending',
                `<span class="ai-node__orb"><span class="ai-core__scan" aria-hidden="true"></span>${ICON.core}</span>
                 <span class="ai-node__label"><span class="ai-node__name">Orchestration</span><span class="ai-node__meta">Core</span></span>`);
            coreEl.type = 'button';
            coreEl.dataset.id = 'core';
            coreEl.setAttribute('aria-label', 'Orchestration Core: system overview');
            addNode({ id: 'core', type: 'core', el: coreEl, orb: coreEl.firstElementChild, depth: 0.5 });

            // I/O terminals (non-interactive)
            ['input', 'output'].forEach((id) => {
                const el = mk('div', `ai-io ai-io--${id} is-pending`, `<span class="ai-io__dot"></span>${id === 'input' ? 'Input' : 'Output'}`);
                el.setAttribute('aria-hidden', 'true');
                addNode({ id, type: 'io', el, orb: null, depth: 0.35 });
            });

            // Domains + satellites
            DOMAINS.forEach((d, i) => {
                const el = mk('button', 'ai-node ai-node--domain is-pending',
                    `<span class="ai-node__orb">${ICON[d.id]}</span>
                     <span class="ai-node__label"><span class="ai-node__name"><span class="ai-full">${d.name.replace(' & ', ' &amp;<br>')}</span><span class="ai-short">${d.short}</span></span><span class="ai-node__meta">${d.num} · ${d.verb}</span></span>`);
                el.type = 'button';
                el.dataset.id = d.id;
                el.setAttribute('aria-label', `${d.name}: ${d.pillar.title}`);
                addNode({ id: d.id, type: 'domain', el, orb: el.firstElementChild, data: d, index: i, depth: 0.75 + (i % 3) * 0.15 });

                d.sats.forEach((s, k) => {
                    const sel = mk('button', 'ai-sat', `<span class="ai-sat__dot"></span><span class="ai-sat__label">${s.name}</span>`);
                    sel.type = 'button';
                    sel.dataset.id = s.id;
                    sel.tabIndex = -1;
                    sel.setAttribute('aria-hidden', 'true');
                    sel.setAttribute('aria-label', `${s.name}, part of ${d.name}`);
                    addNode({
                        id: s.id, type: 'sat', el: sel, orb: null, data: s, parent: d.id, k, n: d.sats.length,
                        theta: (k / d.sats.length) * TAU + i * 0.7,
                        omega: 0.32 + (i % 3) * 0.07, // different orbital speeds per subsystem
                        open: false, side: 1, lw: 0, r: 5
                    });
                });
            });

            this.nodeLayer.appendChild(frag);

            // Edges
            EDGE_DEFS.forEach(([from, to, kind, label, opts]) => {
                const e = Object.assign({
                    id: `${from}>${to}`, from, to, kind, label,
                    emph: 0.5, reveal: 0, revealAt: 0, acc: Math.random(), glow: 0,
                    x0: 0, y0: 0, cx: 0, cy: 0, x1: 0, y1: 0, len: 1
                }, opts || {});
                this.edges.push(e);
                this.edgeById.set(e.id, e);
            });
            this.edges.forEach((e) => { e.paired = this.edgeById.has(`${e.to}>${e.from}`); });

            // Neighbour index
            this.neighbors = new Map();
            this.edges.forEach((e) => {
                [[e.from, e.to], [e.to, e.from]].forEach(([a, b]) => {
                    if (!this.neighbors.has(a)) this.neighbors.set(a, new Set());
                    this.neighbors.get(a).add(b);
                });
            });
        }

        /* ---------------- events ---------------- */
        bind() {
            const stage = this.stage;

            stage.addEventListener('pointermove', (ev) => {
                const r = this.stageRect || stage.getBoundingClientRect();
                this.pointer.x = ev.clientX - r.left;
                this.pointer.y = ev.clientY - r.top;
                this.pointer.inside = ev.pointerType === 'mouse';
            }, { passive: true });
            stage.addEventListener('pointerleave', () => { this.pointer.inside = false; }, { passive: true });

            this.nodeLayer.addEventListener('click', (ev) => {
                const btn = ev.target.closest('button[data-id]');
                if (!btn) return;
                this.select(btn.dataset.id, { impulse: true });
            });

            this.nodeLayer.addEventListener('pointerover', (ev) => {
                if (ev.pointerType !== 'mouse') return;
                const btn = ev.target.closest('button[data-id]');
                this.setHover(btn ? btn.dataset.id : null);
            });
            this.nodeLayer.addEventListener('pointerout', (ev) => {
                if (ev.pointerType !== 'mouse') return;
                const to = ev.relatedTarget && ev.relatedTarget.closest ? ev.relatedTarget.closest('button[data-id]') : null;
                if (!to) this.setHover(null);
            });
            this.nodeLayer.addEventListener('focusin', (ev) => {
                const btn = ev.target.closest('button[data-id]');
                if (btn && btn.matches(':focus-visible')) this.setHover(btn.dataset.id);
            });
            this.nodeLayer.addEventListener('focusout', () => this.setHover(null));

            stage.addEventListener('keydown', (ev) => {
                const cur = this.nodes.get(this.selection);
                const base = cur && cur.type === 'sat' ? cur.parent : this.selection;
                let idx = ORDER.indexOf(base);
                if (ev.key === 'ArrowRight' || ev.key === 'ArrowDown') idx = (idx + 1) % ORDER.length;
                else if (ev.key === 'ArrowLeft' || ev.key === 'ArrowUp') idx = (idx - 1 + ORDER.length) % ORDER.length;
                else if (ev.key === 'Home') idx = 0;
                else if (ev.key === 'Escape') idx = cur && cur.type === 'sat' ? ORDER.indexOf(cur.parent) : 0;
                else return;
                ev.preventDefault();
                const id = ORDER[idx];
                this.select(id, { impulse: true });
                this.nodes.get(id).el.focus({ preventScroll: true });
            });

            if (this.traceBtn) {
                this.traceBtn.addEventListener('click', () => this.startTrace(true));
            }

            this.inspector.addEventListener('click', (ev) => {
                const t = ev.target.closest('[data-select], [data-step]');
                if (!t) return;
                if (t.dataset.select) {
                    this.select(t.dataset.select, { impulse: true });
                    return;
                }
                const cur = this.nodes.get(this.selection);
                const base = cur && cur.type === 'sat' ? cur.parent : this.selection;
                const idx = ORDER.indexOf(base);
                const n = ORDER.length;
                const id = ORDER[(idx + (t.dataset.step === 'next' ? 1 : -1) + n) % n];
                this.select(id, { impulse: true });
            });

            // Restrained depth response on the inspector panel (fine pointers only)
            this.inspector.addEventListener('pointermove', (ev) => {
                if (ev.pointerType !== 'mouse' || this.reduced) return;
                const r = this.inspector.getBoundingClientRect();
                const px = (ev.clientX - r.left) / r.width;
                const py = (ev.clientY - r.top) / r.height;
                this.tilt.tx = (px - 0.5) * 2.2;
                this.tilt.ty = (py - 0.5) * -1.6;
                this.inspector.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
                this.inspector.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
                this.ensureRunning();
            }, { passive: true });
            this.inspector.addEventListener('pointerleave', () => { this.tilt.tx = 0; this.tilt.ty = 0; }, { passive: true });

            // Lifecycle
            if ('ResizeObserver' in window) {
                let pending = 0;
                new ResizeObserver(() => {
                    cancelAnimationFrame(pending);
                    pending = requestAnimationFrame(() => this.layout(false));
                }).observe(stage);
            } else {
                window.addEventListener('resize', () => this.layout(false));
            }
            window.addEventListener('scroll', () => { this.stageRect = null; }, { passive: true });

            if ('IntersectionObserver' in window) {
                new IntersectionObserver((entries) => {
                    entries.forEach((en) => {
                        if (en.target === this.section.querySelector('.ai-sys__intro') && en.isIntersecting) {
                            this.section.classList.add('is-in');
                        }
                        if (en.target === stage) {
                            this.inView = en.isIntersecting;
                            if (this.inView && !this.booted) this.boot(this.reduced);
                            if (this.inView) this.ensureRunning();
                        }
                    });
                }, { threshold: [0, 0.18] }).observe(stage);
                const intro = this.section.querySelector('.ai-sys__intro');
                if (intro) {
                    new IntersectionObserver((entries, obs) => {
                        if (entries.some((en) => en.isIntersecting)) {
                            this.section.classList.add('is-in');
                            obs.disconnect();
                        }
                    }, { threshold: 0.2 }).observe(intro);
                }
            } else {
                this.inView = true;
                this.section.classList.add('is-in');
                this.boot(this.reduced);
            }

            document.addEventListener('visibilitychange', () => {
                if (!document.hidden) this.ensureRunning();
            });

            const onReduced = () => {
                this.reduced = this.mqReduced.matches;
                if (this.reduced) {
                    this.packets.length = 0;
                    this.trace = null;
                    this.snapAll();
                    this.draw();
                } else {
                    this.ensureRunning();
                }
            };
            if (this.mqReduced.addEventListener) this.mqReduced.addEventListener('change', onReduced);

            new MutationObserver(() => {
                this.dark = !document.body.classList.contains('light-mode');
                if (this.reduced) this.draw();
            }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
        }

        /* ---------------- layout ---------------- */
        layout(first) {
            const rect = this.stage.getBoundingClientRect();
            this.stageRect = rect;
            const W = rect.width;
            const H = rect.height;
            if (!W || !H) return;
            this.W = W;
            this.H = H;
            const wasCompact = this.compact;
            this.compact = W < 620;
            this.stage.classList.toggle('is-compact', this.compact);

            if (this.ctx) {
                const dpr = Math.min(window.devicePixelRatio || 1, this.compact ? 1.75 : 2);
                this.dpr = dpr;
                this.canvas.width = Math.round(W * dpr);
                this.canvas.height = Math.round(H * dpr);
            }

            const cx = W / 2;
            const cy = this.compact ? H * 0.53 : H * 0.515;
            const rx = this.compact ? W * 0.355 : clamp(W * 0.265, 150, 250);
            const ry = this.compact ? H * 0.28 : clamp(H * 0.33, 150, 260);
            this.ring = { cx, cy, rx, ry };

            const core = this.nodes.get('core');
            core.hx = cx; core.hy = cy;
            this.setLabelPos(core, 'right');

            DOMAINS.forEach((d) => {
                const n = this.nodes.get(d.id);
                const a = ((this.compact ? d.angleCompact : d.angle) * Math.PI) / 180;
                n.angle = a;
                n.hx = cx + rx * Math.cos(a);
                n.hy = cy + ry * Math.sin(a);
                // labels sit on the side facing away from every incoming edge
                this.setLabelPos(n, this.compact ? d.lblCompact : d.lbl);
            });

            const input = this.nodes.get('input');
            const output = this.nodes.get('output');
            if (this.compact) {
                input.hx = cx; input.hy = 76;
                output.hx = cx; output.hy = H - 30;
            } else {
                const ix = Math.max(56, (cx - rx) * 0.38);
                input.hx = ix; input.hy = cy;
                output.hx = W - ix; output.hy = cy;
            }

            // Measure radii used to trim edges at node boundaries
            this.nodes.forEach((n) => {
                if (n.orb) n.r = n.orb.offsetHeight / 2 || n.r;
                if (n.type === 'io') n.r = (this.compact ? n.el.offsetHeight : n.el.offsetWidth) / 2 + 2;
                if (n.type === 'sat') {
                    const lbl = n.el.lastElementChild;
                    n.lw = lbl ? lbl.offsetWidth : 120;
                }
            });

            this.satOrbit = this.compact ? { rx: 30, ry: 10 } : { rx: 42, ry: 13 };

            // Atmospheric dust (depth-layered)
            const count = this.compact ? 16 : 40;
            this.dust = Array.from({ length: count }, () => ({
                x: Math.random() * W,
                y: Math.random() * H,
                z: 0.2 + Math.random() * 0.8,
                vx: (Math.random() - 0.5) * 4,
                vy: -1.5 - Math.random() * 3,
                ph: Math.random() * TAU
            }));

            if (first || wasCompact !== this.compact || this.reduced) {
                this.snapAll(!this.booted);
            }
            this.applyStates();
            if (this.reduced || !this.raf) this.draw();
        }

        setLabelPos(n, pos) {
            if (n.labelPos === pos) return;
            n.el.classList.remove(`ai-node--lbl-${n.labelPos}`);
            n.labelPos = pos;
            n.el.classList.add(`ai-node--lbl-${pos}`);
            n.wx = NaN; // force transform rewrite
        }

        snapAll(toCore) {
            const core = this.nodes.get('core');
            this.nodes.forEach((n) => {
                if (n.type === 'sat') return;
                const pending = toCore && n.type === 'domain';
                n.x = pending ? core.hx : n.hx;
                n.y = pending ? core.hy : n.hy;
                n.vx = n.vy = 0;
            });
            this.nodes.forEach((n) => {
                if (n.type !== 'sat') return;
                const t = this.satTarget(n);
                n.x = t.x; n.y = t.y; n.vx = n.vy = 0;
            });
            this.writeTransforms(true);
        }

        /* ---------------- boot sequence ---------------- */
        boot(instant) {
            if (this.booted) return;
            this.booted = true;
            this.bootTime = this.time;
            this.stage.classList.add('is-booted');

            const nodes = this.nodes;
            if (instant) {
                nodes.forEach((n) => { n.released = true; n.s = 1; n.el.classList.remove('is-pending'); });
                this.edges.forEach((e) => { e.reveal = 1; });
                this.snapAll(false);
                this.draw();
                return;
            }
            // Staggered initialisation: core → subsystems spring out → edges illuminate → I/O + satellites
            nodes.get('core').releaseAt = 0.05;
            DOMAINS.forEach((d, i) => { nodes.get(d.id).releaseAt = 0.2 + i * 0.06; });
            nodes.get('input').releaseAt = 0.7;
            nodes.get('output').releaseAt = 0.85;
            nodes.forEach((n) => {
                if (n.type === 'sat') n.releaseAt = 0.75;
                if (n.type === 'core' || n.type === 'domain') n.s = 0.55;
            });
            this.edges.forEach((e, i) => { e.revealAt = 0.45 + i * 0.045; });
            this.ensureRunning();
        }

        /* ---------------- selection & state ---------------- */
        setHover(id) {
            if (this.hover === id) return;
            this.hover = id;
            this.applyStates();
            if (this.reduced) this.draw();
            else this.ensureRunning();
        }

        select(id, opts = {}) {
            if (!this.nodes.has(id) || this.nodes.get(id).type === 'io') return;
            const changed = this.selection !== id;
            this.selection = id;
            if (opts.impulse) this.kick(id, 1);
            this.applyStates();
            if (changed) this.renderInspector(true);
            if (this.reduced) {
                this.snapAll(false);
                this.draw();
            } else {
                this.ensureRunning();
            }
        }

        focusId() {
            return this.hover || this.selection;
        }

        openDomain() {
            const n = this.nodes.get(this.selection);
            if (!n) return null;
            if (n.type === 'domain') return n.id;
            if (n.type === 'sat') return n.parent;
            return null;
        }

        applyStates() {
            const focus = this.focusId();
            const fNode = this.nodes.get(focus);
            const anchor = fNode && fNode.type === 'sat' ? fNode.parent : focus;
            const overview = anchor === 'core' && !this.hover;
            const linked = new Set([anchor]);
            (this.neighbors.get(anchor) || []).forEach((id) => linked.add(id));
            const openDomain = this.openDomain();
            const selNode = this.nodes.get(this.selection);
            const selParent = selNode && selNode.type === 'sat' ? selNode.parent : null;

            this.nodes.forEach((n) => {
                const el = n.el;
                if (n.type === 'sat') {
                    const open = !this.compact && n.parent === openDomain;
                    if (open !== n.open) {
                        n.open = open;
                        el.classList.toggle('is-open', open);
                        el.tabIndex = open ? 0 : -1;
                        el.setAttribute('aria-hidden', open ? 'false' : 'true');
                    }
                    el.classList.toggle('is-selected', n.id === this.selection);
                    el.classList.toggle('is-hover', n.id === this.hover);
                    el.setAttribute('aria-pressed', n.id === this.selection ? 'true' : 'false');
                    return;
                }
                const selected = n.id === this.selection || n.id === selParent;
                el.classList.toggle('is-selected', selected);
                el.classList.toggle('is-linked', !overview && !selected && linked.has(n.id));
                el.classList.toggle('is-dim', !overview && !linked.has(n.id) && !selected);
                if (n.type !== 'io') el.setAttribute('aria-pressed', n.id === this.selection ? 'true' : 'false');
            });

            this.edges.forEach((e) => {
                const incident = e.from === anchor || e.to === anchor;
                e.target = overview ? 0.5 : incident ? 1 : 0.1;
            });
        }

        kick(id, strength) {
            const n = this.nodes.get(id);
            if (!n || this.reduced) return;
            n.vs += 4.2 * strength; // scale impulse → spring overshoot
            const nb = this.neighbors.get(n.type === 'sat' ? n.parent : id);
            if (nb) {
                nb.forEach((oid) => {
                    const o = this.nodes.get(oid);
                    if (!o || o.type === 'io') return;
                    const dx = o.x - n.x;
                    const dy = o.y - n.y;
                    const l = Math.hypot(dx, dy) || 1;
                    o.vx += (dx / l) * 95 * strength; // momentum propagates along connections
                    o.vy += (dy / l) * 95 * strength;
                    o.vs += 1.2 * strength;
                });
            }
        }

        ping(id) {
            const n = this.nodes.get(id);
            if (!n) return;
            n.el.classList.remove('is-ping');
            void n.el.offsetWidth;
            n.el.classList.add('is-ping');
            clearTimeout(n.pingT);
            n.pingT = setTimeout(() => n.el.classList.remove('is-ping'), 900);
            if (n.type !== 'io') n.vs += 2.2;
        }

        /* ---------------- trace ---------------- */
        startTrace(manual) {
            if (this.reduced) return;
            if (!this.booted) this.boot(false);
            const route = TRACE_ROUTE.map((id) => this.edgeById.get(id)).filter(Boolean);
            this.trace = { route, i: 0, t: 0 };
            this.nextAutoTrace = this.time + (manual ? 14 : 11);
            if (this.traceBtn) this.traceBtn.classList.add('is-tracing');
            this.ping('input');
            this.ensureRunning();
        }

        /* ---------------- loop ---------------- */
        ensureRunning() {
            if (this.raf || this.reduced || !this.inView || document.hidden) return;
            this.last = performance.now();
            this.raf = requestAnimationFrame((t) => this.frame(t));
        }

        frame(now) {
            if (this.reduced || !this.inView || document.hidden) {
                this.raf = 0;
                return;
            }
            const dt = Math.min((now - this.last) / 1000, 1 / 30);
            this.last = now;
            this.time += dt;
            this.update(dt);
            this.draw(true);
            this.raf = requestAnimationFrame((t) => this.frame(t));
        }

        satTarget(n) {
            const p = this.nodes.get(n.parent);
            if (n.open) {
                // Deployed: a labelled column that grows away from the core,
                // clear of the subsystem's own label.
                const gap = 30;
                const span = (n.n - 1) * gap;
                const sin = Math.sin(p.angle);
                const cos = Math.cos(p.angle);
                let side, colX, y0;
                if (Math.abs(sin) > 0.9) {
                    side = 1;
                    colX = p.x + 80;
                    y0 = sin < 0 ? p.y + 12 - span : p.y - 12;
                } else {
                    side = cos >= 0 ? 1 : -1;
                    colX = p.x + side * 34;
                    y0 = sin < 0 ? p.y - 54 - span : p.y + 54;
                }
                const margin = 12;
                if (side > 0) colX = Math.min(colX, this.W - margin - 16 - n.lw);
                else colX = Math.max(colX, margin + 16 + n.lw);
                y0 = clamp(y0, 70, this.H - 24 - span);
                n.side = side;
                this._t.x = colX;
                this._t.y = y0 + n.k * gap;
                return this._t;
            }
            const o = this.satOrbit;
            this._t.x = p.x + Math.cos(n.theta) * o.rx;
            this._t.y = p.y + Math.sin(n.theta) * o.ry;
            return this._t;
        }

        update(dt) {
            const T = this.time - this.bootTime;
            const fine = this.mqFine.matches;

            // Pointer parallax with inertia (critically-ish damped spring)
            const ptx = this.pointer.inside ? (this.pointer.x / this.W - 0.5) * 2 : 0;
            const pty = this.pointer.inside ? (this.pointer.y / this.H - 0.5) * 2 : 0;
            springStep(this.parallax, 'x', 'vx', ptx, 18, 0.9, dt);
            springStep(this.parallax, 'y', 'vy', pty, 18, 0.9, dt);
            const px = this.parallax.x;
            const py = this.parallax.y;
            if (this.gridLayer) this.gridLayer.style.transform = `translate3d(${(-px * 7).toFixed(2)}px,${(-py * 7).toFixed(2)}px,0)`;
            if (this.atmoLayer) this.atmoLayer.style.transform = `translate3d(${(px * 4).toFixed(2)}px,${(py * 4).toFixed(2)}px,0)`;

            const core = this.nodes.get('core');

            this.nodes.forEach((n) => {
                if (!n.released && this.booted && T >= n.releaseAt) {
                    n.released = true;
                    n.el.classList.remove('is-pending');
                }

                if (n.type === 'sat') {
                    if (!n.open) n.theta += n.omega * dt;
                    if (!n.released) {
                        const p = this.nodes.get(n.parent);
                        n.x = p.x; n.y = p.y;
                        return;
                    }
                    const t = this.satTarget(n);
                    springStep(n, 'x', 'vx', t.x, n.open ? 120 : 260, n.open ? 0.62 : 1, dt);
                    springStep(n, 'y', 'vy', t.y, n.open ? 120 : 260, n.open ? 0.62 : 1, dt);
                    return;
                }

                let tx = n.hx + px * 10 * n.depth;
                let ty = n.hy + py * 10 * n.depth;

                if (n.type === 'domain') {
                    if (!n.released) { tx = core.x; ty = core.y; }
                    // Slow idle drift: each body floats on its own phase
                    tx += Math.sin(this.time * 0.55 + n.phase) * 2.2;
                    ty += Math.cos(this.time * 0.47 + n.phase * 1.3) * 2.6;
                }

                // Magnetic attraction toward a nearby cursor (bounded, quadratic falloff)
                if (fine && this.pointer.inside && n.type !== 'io' && n.released) {
                    const dx = this.pointer.x - n.hx;
                    const dy = this.pointer.y - n.hy;
                    const d = Math.hypot(dx, dy);
                    const R = n.type === 'core' ? 150 : 130;
                    if (d < R) {
                        const f = Math.pow(1 - d / R, 2) * 0.16;
                        tx += clamp(dx * f, -9, 9);
                        ty += clamp(dy * f, -9, 9);
                    }
                }

                const k = n.type === 'domain' && n.released && T < n.releaseAt + 1.2 ? 70 : 150;
                springStep(n, 'x', 'vx', tx, k, n.type === 'domain' ? 0.5 : 0.7, dt);
                springStep(n, 'y', 'vy', ty, k, n.type === 'domain' ? 0.5 : 0.7, dt);

                if (n.orb) {
                    const hov = this.hover === n.id ? 1.07 : 1;
                    const st = n.released ? hov : 0.55;
                    springStep(n, 's', 'vs', st, 260, 0.42, dt);
                }
            });

            // Inspector tilt
            const tl = this.tilt;
            springStep(tl, 'x', 'vx', tl.tx, 90, 0.75, dt);
            springStep(tl, 'y', 'vy', tl.ty, 90, 0.75, dt);
            if (Math.abs(tl.x) > 0.005 || Math.abs(tl.y) > 0.005 || tl.tx || tl.ty) {
                this.inspector.style.transform = `perspective(1400px) rotateY(${tl.x.toFixed(3)}deg) rotateX(${tl.y.toFixed(3)}deg)`;
                this.tiltDirty = true;
            } else if (this.tiltDirty) {
                this.inspector.style.transform = '';
                this.tiltDirty = false;
            }

            this.writeTransforms(false);

            // Edges: geometry, emphasis, reveal, packet emission
            const ready = this.booted && T > 1.05;
            const rateScale = this.compact ? 0.55 : 1;
            const maxPackets = this.compact ? 22 : 56;
            this.edges.forEach((e) => {
                this.edgeGeometry(e);
                e.emph += (e.target - e.emph) * Math.min(1, dt * 7);
                e.glow = Math.max(0, e.glow - dt * 0.9);
                if (this.booted && e.reveal < 1 && T >= e.revealAt) {
                    e.reveal = Math.min(1, e.reveal + dt / 0.55);
                }
                if (ready) {
                    const rate = (e.target >= 1 ? 1.15 : e.target < 0.2 ? 0.08 : 0.32) * rateScale;
                    e.acc += dt * rate;
                    if (e.acc >= 1 && this.packets.length < maxPackets) {
                        e.acc -= 1 + Math.random() * 0.6;
                        const speed = 70 + Math.random() * 40;
                        this.packets.push({ e, t: 0, v: speed });
                    } else if (e.acc >= 1) {
                        e.acc = 0;
                    }
                }
            });

            for (let i = this.packets.length - 1; i >= 0; i--) {
                const p = this.packets[i];
                p.t += (p.v / p.e.len) * dt;
                if (p.t >= 1) this.packets.splice(i, 1);
            }

            // Request trace
            if (ready && !this.trace && this.time > this.nextAutoTrace) this.startTrace(false);
            if (this.trace) {
                const tr = this.trace;
                const e = tr.route[tr.i];
                tr.t += (290 / e.len) * dt;
                e.glow = 1;
                if (tr.t >= 1) {
                    this.ping(e.to);
                    tr.i++;
                    tr.t = 0;
                    if (tr.i >= tr.route.length) {
                        this.trace = null;
                        if (this.traceBtn) this.traceBtn.classList.remove('is-tracing');
                    }
                }
            }

            // Dust drift
            this.dust.forEach((d) => {
                d.x += d.vx * dt * d.z;
                d.y += d.vy * dt * d.z;
                if (d.y < -4) { d.y = this.H + 4; d.x = Math.random() * this.W; }
                if (d.x < -4) d.x = this.W + 4;
                if (d.x > this.W + 4) d.x = -4;
            });
        }

        writeTransforms(force) {
            this.nodes.forEach((n) => {
                const x = n.x;
                const y = n.y;
                if (!force && Math.abs(x - (n.wx || 0)) < 0.04 && Math.abs(y - (n.wy || 0)) < 0.04 && Math.abs(n.s - (n.ws || 0)) < 0.0008) return;
                n.wx = x; n.wy = y; n.ws = n.s;
                if (n.type === 'sat') {
                    const left = n.open && n.side < 0;
                    if (left !== n.wLeft) { n.el.classList.toggle('is-left', left); n.wLeft = left; }
                    n.el.style.transform = left
                        ? `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) translate(calc(-100% + 5px),-50%)`
                        : `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) translate(-5px,-50%)`;
                    return;
                }
                if (n.type === 'io') {
                    n.el.style.transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) translate(-50%,-50%)`;
                    return;
                }
                const r = n.r.toFixed(1);
                const pos = n.type === 'core' && this.compact ? 'below' : n.labelPos;
                const anchor = pos === 'above' ? `translate(-50%,calc(-100% + ${r}px))`
                    : pos === 'right' ? `translate(-${r}px,-50%)`
                        : pos === 'left' ? `translate(calc(-100% + ${r}px),-50%)`
                            : `translate(-50%,-${r}px)`;
                n.el.style.transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) ${anchor}`;
                if (n.orb) n.orb.style.transform = `scale(${n.s.toFixed(4)})`;
            });
        }

        edgeGeometry(e) {
            const a = this.nodes.get(e.from);
            const b = this.nodes.get(e.to);
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const L = Math.hypot(dx, dy) || 1;
            const nx = -dy / L;
            const ny = dx / L;
            let bend;
            if (e.paired) {
                bend = 0.13; // mirrored arcs for bidirectional pairs
            } else if (e.from === 'core' || e.to === 'core' || a.type === 'io' || b.type === 'io') {
                bend = 0.06;
            } else {
                // bow toward the core, keeping arcs clear of the outward-facing labels
                const mx = (a.x + b.x) / 2 - this.ring.cx;
                const my = (a.y + b.y) / 2 - this.ring.cy;
                bend = (mx * nx + my * ny >= 0 ? -1 : 1) * 0.16;
            }
            const cx = (a.x + b.x) / 2 + nx * bend * L;
            const cy = (a.y + b.y) / 2 + ny * bend * L;
            let ux = cx - a.x, uy = cy - a.y;
            let ul = Math.hypot(ux, uy) || 1;
            const ra = a.r * (a.orb ? a.s : 1) + 6;
            e.x0 = a.x + (ux / ul) * ra;
            e.y0 = a.y + (uy / ul) * ra;
            ux = cx - b.x; uy = cy - b.y;
            ul = Math.hypot(ux, uy) || 1;
            const rb = b.r * (b.orb ? b.s : 1) + 8;
            e.x1 = b.x + (ux / ul) * rb;
            e.y1 = b.y + (uy / ul) * rb;
            e.cx = cx;
            e.cy = cy;
            e.len = Math.max(20, Math.hypot(e.x1 - e.x0, e.y1 - e.y0) * (1 + bend * bend * 2.5));
        }

        /* ---------------- drawing ---------------- */
        draw(live) {
            const ctx = this.ctx;
            if (!ctx || !this.W) return;
            if (!live) {
                this.edges.forEach((e) => this.edgeGeometry(e));
                this.edges.forEach((e) => { e.emph = e.target; });
            }
            const W = this.W;
            const H = this.H;
            const dark = this.dark;
            const ink = dark ? [226, 232, 240] : [15, 23, 42];
            const kc = (k) => (dark ? KINDS[k].dark : KINDS[k].light);
            const T = this.booted ? this.time - this.bootTime : 0;
            const fade = this.reduced ? 1 : easeOut(T / 0.9);
            ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
            ctx.clearRect(0, 0, W, H);
            if (!this.booted) return;

            const core = this.nodes.get('core');
            const { rx, ry } = this.ring;
            const ox = core.x;
            const oy = core.y;

            // Core illumination
            const breathe = this.reduced ? 1 : 0.85 + Math.sin(this.time * 0.9) * 0.15;
            const g = ctx.createRadialGradient(ox, oy, 0, ox, oy, Math.max(rx, ry) * 0.95);
            g.addColorStop(0, `rgba(255,122,0,${(dark ? 0.11 : 0.07) * breathe * fade})`);
            g.addColorStop(0.45, `rgba(255,122,0,${(dark ? 0.03 : 0.02) * fade})`);
            g.addColorStop(1, 'rgba(255,122,0,0)');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, W, H);

            // Dust (far layer)
            this.dust.forEach((d) => {
                const a = (0.1 + d.z * 0.28) * (0.6 + 0.4 * Math.sin(this.time * 0.8 + d.ph)) * fade;
                ctx.fillStyle = rgba(ink, a * (dark ? 1 : 0.6));
                const x = d.x - this.parallax.x * 14 * d.z;
                const y = d.y - this.parallax.y * 14 * d.z;
                ctx.fillRect(x, y, d.z * 1.6, d.z * 1.6);
            });

            // Orbital structure: inner orbit, subsystem orbit, outer field
            ctx.lineWidth = 1;
            const coreR = core.r * core.s;
            const orbits = [
                { rx: coreR + 22, ry: coreR + 22, a: 0.12, dash: [] },
                { rx, ry, a: 0.075, dash: [2, 7] },
                { rx: rx * 1.32, ry: ry * 1.24, a: 0.04, dash: [] }
            ];
            orbits.forEach((o) => {
                ctx.setLineDash(o.dash);
                ctx.strokeStyle = rgba(ink, o.a * fade);
                ctx.beginPath();
                ctx.ellipse(ox, oy, o.rx, o.ry, 0, 0, TAU);
                ctx.stroke();
            });
            ctx.setLineDash([]);

            // Orbiting bodies — speed falls with radius to establish hierarchy
            const bodies = [
                { o: orbits[0], n: 3, w: 0.62, c: kc('action'), a: 0.85, s: 1.9 },
                { o: orbits[1], n: 4, w: 0.085, c: ink, a: 0.45, s: 1.5 },
                { o: orbits[2], n: 6, w: -0.032, c: ink, a: 0.25, s: 1.2 }
            ];
            bodies.forEach((b) => {
                for (let i = 0; i < b.n; i++) {
                    const th = this.time * b.w + (i / b.n) * TAU + 0.4;
                    const x = ox + Math.cos(th) * b.o.rx;
                    const y = oy + Math.sin(th) * b.o.ry;
                    ctx.fillStyle = rgba(b.c, b.a * fade);
                    ctx.beginPath();
                    ctx.arc(x, y, b.s, 0, TAU);
                    ctx.fill();
                }
            });

            // Satellite orbits around each subsystem
            const so = this.satOrbit;
            const openDomain = this.openDomain();
            DOMAINS.forEach((d) => {
                const n = this.nodes.get(d.id);
                if (!n.released) return;
                const isOpen = d.id === openDomain && !this.compact;
                const emphasised = d.id === openDomain;
                ctx.strokeStyle = rgba(ink, (isOpen ? 0.03 : emphasised ? 0.16 : 0.07) * fade);
                ctx.beginPath();
                ctx.ellipse(n.x, n.y, so.rx, so.ry, 0, 0, TAU);
                ctx.stroke();
            });

            // Satellite bodies (orbiting) and deployed leader lines
            this.nodes.forEach((n) => {
                if (n.type !== 'sat' || !n.released) return;
                const p = this.nodes.get(n.parent);
                if (n.open) {
                    const sel = n.id === this.selection;
                    const dx = n.x - p.x;
                    const dy = n.y - p.y;
                    const l = Math.hypot(dx, dy) || 1;
                    const sx = p.x + (dx / l) * (p.r * p.s + 5);
                    const sy = p.y + (dy / l) * (p.r * p.s + 5);
                    const ex = n.x - (n.side > 0 ? 7 : -7);
                    ctx.strokeStyle = sel ? rgba(kc('action'), 0.75) : rgba(ink, 0.22);
                    ctx.lineWidth = sel ? 1.25 : 1;
                    ctx.beginPath();
                    ctx.moveTo(sx, sy);
                    ctx.quadraticCurveTo(sx + (ex - sx) * 0.55, n.y, ex, n.y);
                    ctx.stroke();
                    ctx.lineWidth = 1;
                    return;
                }
                const front = Math.sin(n.theta) > 0;
                const emph = n.parent === openDomain;
                ctx.fillStyle = rgba(emph ? kc('action') : ink, (front ? 0.75 : 0.3) * (emph ? 1 : 0.8) * fade);
                ctx.beginPath();
                ctx.arc(n.x, n.y, front ? 2.1 : 1.4, 0, TAU);
                ctx.fill();
            });

            // Directed edges
            const P = this._p;
            const Tg = this._t;
            this.edges.forEach((e) => {
                if (e.reveal <= 0) return;
                const em = Math.min(1, e.emph + e.glow * 0.6);
                const c = kc(e.kind);
                const mix = [
                    ink[0] + (c[0] - ink[0]) * em,
                    ink[1] + (c[1] - ink[1]) * em,
                    ink[2] + (c[2] - ink[2]) * em
                ];
                const alpha = (dark ? 0.1 : 0.14) + em * (dark ? 0.5 : 0.55);
                ctx.strokeStyle = rgba(mix, alpha);
                ctx.lineWidth = 1 + em * 0.5;
                ctx.setLineDash(e.dashed ? [3, 5] : []);
                ctx.beginPath();
                ctx.moveTo(e.x0, e.y0);
                if (e.reveal >= 1) {
                    ctx.quadraticCurveTo(e.cx, e.cy, e.x1, e.y1);
                } else {
                    // partial curve via de Casteljau split
                    const s = easeOut(e.reveal);
                    const c1x = e.x0 + (e.cx - e.x0) * s;
                    const c1y = e.y0 + (e.cy - e.y0) * s;
                    qPoint(e, s, P);
                    ctx.quadraticCurveTo(c1x, c1y, P.x, P.y);
                }
                ctx.stroke();
                ctx.setLineDash([]);

                // direction chevron
                if (e.reveal >= 1) {
                    qPoint(e, 0.52, P);
                    qTangent(e, 0.52, Tg);
                    const sz = 3.6 + em * 1.2;
                    ctx.strokeStyle = rgba(mix, Math.min(1, alpha * 1.25));
                    ctx.lineWidth = 1.2;
                    ctx.beginPath();
                    ctx.moveTo(P.x - Tg.x * sz - Tg.y * sz, P.y - Tg.y * sz + Tg.x * sz);
                    ctx.lineTo(P.x, P.y);
                    ctx.lineTo(P.x - Tg.x * sz + Tg.y * sz, P.y - Tg.y * sz - Tg.x * sz);
                    ctx.stroke();
                }
            });
            ctx.lineWidth = 1;

            // Packets
            ctx.globalCompositeOperation = dark ? 'lighter' : 'source-over';
            const drawPacket = (e, t, size, tailPx, aMul, hot) => {
                const c = kc(e.kind);
                qPoint(e, t, P);
                const hx = P.x, hy = P.y;
                const tt = Math.max(0, t - tailPx / e.len);
                qPoint(e, tt, P);
                const grad = ctx.createLinearGradient(P.x, P.y, hx, hy);
                grad.addColorStop(0, rgba(c, 0));
                grad.addColorStop(1, rgba(c, 0.9 * aMul));
                ctx.strokeStyle = grad;
                ctx.lineWidth = size * 1.1;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(P.x, P.y);
                const mid = (tt + t) / 2;
                qPoint(e, mid, P);
                ctx.lineTo(P.x, P.y);
                ctx.lineTo(hx, hy);
                ctx.stroke();
                ctx.fillStyle = rgba(c, 0.16 * aMul);
                ctx.beginPath();
                ctx.arc(hx, hy, size * 3.2, 0, TAU);
                ctx.fill();
                ctx.fillStyle = hot ? `rgba(255,255,255,${aMul})` : rgba(c, aMul);
                ctx.beginPath();
                ctx.arc(hx, hy, size, 0, TAU);
                ctx.fill();
            };

            if (this.reduced) {
                // static markers communicate direction on emphasised paths
                this.edges.forEach((e) => {
                    if (e.target >= 0.4) drawPacket(e, 0.78, 1.8, 26, e.target >= 1 ? 0.9 : 0.5, false);
                });
            } else {
                this.packets.forEach((p) => {
                    const e = p.e;
                    if (e.reveal < 1) return;
                    const a = 0.25 + 0.75 * e.emph;
                    // ease in/out at the ends so packets appear to leave and enter nodes
                    const edgeFade = Math.min(1, p.t * 6, (1 - p.t) * 6);
                    drawPacket(e, p.t, e.emph > 0.8 ? 1.9 : 1.5, 22, a * edgeFade, false);
                });
                if (this.trace) {
                    const tr = this.trace;
                    drawPacket(tr.route[tr.i], tr.t, 2.8, 46, 1, true);
                }
            }
            ctx.globalCompositeOperation = 'source-over';
            ctx.lineCap = 'butt';
        }

        /* ---------------- inspector ---------------- */
        renderInspector(animate) {
            const sel = this.nodes.get(this.selection);
            const body = this.inspBody;
            if (!sel || !body) return;

            let html = '';
            let path = [];
            let count = '';
            const nameOf = (id) => {
                if (id === 'core') return CORE.name;
                if (id === 'input') return 'Input';
                if (id === 'output') return 'Output';
                const d = DOMAINS.find((x) => x.id === id);
                return d ? d.name : id;
            };
            const kindDot = (k) => `<span class="ai-kdot" data-kind="${k}"></span>`;
            let i = 0;
            const st = () => ` style="--i:${i++}"`;

            if (sel.type === 'core') {
                path = ['System', CORE.name];
                count = `00 / 0${DOMAINS.length}`;
                html += `<p class="ai-insp__kicker"${st()}>${CORE.kicker}</p>`;
                html += `<h3 class="ai-insp__title" tabindex="-1"${st()}>${CORE.name}</h3>`;
                html += `<p class="ai-insp__desc"${st()}>${CORE.desc}</p>`;
                html += `<div class="ai-insp__group"${st()}><h4 class="ai-insp__h">Request lifecycle</h4><ol class="ai-steps">`;
                CORE.lifecycle.forEach((s, k) => {
                    const links = s.links.map((id) => `<button type="button" class="ai-link" data-select="${id}">${nameOf(id)}</button>`).join('');
                    html += `<li class="ai-step"><span class="ai-step__n">0${k + 1}</span><div><p class="ai-step__name">${s.name}${links ? `<span class="ai-step__links">${links}</span>` : ''}</p><p class="ai-step__desc">${s.desc}</p></div></li>`;
                });
                html += '</ol></div>';
            } else if (sel.type === 'domain') {
                const d = sel.data;
                path = ['System', d.name];
                count = `${String(ORDER.indexOf(d.id)).padStart(2, '0')} / 0${DOMAINS.length}`;
                html += `<p class="ai-insp__kicker"${st()}>Pillar ${d.num} · ${d.pillar.domain}</p>`;
                html += `<h3 class="ai-insp__title" tabindex="-1"${st()}>${d.pillar.title}</h3>`;
                html += `<p class="ai-insp__desc"${st()}>${d.pillar.desc}</p>`;
                html += `<div class="ai-insp__group"${st()}><h4 class="ai-insp__h">Components</h4><div class="ai-chips">`;
                d.sats.forEach((s) => { html += `<button type="button" class="ai-chip" data-select="${s.id}">${s.name}</button>`; });
                html += '</div></div>';
                html += this.flowsHTML(d.id, nameOf, kindDot, st());
                html += `<dl class="ai-specs"${st()}>
                    <div><dt>Execution</dt><dd>${d.pillar.specExec}</dd></div>
                    <div><dt>Guarantee</dt><dd>${d.pillar.specGuard}</dd></div>
                    <div><dt>Protocol</dt><dd>${d.pillar.tag}</dd></div>
                </dl>`;
            } else if (sel.type === 'sat') {
                const d = DOMAINS.find((x) => x.id === sel.parent);
                const s = sel.data;
                path = [d.name, s.name];
                count = `${String(ORDER.indexOf(d.id)).padStart(2, '0')} / 0${DOMAINS.length}`;
                html += `<p class="ai-insp__kicker"${st()}>${d.name} · Component</p>`;
                html += `<h3 class="ai-insp__title" tabindex="-1"${st()}>${s.name}</h3>`;
                html += `<p class="ai-insp__desc"${st()}>${s.desc}</p>`;
                html += `<div class="ai-insp__group"${st()}><h4 class="ai-insp__h">Key concepts</h4><ul class="ai-concepts">`;
                s.concepts.forEach((c) => { html += `<li>${c}</li>`; });
                html += '</ul></div>';
                html += `<div class="ai-insp__group"${st()}><h4 class="ai-insp__h">Within ${d.name}</h4><div class="ai-chips">`;
                d.sats.forEach((o) => {
                    html += o.id === s.id
                        ? `<span class="ai-chip is-current" aria-current="true">${o.name}</span>`
                        : `<button type="button" class="ai-chip" data-select="${o.id}">${o.name}</button>`;
                });
                html += '</div></div>';
                html += this.flowsHTML(d.id, nameOf, kindDot, st());
                html += `<button type="button" class="ai-back"${st()} data-select="${d.id}">${ICON.back}<span>${d.pillar.title}</span></button>`;
            }

            const apply = () => {
                const hadFocus = this.inspBody.contains(document.activeElement);
                body.innerHTML = html;
                body.classList.remove('is-leaving');
                if (animate && !this.reduced) {
                    body.classList.remove('is-entering');
                    void body.offsetWidth;
                    body.classList.add('is-entering');
                }
                if (this.inspPath) {
                    this.inspPath.innerHTML = path.map((p, k) => k === path.length - 1 ? `<b>${p}</b>` : `<span>${p}</span>`).join('<i>/</i>');
                }
                if (this.inspCount) this.inspCount.textContent = count;
                if (hadFocus) {
                    const t = body.querySelector('.ai-insp__title');
                    if (t) t.focus({ preventScroll: true });
                }
            };

            clearTimeout(this.swapTimer);
            if (animate && !this.reduced && body.childElementCount) {
                body.classList.add('is-leaving');
                this.swapTimer = setTimeout(apply, 140);
            } else {
                apply();
            }
        }

        flowsHTML(id, nameOf, kindDot, styleAttr) {
            const rows = this.edges.filter((e) => e.from === id || e.to === id).map((e) => {
                const out = e.from === id;
                const other = out ? e.to : e.from;
                const target = other === 'input' || other === 'output'
                    ? `<span class="ai-flow__node">${nameOf(other)}</span>`
                    : `<button type="button" class="ai-link" data-select="${other}">${nameOf(other)}</button>`;
                return `<li class="ai-flow"><span class="ai-flow__dir">${out ? 'Out' : 'In'}</span>${kindDot(e.kind)}${target}<span class="ai-flow__label">${e.label}</span></li>`;
            });
            return `<div class="ai-insp__group"${styleAttr}><h4 class="ai-insp__h">Data paths</h4><ul class="ai-flows">${rows.join('')}</ul></div>`;
        }
    }

    function init() {
        const section = document.getElementById('philosophy');
        if (!section || !section.querySelector('.ai-stage')) return;
        try {
            window.aiSystemMap = new SystemMap(section);
        } catch (err) {
            // The section's static content stays readable even if the visualization fails.
            console.warn('AI system map failed to initialise:', err);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
