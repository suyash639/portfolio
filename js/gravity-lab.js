/**
 * Gravity Lab (#skills) — an interactive physics playground for the engineering stack.
 *
 * Simulation: Matter.js (rigid circles, collisions, constraints). Rendering: one 2D canvas
 * (cached sphere sprites, particles, fields, connections). The DOM only holds controls,
 * the inspector, the stack builder and an accessible listbox mirroring the bubbles.
 *
 * Modes add acceleration fields on top of Matter's integrator:
 *   zero    – no gravity; a weak tether floats each skill back toward its category cluster
 *   normal  – gravity ramps in; bubbles fall, stack and bounce
 *   attract – a cursor/finger field pulls nearby bubbles (falls off with distance²)
 *   repel   – the same field pushes them away
 *   orbit   – one bubble becomes a static anchor; the rest are held on elliptical rings by a
 *             central (centripetal) force, a ring-radius spring and a tangential speed controller
 * Every mode change blends its gains in over ~0.9s so there are no velocity jumps.
 *
 * Skill → project relations come from the repositories and the case studies on this site.
 */
(() => {
    'use strict';

    /* ------------------------------------------------------------------ data */
    const CATS = {
        agent: { name: 'Agentic AI', rgb: [192, 132, 252] },
        rag: { name: 'RAG & Knowledge', rgb: [45, 212, 191] },
        infer: { name: 'Inference & ML', rgb: [251, 146, 60] },
        infra: { name: 'Backend & Infra', rgb: [96, 165, 250] }
    };
    const CAT_ORDER = ['agent', 'rag', 'infer', 'infra'];

    const PROJECTS = {
        arbiter: { name: 'Arbiter', href: '#flagship' },
        inferopt: { name: 'InferOpt', href: '#flagship' },
        finpipe: { name: 'Financial AI Data Pipeline', href: '#flagship' },
        neptunus: { name: 'Neptunus Power', href: '#experience' },
        netsmartz: { name: 'Netsmartz', href: '#experience' },
        nasa: { name: 'NASA ATX', href: '#experience' },
        debug: { name: 'VSCode Debug Agent', href: '#systems' },
        notify: { name: 'Notification System', href: '#systems' },
        taskforce: { name: 'Multi-Agent Taskforce', href: '#systems' },
        soyeahlink: { name: 'SoYeahLink', href: '#systems' },
        prepstack: { name: 'PrepStack', href: 'https://github.com/suyash639/PrepStack', ext: true }
    };

    // [id, label, category, size tier, what it is, its practical role, projects]
    const SKILLS = [
        ['python', 'Python', 'agent', 3, 'The language behind my agents, backends and ML work.', 'Runtime for agents, services and data pipelines.', ['arbiter', 'inferopt', 'finpipe', 'neptunus', 'netsmartz', 'nasa', 'notify']],
        ['agno', 'Agno', 'agent', 2, 'A Python framework for agents with tools, instructions and structured output.', 'Agent runtime: defines each desk, its prompt and its tools.', ['arbiter']],
        ['toolcall', 'Tool Calling', 'agent', 2, 'Letting a model invoke typed functions instead of guessing an answer.', 'Turns model intent into schema-checked, verifiable actions.', ['arbiter', 'debug']],
        ['multiagent', 'Multi-Agent', 'agent', 2, 'Specialist agents coordinated by an orchestrator.', 'Routes each request to the agent that owns that domain.', ['arbiter', 'taskforce']],
        ['pydantic', 'Pydantic', 'agent', 2, 'Typed data validation for Python.', 'The contract between model output, tools and APIs.', ['arbiter', 'inferopt', 'neptunus', 'netsmartz', 'notify']],
        ['evals', 'Evals', 'agent', 1, 'Offline test sets that score routing, factuality, safety and schema adherence.', 'Shows a change is an improvement before it ships.', ['arbiter']],
        ['langchain', 'LangChain', 'agent', 2, 'A framework for composing LLM calls, retrievers and prompts.', 'Orchestrates retrieval and generation steps.', ['netsmartz']],
        ['llama', 'LLaMA', 'agent', 1, 'An open-weight language model family.', 'The model behind the agents.', ['taskforce']],
        ['openai', 'OpenAI API', 'agent', 1, 'The chat-completions API, also the common interface of compatible servers.', 'Model access for agents, through a gateway.', ['debug', 'arbiter']],
        ['groq', 'Groq', 'agent', 1, 'A low-latency hosted inference API.', 'Fast generation for analysis and drafting.', ['soyeahlink']],

        ['rag', 'RAG', 'rag', 3, 'Retrieval-augmented generation: answers built from retrieved evidence.', 'Grounds answers in your own documents, with citations.', ['neptunus', 'netsmartz']],
        ['embeddings', 'Embeddings', 'rag', 2, 'Vectors that place similar meaning close together.', 'Turns chunks and queries into searchable vectors.', ['finpipe', 'neptunus', 'netsmartz']],
        ['hybrid', 'Hybrid Search', 'rag', 2, 'Dense semantic search fused with keyword search.', 'Catches exact codes and identifiers that vectors miss.', ['neptunus', 'netsmartz']],
        ['bm25', 'BM25', 'rag', 1, 'A classic keyword ranking function.', 'The keyword half of hybrid retrieval.', ['neptunus', 'netsmartz']],
        ['chroma', 'ChromaDB', 'rag', 2, 'An open-source vector database.', 'Stores embeddings with metadata for filtered search.', ['finpipe', 'taskforce']],
        ['chunking', 'Chunking', 'rag', 1, 'Splitting documents into retrievable pieces, keeping structure and token budgets.', 'Decides what the retriever is able to find.', ['netsmartz', 'finpipe']],

        ['vllm', 'vLLM', 'infer', 3, 'A high-throughput LLM serving engine for NVIDIA GPUs.', 'Executes batched generation on the GPU.', ['inferopt']],
        ['mlx', 'MLX', 'infer', 2, 'Apple’s array framework for inference on Apple silicon.', 'Local backend for running and benchmarking models on a Mac.', ['inferopt']],
        ['kvcache', 'KV Cache', 'infer', 2, 'Stored attention keys and values, so past tokens are not recomputed.', 'The memory that long contexts and concurrent requests compete for.', ['inferopt']],
        ['paged', 'PagedAttention', 'infer', 1, 'vLLM’s paged layout for KV-cache memory.', 'Keeps KV memory dense so more requests fit at once.', ['inferopt']],
        ['batching', 'Batching', 'infer', 2, 'Grouping requests so the GPU serves many at once.', 'Trades a little latency for much higher throughput.', ['inferopt']],
        ['routing', 'Routing', 'infer', 2, 'Choosing a model, endpoint or agent per request.', 'Sends each request where it is served best.', ['inferopt', 'arbiter']],
        ['tensorflow', 'TensorFlow', 'infer', 1, 'A deep-learning framework.', 'Training and running neural-network models.', ['nasa']],

        ['fastapi', 'FastAPI', 'infra', 3, 'An async Python web framework with typed request models.', 'The API layer in front of agents, pipelines and models.', ['arbiter', 'inferopt', 'finpipe', 'netsmartz', 'notify', 'prepstack']],
        ['typescript', 'TypeScript', 'infra', 2, 'Typed JavaScript.', 'Front ends and the VS Code extension.', ['arbiter', 'debug', 'soyeahlink']],
        ['react', 'React', 'infra', 2, 'A UI library for interactive interfaces.', 'Operator consoles and product interfaces.', ['arbiter', 'debug', 'soyeahlink', 'taskforce']],
        ['nextjs', 'Next.js', 'infra', 2, 'A React framework with server routes.', 'Full-stack web apps: UI and API in one deployment.', ['soyeahlink', 'prepstack']],
        ['node', 'Node.js', 'infra', 1, 'A JavaScript runtime.', 'Runs the extension host and server routes.', ['debug', 'soyeahlink']],
        ['mongodb', 'MongoDB', 'infra', 2, 'A document database.', 'Stores delivery records and the parsed inbox.', ['notify']],
        ['postgres', 'Postgres', 'infra', 1, 'A relational database.', 'System of record for application data.', ['prepstack']],
        ['redis', 'Redis', 'infra', 1, 'An in-memory data store.', 'Caching and fast shared state.', ['prepstack']],
        ['supabase', 'Supabase', 'infra', 1, 'Postgres with auth and APIs as a service.', 'Auth and data for a full-stack app.', ['soyeahlink']],
        ['docker', 'Docker', 'infra', 2, 'Containers for reproducible environments.', 'Packages services so they run the same everywhere.', ['arbiter', 'prepstack']],
        ['aws', 'AWS', 'infra', 2, 'SES, SNS, SQS and S3.', 'Email delivery, events, queues and object storage.', ['notify', 'finpipe']],
        ['firebase', 'Firebase', 'infra', 1, 'Google’s app platform, including Cloud Messaging.', 'Push notifications to devices and topics.', ['notify']],
        ['vscode', 'VS Code API', 'infra', 1, 'The extension API of Visual Studio Code.', 'Editor integration: navigation, edits and a webview UI.', ['debug']]
    ].map(([id, label, cat, tier, desc, role, projects]) => ({ id, label, cat, tier, desc, role, projects }));
    const BY_ID = Object.fromEntries(SKILLS.map((s) => [s.id, s]));

    const CHALLENGES = {
        agent: {
            brief: 'Give a model a runtime, an API, typed contracts, tools it can call and a team to work in.',
            slots: [['python', 'runtime'], ['fastapi', 'API layer'], ['pydantic', 'typed contracts'], ['toolcall', 'action interface'], ['multiagent', 'coordination']]
        },
        rag: {
            brief: 'Turn documents into evidence: split them, embed them, store them, retrieve well and answer from what you find.',
            slots: [['chunking', 'document splitting'], ['embeddings', 'vector representation'], ['chroma', 'vector store'], ['hybrid', 'retrieval strategy'], ['rag', 'grounded generation']]
        },
        infer: {
            brief: 'Serve a model fast: an engine, the memory it lives in, how that memory is laid out, how requests share the GPU and where each one goes.',
            slots: [['vllm', 'serving engine'], ['kvcache', 'attention memory'], ['paged', 'memory layout'], ['batching', 'throughput'], ['routing', 'request placement']]
        },
        free: { brief: 'Pick any skills. Each one you add is wired into the system; projects that really use the combination appear below.', slots: [] }
    };

    /* ------------------------------------------------------------- helpers */
    const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
    const lerp = (a, b, t) => a + (b - a) * t;
    const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
    const mix = (c, d, t) => [Math.round(lerp(c[0], d[0], t)), Math.round(lerp(c[1], d[1], t)), Math.round(lerp(c[2], d[2], t))];

    function init() {
        const section = document.getElementById('skills');
        if (!section || !section.classList.contains('gl')) return;
        const stage = section.querySelector('.gl-stage');
        const canvas = stage.querySelector('.gl-canvas');
        const ctx = canvas.getContext && canvas.getContext('2d');
        const keys = stage.querySelector('.gl-keys');
        const status = stage.querySelector('.gl-status');
        const intro = stage.querySelector('.gl-intro');
        const modeHint = stage.querySelector('.gl-modehint');
        const insp = stage.querySelector('.gl-insp');
        const build = section.querySelector('.gl-build');
        const buildBtn = section.querySelector('[data-act="build"]');
        const chaosBtn = section.querySelector('[data-act="chaos"]');
        const modeBtns = Array.from(section.querySelectorAll('.gl-mode'));

        if (!window.Matter || !ctx) { fallback(section); return; }
        const { Engine, Bodies, Body, Composite, Constraint, Events } = window.Matter;

        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const coarse = window.matchMedia('(pointer: coarse)').matches;

        /* -------------------------------------------------- world + bodies */
        const engine = Engine.create({ gravity: { x: 0, y: 0, scale: 0.001 }, positionIterations: 8, velocityIterations: 6 });
        const world = engine.world;
        let W = 0, H = 0, dpr = 1, scale = 1;
        let walls = [];
        const bodies = [];
        let homes = {};
        let catLabels = [];

        SKILLS.forEach((s, i) => {
            const b = Bodies.circle(100 + i, 100, 30, { restitution: 0.62, friction: 0.02, frictionAir: 0.012, density: 0.0016, slop: 0.02 });
            b.skill = s;
            b.r = 30;
            b.phase = Math.random() * Math.PI * 2;
            b.vis = { s: 1, v: 0, t: 1 };      // visual scale spring
            b.glow = 0;                          // eased highlight 0..1
            b.trail = [];
            b.sprite = null;
            bodies.push(b);
        });
        Composite.add(world, bodies);
        const bodyById = Object.fromEntries(bodies.map((b) => [b.skill.id, b]));

        function radiusFor(tier) { return ({ 3: 47, 2: 39, 1: 32 })[tier] * scale; }

        function buildWalls() {
            if (walls.length) Composite.remove(world, walls);
            const t = 400;
            walls = [
                Bodies.rectangle(W / 2, -t / 2, W + 2 * t, t, { isStatic: true }),
                Bodies.rectangle(W / 2, H + t / 2, W + 2 * t, t, { isStatic: true }),
                Bodies.rectangle(-t / 2, H / 2, t, H + 2 * t, { isStatic: true }),
                Bodies.rectangle(W + t / 2, H / 2, t, H + 2 * t, { isStatic: true })
            ];
            walls.forEach((w) => { w.restitution = 0.5; w.friction = 0.05; });
            Composite.add(world, walls);
        }

        // category clusters: four columns on wide stages, a 2×2 grid on narrow ones
        function layoutHomes() {
            homes = {};
            catLabels = [];
            const wide = W >= 900;
            const groups = CAT_ORDER.map((c) => bodies.filter((b) => b.skill.cat === c).sort((a, b) => b.skill.tier - a.skill.tier));
            const cells = [];
            if (wide) {
                const weights = groups.map((g) => Math.sqrt(g.length));
                const total = weights.reduce((a, b) => a + b, 0);
                let x = 0;
                weights.forEach((w) => { const cw = (W * w) / total; cells.push({ x, y: 0, w: cw, h: H }); x += cw; });
            } else {
                // 2×2: each row splits its width by cluster size, rows by their larger cluster
                const n = groups.map((g) => g.length);
                const hTop = H * clamp(Math.sqrt(Math.max(n[0], n[1])) / (Math.sqrt(Math.max(n[0], n[1])) + Math.sqrt(Math.max(n[2], n[3]))), 0.4, 0.5);
                const w0 = W * Math.sqrt(n[0]) / (Math.sqrt(n[0]) + Math.sqrt(n[1]));
                const w2 = W * Math.sqrt(n[2]) / (Math.sqrt(n[2]) + Math.sqrt(n[3]));
                cells.push({ x: 0, y: 0, w: w0, h: hTop }, { x: w0, y: 0, w: W - w0, h: hTop },
                    { x: 0, y: hTop, w: w2, h: H - hTop }, { x: w2, y: hTop, w: W - w2, h: H - hTop });
            }
            groups.forEach((g, gi) => {
                const cell = cells[gi];
                const cx = cell.x + cell.w / 2;
                const cy = cell.y + cell.h / 2 + (wide ? 14 : 10);
                const avg = g.reduce((a, b) => a + b.r, 0) / g.length;
                const step = avg * 1.12;
                let maxY = 0;
                g.forEach((b, k) => {
                    const rr = step * Math.sqrt(k) * 1.35;
                    const a = k * 2.39996;
                    const sx = Math.min(1, (cell.w / 2 - avg - 6) / Math.max(1, step * Math.sqrt(g.length) * 1.35));
                    const x = clamp(cx + Math.cos(a) * rr * Math.max(0.6, sx), cell.x + b.r + 4, cell.x + cell.w - b.r - 4);
                    const y = clamp(cy + Math.sin(a) * rr * 0.92, cell.y + b.r + 34, cell.y + cell.h - b.r - 6);
                    homes[b.skill.id] = { x, y };
                    maxY = Math.max(maxY, Math.abs(y - cy) + b.r);
                });
                catLabels.push({ cat: CAT_ORDER[gi], x: cx, y: cell.y + 18 });
            });
        }

        function makeSprite(b) {
            const r = b.r;
            const pad = 4;
            const size = Math.ceil((r + pad) * 2 * dpr);
            const c = document.createElement('canvas');
            c.width = c.height = size;
            const g = c.getContext('2d');
            g.scale(dpr, dpr);
            const o = r + pad;
            const col = CATS[b.skill.cat].rgb;
            const lift = b.skill.tier === 3 ? 1 : b.skill.tier === 2 ? 0.8 : 0.62;
            // body: dark glass tinted by its category
            let gr = g.createRadialGradient(o - r * 0.35, o - r * 0.45, r * 0.05, o, o, r);
            gr.addColorStop(0, rgba(mix(col, [255, 255, 255], 0.35), 0.42 * lift));
            gr.addColorStop(0.5, rgba(mix(col, [12, 13, 17], 0.72), 0.95));
            gr.addColorStop(1, rgba(mix(col, [8, 9, 12], 0.86), 1));
            g.fillStyle = gr;
            g.beginPath(); g.arc(o, o, r, 0, Math.PI * 2); g.fill();
            // rim light from below-right
            gr = g.createRadialGradient(o + r * 0.35, o + r * 0.55, r * 0.2, o + r * 0.2, o + r * 0.3, r * 1.05);
            gr.addColorStop(0, rgba(col, 0));
            gr.addColorStop(0.75, rgba(col, 0));
            gr.addColorStop(1, rgba(col, 0.38 * lift));
            g.fillStyle = gr;
            g.beginPath(); g.arc(o, o, r, 0, Math.PI * 2); g.fill();
            // edge
            g.strokeStyle = rgba(col, 0.32 + 0.3 * lift);
            g.lineWidth = 1.1;
            g.beginPath(); g.arc(o, o, r - 0.6, 0, Math.PI * 2); g.stroke();
            // specular highlight
            gr = g.createRadialGradient(o - r * 0.38, o - r * 0.5, 0, o - r * 0.38, o - r * 0.5, r * 0.42);
            gr.addColorStop(0, 'rgba(255,255,255,0.34)');
            gr.addColorStop(1, 'rgba(255,255,255,0)');
            g.fillStyle = gr;
            g.beginPath(); g.arc(o, o, r, 0, Math.PI * 2); g.fill();
            // label
            const lines = fitLabel(g, b.skill.label, r);
            g.fillStyle = 'rgba(244,246,250,0.95)';
            g.textAlign = 'center';
            g.textBaseline = 'middle';
            const lh = lines.size * 1.12;
            lines.text.forEach((t, i) => g.fillText(t, o, o + (i - (lines.text.length - 1) / 2) * lh + 0.5));
            b.sprite = c;
            b.spriteO = o;
        }

        // prefer one line; then split at a space or hyphen; split camelCase words only as a last resort
        function fitLabel(g, label, r) {
            const fam = getComputedStyle(document.documentElement).getPropertyValue('--font-main') || 'Inter, sans-serif';
            const maxW = r * 1.66;
            const split = (re) => {
                const parts = label.split(re);
                if (parts.length < 2) return null;
                let best = null;
                for (let i = 1; i < parts.length; i++) {
                    const a = parts.slice(0, i).join('').trim(), bb = parts.slice(i).join('').trim();
                    const d = Math.abs(a.length - bb.length);
                    if (!best || d < best.d) best = { d, l: [a, bb] };
                }
                return best.l;
            };
            const fits = (lines, size) => { g.font = `600 ${size}px ${fam}`; return lines.every((t) => g.measureText(t).width <= maxW); };
            const top = clamp(r * 0.34, 9, 15);
            const tries = [[label], split(/(?<=[ -])/), split(/(?<=[a-z])(?=[A-Z][a-z])/)].filter(Boolean);
            const floors = [10.5, 9.5, 9];
            for (let i = 0; i < tries.length; i++) {
                for (let size = top; size >= Math.min(top, floors[i]); size -= 0.5) if (fits(tries[i], size)) return { text: tries[i], size };
            }
            for (let size = 9; size >= 7.5; size -= 0.5) for (const t of tries) if (fits(t, size)) return { text: t, size };
            g.font = `600 7.5px ${fam}`;
            return { text: tries[tries.length - 1], size: 7.5 };
        }

        /* ------------------------------------------------- canvas + sizing */
        let bg = null;
        function paintBackground() {
            bg = document.createElement('canvas');
            bg.width = Math.ceil(W * dpr); bg.height = Math.ceil(H * dpr);
            const g = bg.getContext('2d');
            g.scale(dpr, dpr);
            g.fillStyle = '#08090b';
            g.fillRect(0, 0, W, H);
            let gr = g.createRadialGradient(W * 0.5, H * 0.05, 0, W * 0.5, H * 0.05, Math.max(W, H) * 0.75);
            gr.addColorStop(0, 'rgba(255,255,255,0.045)');
            gr.addColorStop(1, 'rgba(255,255,255,0)');
            g.fillStyle = gr; g.fillRect(0, 0, W, H);
            const step = W < 600 ? 28 : 36;
            g.strokeStyle = 'rgba(236,238,242,0.035)';
            g.lineWidth = 1;
            g.beginPath();
            for (let x = (W % step) / 2; x < W; x += step) { g.moveTo(Math.round(x) + 0.5, 0); g.lineTo(Math.round(x) + 0.5, H); }
            for (let y = (H % step) / 2; y < H; y += step) { g.moveTo(0, Math.round(y) + 0.5); g.lineTo(W, Math.round(y) + 0.5); }
            g.stroke();
            g.fillStyle = 'rgba(236,238,242,0.08)';
            for (let x = (W % step) / 2; x < W; x += step * 4) for (let y = (H % step) / 2; y < H; y += step * 4) g.fillRect(x - 1, y - 1, 2, 2);
            gr = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
            gr.addColorStop(0, 'rgba(0,0,0,0)');
            gr.addColorStop(1, 'rgba(0,0,0,0.55)');
            g.fillStyle = gr; g.fillRect(0, 0, W, H);
        }

        let dust = [];
        function seedDust() {
            const n = reduced ? 0 : W < 600 ? 16 : 38;
            dust = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 0.12, vy: (Math.random() - 0.5) * 0.12, a: 0.08 + Math.random() * 0.18, s: Math.random() < 0.2 ? 1.6 : 1 }));
        }

        let sized = false;
        function resize() {
            const rect = stage.getBoundingClientRect();
            const nw = Math.round(rect.width), nh = Math.round(rect.height);
            if (!nw || !nh || (nw === W && nh === H && sized)) return;
            const ow = W, oh = H;
            W = nw; H = nh;
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
            canvas.style.width = `${W}px`; canvas.style.height = `${H}px`;
            const baseArea = SKILLS.reduce((a, s) => a + Math.PI * Math.pow(({ 3: 47, 2: 39, 1: 32 })[s.tier], 2), 0);
            const cap = W < 600 ? 0.31 : W < 900 ? 0.25 : 0.27;
            scale = clamp(Math.min(1, Math.sqrt((cap * W * H) / baseArea)), 0.55, 1);
            bodies.forEach((b) => {
                const r = radiusFor(b.skill.tier);
                if (Math.abs(r - b.r) > 0.01) {
                    const wasStatic = b.isStatic;
                    if (wasStatic) Body.setStatic(b, false);
                    Body.scale(b, r / b.r, r / b.r);
                    if (wasStatic) Body.setStatic(b, true);
                    b.r = r;
                }
                makeSprite(b);
            });
            buildWalls();
            layoutHomes();
            paintBackground();
            seedDust();
            if (!sized) {
                bodies.forEach((b) => {
                    const h = homes[b.skill.id];
                    const j = reduced ? 0 : 1;
                    Body.setPosition(b, { x: h.x + (Math.random() - 0.5) * 30 * j, y: h.y + (Math.random() - 0.5) * 30 * j });
                    Body.setVelocity(b, { x: 0, y: 0 });
                });
                sized = true;
            } else if (ow && oh) {
                bodies.forEach((b) => {
                    Body.setPosition(b, { x: clamp(b.position.x * (W / ow), b.r, W - b.r), y: clamp(b.position.y * (H / oh), b.r, H - b.r) });
                });
            }
            if (mode === 'orbit') assignOrbits();
            if (!running) render(performance.now());
        }

        /* ---------------------------------------------------------- state */
        let mode = 'zero';
        let blend = 1;                   // 0→1 ramp after each mode change
        let pointer = { x: 0, y: 0, inside: false, field: false };
        let drag = null;                 // { body, constraint, samples, startX, startY, t0, moved }
        let hovered = null;
        let selected = null;             // inspected body
        let anchor = null;               // orbit anchor body
        let anchorTarget = null;
        let rings = [];
        let stack = [];                  // skill ids in pipeline order
        let challenge = 'agent';
        let buildOpen = false;
        let keyIdx = 0;
        let keyFocus = false;
        let introShown = true;
        let recoverUntil = 0;
        let chaosQueue = [];
        let chaosArmed = 0;
        const sparks = [];
        const ripples = [];
        const MAX_SPARKS = coarse ? 90 : 220;

        /* ---------------------------------------------------- mode logic */
        const HINTS = {
            normal: 'Gravity on: throw bubbles and let them stack.',
            zero: 'Zero gravity: everything floats back to its cluster.',
            attract: coarse ? 'Drag across empty space to pull bubbles in.' : 'Move the cursor through the lab to pull bubbles in.',
            repel: coarse ? 'Drag across empty space to push bubbles away.' : 'Move the cursor through the lab to push bubbles away.',
            orbit: coarse ? 'Tap a bubble to make it the anchor. Drag the anchor to move the well.' : 'Click a bubble to make it the anchor. Drag the anchor to move the well.'
        };
        const NAMES = { normal: 'Gravity', zero: 'Zero gravity', attract: 'Magnetic attract', repel: 'Magnetic repel', orbit: 'Orbital' };

        let hintTimer = 0;
        function flashHint(text, ms = 2600) {
            modeHint.textContent = text;
            modeHint.classList.add('is-on');
            clearTimeout(hintTimer);
            hintTimer = setTimeout(() => modeHint.classList.remove('is-on'), ms);
        }

        function setMode(m, opts = {}) {
            if (m === mode && !opts.anchor) return;
            const prev = mode;
            if (prev === 'orbit' && m !== 'orbit') releaseAnchor();
            mode = m;
            blend = 0;
            stage.dataset.mode = m;
            modeBtns.forEach((b) => b.setAttribute('aria-checked', String(b.dataset.mode === m)));
            bodies.forEach((b) => { b.frictionAir = m === 'orbit' ? 0.004 : m === 'attract' || m === 'repel' ? 0.02 : m === 'normal' ? 0.01 : 0.012; });
            if (m === 'orbit') setAnchor(opts.anchor || anchor || selected || bodyById.python);
            pointer.field = (m === 'attract' || m === 'repel') && pointer.inside && !coarse;
            announce(`${NAMES[m]} mode.`);
            if (!opts.silent) flashHint(HINTS[m]);
            hideIntro();
            kick();
        }

        function setAnchor(b) {
            if (anchor && anchor !== b) releaseAnchor();
            anchor = b;
            Body.setStatic(b, true);
            anchorTarget = { x: W / 2, y: H / 2 };
            blend = Math.min(blend, 0.2);
            assignOrbits();
            announce(`${b.skill.label} is the orbit anchor.`);
        }

        function releaseAnchor() {
            if (!anchor) return;
            Body.setStatic(anchor, false);
            Body.setVelocity(anchor, { x: 0, y: 0 });
            anchor = null;
            rings = [];
        }

        // Elliptical rings sized to the stage; bodies fill inner rings first (by current distance).
        function assignOrbits() {
            if (!anchor) return;
            const others = bodies.filter((b) => b !== anchor);
            const cx = anchorTarget ? anchorTarget.x : W / 2, cy = anchorTarget ? anchorTarget.y : H / 2;
            others.sort((a, b) => Math.hypot(a.position.x - cx, a.position.y - cy) - Math.hypot(b.position.x - cx, b.position.y - cy));
            const avgD = (others.reduce((a, b) => a + b.r, 0) / others.length) * 2;
            const e = clamp((H / 2 - avgD / 2 - 8) / Math.max(1, W / 2 - avgD / 2 - 8), 0.42, 1);
            rings = [];
            let bAxis = anchor.r + avgD * 0.5 + 16;
            let i = 0;
            while (i < others.length) {
                const a = bAxis / e, b = bAxis;
                const per = Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
                const cap = Math.max(4, Math.floor(per / (avgD * 1.08)));
                const members = others.slice(i, i + cap);
                const ring = { a, b, k: rings.length, members };
                // inner rings turn faster (Kepler-like v ∝ 1/√r)
                const speed = 2.4 * Math.sqrt((anchor.r + avgD) / ((a + b) / 2)) * scale;
                members.forEach((m, j) => { m.ring = ring; m.ringSpeed = speed * (rings.length % 2 ? 0.92 : 1); m.ringJ = j; });
                rings.push(ring);
                i += cap;
                bAxis += avgD * 0.98 + 6;
            }
        }

        function ellipseRadius(ring, ux, uy) {
            return 1 / Math.sqrt((ux * ux) / (ring.a * ring.a) + (uy * uy) / (ring.b * ring.b));
        }

        /* ------------------------------------------------------- forces */
        function accel(b, ax, ay) { Body.setVelocity(b, { x: b.velocity.x + ax, y: b.velocity.y + ay }); }

        function applyFields(t) {
            const g = blend;
            engine.gravity.y = mode === 'normal' ? lerp(engine.gravity.y, 1, 0.06) : lerp(engine.gravity.y, 0, 0.12);
            const now = performance.now();
            const recovering = now < recoverUntil;
            const R = (W < 600 ? 190 : 290);
            const order = stack.length > 1 ? stackOrder() : null;
            const band = order ? Math.min(H * 0.3, 2 * 47 * scale + 40) : 0;
            for (const b of bodies) {
                if (b.isStatic || (drag && drag.body === b)) continue;
                let h = homes[b.skill.id];
                let k0 = 0;
                if (order) {
                    const i = order.indexOf(b.skill.id);
                    if (i >= 0) {
                        // the assembled system floats as a pipeline along the bottom of the lab
                        const n = order.length;
                        const span = Math.min(W - 80, n * (2 * 47 * scale + 70));
                        h = { x: W / 2 - span / 2 + (span * (i + 0.5)) / n, y: H - band / 2 - 6 + Math.sin(t * 0.0012 + i) * (reduced ? 0 : 4) };
                        k0 = 1;
                    } else h = { x: h.x, y: h.y * (H - band) / H };
                }
                if (recovering) {
                    // critically damped return to the cluster
                    accel(b, (h.x - b.position.x) * 0.018 - b.velocity.x * 0.22, (h.y - b.position.y) * 0.018 - b.velocity.y * 0.22);
                    continue;
                }
                if (k0 && mode !== 'orbit' && mode !== 'normal') {
                    accel(b, (h.x - b.position.x) * 0.0022 - b.velocity.x * 0.03, (h.y - b.position.y) * 0.0022 - b.velocity.y * 0.03);
                } else if (mode === 'zero' || ((mode === 'attract' || mode === 'repel') && !pointer.field)) {
                    const k = reduced ? 0.004 : 0.00055;
                    accel(b, (h.x - b.position.x) * k * g, (h.y - b.position.y) * k * g);
                    if (!reduced) {
                        accel(b, Math.cos(t * 0.00031 + b.phase) * 0.006, Math.sin(t * 0.00027 + b.phase * 1.3) * 0.006);
                    }
                }
                if ((mode === 'attract' || mode === 'repel') && pointer.field) {
                    const dx = pointer.x - b.position.x, dy = pointer.y - b.position.y;
                    const d = Math.hypot(dx, dy);
                    if (d < R && d > 1) {
                        const s = 1 - d / R;
                        const near = clamp(d / 40, 0.25, 1);
                        const a = (mode === 'attract' ? 0.42 : -0.7) * s * s * near * g;
                        accel(b, (dx / d) * a, (dy / d) * a);
                    }
                }
                if (mode === 'orbit' && anchor && b.ring) {
                    const rx = b.position.x - anchor.position.x, ry = b.position.y - anchor.position.y;
                    const d = Math.hypot(rx, ry) || 1;
                    const ux = rx / d, uy = ry / d;
                    const tx = -uy, ty = ux;
                    const vr = b.velocity.x * ux + b.velocity.y * uy;
                    const vt = b.velocity.x * tx + b.velocity.y * ty;
                    const target = ellipseRadius(b.ring, ux, uy);
                    const centripetal = (vt * vt) / d;
                    const aR = (-centripetal - (d - target) * 0.0045 - vr * 0.06) * g + (1 - g) * (-(d - target) * 0.0015);
                    const aT = (b.ringSpeed - vt) * 0.035 * g;
                    accel(b, ux * aR + tx * aT, uy * aR + ty * aT);
                }
            }
            if (anchor && anchorTarget && !(drag && drag.body === anchor)) {
                Body.setPosition(anchor, { x: lerp(anchor.position.x, anchorTarget.x, 0.08), y: lerp(anchor.position.y, anchorTarget.y, 0.08) });
            }
            blend = Math.min(1, blend + 1 / 54);
        }

        function containBodies() {
            for (const b of bodies) {
                let { x, y } = b.position;
                let vx = b.velocity.x, vy = b.velocity.y;
                const sp = Math.hypot(vx, vy);
                const max = 30;
                if (sp > max) { vx *= max / sp; vy *= max / sp; Body.setVelocity(b, { x: vx, y: vy }); }
                const nx = clamp(x, b.r, W - b.r), ny = clamp(y, b.r, H - b.r);
                if (nx !== x || ny !== y) {
                    Body.setPosition(b, { x: nx, y: ny });
                    Body.setVelocity(b, { x: nx !== x ? -vx * 0.4 : vx, y: ny !== y ? -vy * 0.4 : vy });
                }
            }
        }

        /* ------------------------------------------------------ effects */
        function burst(x, y, col, n, power = 1) {
            if (reduced) return;
            for (let i = 0; i < n && sparks.length < MAX_SPARKS; i++) {
                const a = Math.random() * Math.PI * 2;
                const v = (0.6 + Math.random() * 1.8) * power;
                sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, decay: 0.022 + Math.random() * 0.03, col, s: Math.random() < 0.3 ? 1.8 : 1.2 });
            }
        }
        function ripple(x, y, col, maxR, width = 1.4, speed = 1) {
            if (reduced) return;
            if (ripples.length > 18) ripples.shift();
            ripples.push({ x, y, r: 4, maxR, life: 1, col, w: width, speed });
        }

        const pairT = new Map();
        Events.on(engine, 'collisionStart', (ev) => {
            if (reduced) return;
            const now = performance.now();
            for (const p of ev.pairs) {
                const a = p.bodyA, b = p.bodyB;
                if (!a.skill && !b.skill) continue;
                const rv = Math.hypot(a.velocity.x - b.velocity.x, a.velocity.y - b.velocity.y);
                if (rv < 3.2) continue;
                const key = `${a.id}:${b.id}`;
                if (now - (pairT.get(key) || 0) < 160) continue;
                pairT.set(key, now);
                const sup = p.collision && p.collision.supports && p.collision.supports[0];
                const x = sup ? sup.x : (a.position.x + b.position.x) / 2;
                const y = sup ? sup.y : (a.position.y + b.position.y) / 2;
                const col = CATS[(a.skill ? a : b).skill.cat].rgb;
                const k = clamp((rv - 3) / 12, 0, 1);
                burst(x, y, col, 3 + Math.round(k * 6), 0.6 + k);
                if (rv > 7) ripple(x, y, col, 14 + k * 26, 1, 1.4);
                [a, b].forEach((x2) => { if (x2.skill) x2.vis.v -= 0.6 * k; });
            }
            if (pairT.size > 400) pairT.clear();
        });

        /* ------------------------------------------------ stack builder */
        function stackOrder() {
            const ch = CHALLENGES[challenge];
            if (challenge === 'free') return stack.slice();
            const inSlots = ch.slots.map(([id]) => id).filter((id) => stack.includes(id));
            return inSlots.concat(stack.filter((id) => !inSlots.includes(id)));
        }

        // assembling happens in applyFields (pipeline targets); this just wakes the loop
        function rebuildSprings() { kick(); }

        function toggleStack(id) {
            const i = stack.indexOf(id);
            const b = bodyById[id];
            if (i >= 0) { stack.splice(i, 1); announce(`${b.skill.label} removed from the stack.`); } else {
                stack.push(id);
                b.vis.v += 2.2;
                burst(b.position.x, b.position.y, CATS[b.skill.cat].rgb, 10, 1.2);
                ripple(b.position.x, b.position.y, CATS[b.skill.cat].rgb, b.r + 26);
                announce(`${b.skill.label} added to the stack.`);
            }
            rebuildSprings();
            renderBuild(true);
            renderInspector();
            kick();
        }

        let completeFor = null;
        function renderBuild(fromChange) {
            const ch = CHALLENGES[challenge];
            build.querySelector('.gl-build__brief').textContent = ch.brief;
            section.querySelectorAll('.gl-tab').forEach((t) => t.setAttribute('aria-selected', String(t.dataset.ch === challenge)));
            const slotsEl = build.querySelector('.gl-build__slots');
            const order = stackOrder();
            let html = '';
            if (challenge !== 'free') {
                ch.slots.forEach(([id, role], i) => {
                    const s = BY_ID[id];
                    const has = stack.includes(id);
                    const col = CATS[s.cat].rgb.join(',');
                    html += `<li class="gl-slot${has ? ' is-filled' : ''}" style="--c:${col}"><span class="gl-slot__n">${String(i + 1).padStart(2, '0')}</span>` +
                        (has ? `<span class="gl-slot__name">${s.label}</span><span class="gl-slot__role">${s.role}</span>`
                            : `<span class="gl-slot__name gl-slot__name--q">${role}</span><button type="button" class="gl-slot__hint" data-hint="${id}">Hint</button>`) + '</li>';
                });
                const extra = order.filter((id) => !ch.slots.some(([sid]) => sid === id));
                extra.forEach((id) => {
                    const s = BY_ID[id];
                    html += `<li class="gl-slot is-filled is-extra" style="--c:${CATS[s.cat].rgb.join(',')}"><span class="gl-slot__n">+</span><span class="gl-slot__name">${s.label}</span><span class="gl-slot__role">${s.role}</span></li>`;
                });
            } else if (!order.length) {
                html = '<li class="gl-slot gl-slot--empty">Click bubbles in the lab to add them.</li>';
            } else {
                order.forEach((id, i) => {
                    const s = BY_ID[id];
                    html += `<li class="gl-slot is-filled" style="--c:${CATS[s.cat].rgb.join(',')}"><span class="gl-slot__n">${String(i + 1).padStart(2, '0')}</span><span class="gl-slot__name">${s.label}</span><span class="gl-slot__role">${s.role}</span></li>`;
                });
            }
            slotsEl.innerHTML = html;

            // evidence: projects that really use several of the chosen skills
            const ev = build.querySelector('.gl-build__evidence');
            const counts = {};
            stack.forEach((id) => BY_ID[id].projects.forEach((p) => { counts[p] = (counts[p] || 0) + 1; }));
            const min = stack.length >= 2 ? 2 : 1;
            const list = Object.entries(counts).filter(([, n]) => n >= min).sort((a, b) => b[1] - a[1]).slice(0, 4);
            const done = challenge !== 'free' && ch.slots.every(([id]) => stack.includes(id));
            build.classList.toggle('is-complete', done);
            if (!stack.length) ev.innerHTML = '';
            else {
                ev.innerHTML = `<p class="gl-ev__h">${done ? 'System assembled. Where it is real:' : 'Where these skills are used together'}</p>` +
                    (list.length ? `<ul>${list.map(([p, n]) => {
                        const pr = PROJECTS[p];
                        return `<li><a href="${pr.href}"${pr.ext ? ' target="_blank" rel="noopener noreferrer"' : ''} data-proj>${pr.name}${pr.ext ? ' <span aria-hidden="true">↗</span>' : ''}</a><span>${n} of ${stack.length}</span></li>`;
                    }).join('')}</ul>` : '<p class="gl-ev__none">No single project uses this combination yet.</p>');
            }
            if (done && fromChange && completeFor !== challenge) {
                completeFor = challenge;
                order.forEach((id, i) => setTimeout(() => {
                    const b = bodyById[id];
                    ripple(b.position.x, b.position.y, CATS[b.skill.cat].rgb, b.r + 40, 1.6);
                    burst(b.position.x, b.position.y, CATS[b.skill.cat].rgb, 12, 1.4);
                    b.vis.v += 2.5;
                }, i * 110));
                announce('System assembled.');
            } else if (!done && completeFor === challenge) completeFor = null;
        }

        /* --------------------------------------------------- inspector */
        function renderInspector() {
            if (!selected) { insp.hidden = true; return; }
            const s = selected.skill;
            insp.hidden = false;
            insp.classList.toggle('is-left', selected.position.x > W * 0.55);
            insp.style.setProperty('--c', CATS[s.cat].rgb.join(','));
            insp.querySelector('.gl-insp__cat').textContent = CATS[s.cat].name;
            insp.querySelector('.gl-insp__name').textContent = s.label;
            insp.querySelector('.gl-insp__desc').textContent = s.desc;
            insp.querySelector('.gl-insp__role').textContent = s.role;
            insp.querySelector('.gl-insp__used ul').innerHTML = s.projects.map((p) => {
                const pr = PROJECTS[p];
                return `<li><a href="${pr.href}"${pr.ext ? ' target="_blank" rel="noopener noreferrer"' : ''} data-proj>${pr.name}${pr.ext ? ' ↗' : ''}</a></li>`;
            }).join('');
            insp.querySelector('[data-act="toggle-stack"]').textContent = stack.includes(s.id) ? 'Remove from stack' : 'Add to stack';
            const an = insp.querySelector('[data-act="anchor"]');
            an.textContent = mode === 'orbit' && anchor === selected ? 'Orbit anchor' : 'Make orbit anchor';
            an.disabled = mode === 'orbit' && anchor === selected;
        }

        function select(b, fromKeys) {
            if (selected === b && !buildOpen && !fromKeys) { selected = null; renderInspector(); return; }
            selected = b;
            b.vis.v += 1.8;
            renderInspector();
            announce(`${b.skill.label}, ${CATS[b.skill.cat].name}.`);
        }

        function activate(b, fromKeys) {
            hideIntro();
            if (mode === 'orbit' && anchor !== b) {
                setAnchor(b);
                selected = b;
                renderInspector();
                return;
            }
            if (buildOpen) { if (selected) { selected = null; renderInspector(); } toggleStack(b.skill.id); return; }
            select(b, fromKeys);
        }

        /* ------------------------------------------------------ chaos */
        function chaos() {
            hideIntro();
            if (performance.now() < chaosArmed) { recover(); return; }
            const pts = [{ x: W / 2, y: H / 2 }, { x: W * (0.2 + Math.random() * 0.2), y: H * (0.3 + Math.random() * 0.4) }, { x: W * (0.6 + Math.random() * 0.2), y: H * (0.3 + Math.random() * 0.4) }];
            const now = performance.now();
            chaosQueue = pts.map((p, i) => ({ ...p, at: now + i * 170 }));
            if (mode === 'orbit') setMode('zero', { silent: true });
            chaosArmed = now + 6000;
            chaosBtn.textContent = 'Recover';
            chaosBtn.classList.add('is-armed');
            setTimeout(() => { if (performance.now() >= chaosArmed) { chaosBtn.textContent = 'Chaos'; chaosBtn.classList.remove('is-armed'); } }, 6100);
            announce('Chaos. The lab will settle on its own, or press Recover.');
            kick();
        }
        function runChaosQueue(now) {
            while (chaosQueue.length && chaosQueue[0].at <= now) {
                const p = chaosQueue.shift();
                const D = Math.hypot(W, H) * 0.6;
                for (const b of bodies) {
                    if (b.isStatic) continue;
                    const dx = b.position.x - p.x, dy = b.position.y - p.y;
                    const d = Math.max(12, Math.hypot(dx, dy));
                    const m = (reduced ? 5 : 13) * (0.35 + 0.65 * clamp(1 - d / D, 0, 1));
                    accel(b, (dx / d) * m + (Math.random() - 0.5) * 2, (dy / d) * m + (Math.random() - 0.5) * 2);
                }
                ripple(p.x, p.y, [255, 255, 255], Math.max(W, H) * 0.5, 1.6, 4.5);
                ripple(p.x, p.y, [255, 122, 0], Math.max(W, H) * 0.3, 1, 3);
                burst(p.x, p.y, [255, 170, 90], 22, 2.4);
            }
        }
        function recover() {
            chaosArmed = 0;
            chaosQueue = [];
            chaosBtn.textContent = 'Chaos';
            chaosBtn.classList.remove('is-armed');
            recoverUntil = performance.now() + (reduced ? 600 : 1500);
            ripple(W / 2, H / 2, [255, 255, 255], Math.max(W, H) * 0.45, 1.2, 3);
            announce('Recovering.');
            kick();
        }

        function reset() {
            stack = [];
            rebuildSprings();
            selected = null;
            renderInspector();
            if (mode !== 'zero') setMode('zero', { silent: true });
            if (buildOpen) renderBuild(false);
            recover();
            flashHint('Lab reset.', 1400);
        }

        /* -------------------------------------------------- pointer input */
        function local(e) {
            const r = canvas.getBoundingClientRect();
            return { x: e.clientX - r.left, y: e.clientY - r.top };
        }
        function hit(p, pad) {
            let best = null, bd = Infinity;
            for (const b of bodies) {
                const d = Math.hypot(b.position.x - p.x, b.position.y - p.y) - b.r;
                if (d < pad && d < bd) { bd = d; best = b; }
            }
            return best;
        }

        canvas.addEventListener('pointerdown', (e) => {
            if (e.button !== 0) return;
            const p = local(e);
            const pad = e.pointerType === 'mouse' ? 2 : 12;
            const b = hit(p, pad);
            pointer.x = p.x; pointer.y = p.y;
            if (!b) {
                if ((mode === 'attract' || mode === 'repel') && e.pointerType !== 'mouse') {
                    pointer.field = true; pointer.touchField = true;
                    canvas.setPointerCapture(e.pointerId);
                    hideIntro();
                } else if (selected) { selected = null; renderInspector(); }
                return;
            }
            canvas.setPointerCapture(e.pointerId);
            hideIntro();
            const c = b.isStatic ? null : Constraint.create({ pointA: { x: p.x, y: p.y }, bodyB: b, pointB: { x: (p.x - b.position.x) * 0.4, y: (p.y - b.position.y) * 0.4 }, stiffness: 0.2, damping: 0.12, length: 0 });
            if (c) Composite.add(world, c);
            drag = { body: b, c, samples: [{ x: p.x, y: p.y, t: performance.now() }], sx: p.x, sy: p.y, t0: performance.now(), moved: false };
            b.vis.t = 1.07;
            stage.classList.add('is-grabbing');
            kick();
        });

        canvas.addEventListener('pointermove', (e) => {
            const p = local(e);
            pointer.x = p.x; pointer.y = p.y;
            if (drag) {
                if (drag.c) drag.c.pointA = { x: p.x, y: p.y };
                else if (drag.body === anchor) anchorTarget = { x: clamp(p.x, anchor.r, W - anchor.r), y: clamp(p.y, anchor.r, H - anchor.r) };
                const now = performance.now();
                drag.samples.push({ x: p.x, y: p.y, t: now });
                while (drag.samples.length > 2 && now - drag.samples[0].t > 90) drag.samples.shift();
                if (Math.hypot(p.x - drag.sx, p.y - drag.sy) > 6) drag.moved = true;
                return;
            }
            if (e.pointerType === 'mouse') {
                const b = hit(p, 2);
                if (b !== hovered) { hovered = b; canvas.style.cursor = b ? 'grab' : ''; }
            }
        });

        function endDrag(e, cancelled) {
            if (pointer.touchField) { pointer.field = false; pointer.touchField = false; }
            if (!drag) return;
            const b = drag.body;
            if (drag.c) Composite.remove(world, drag.c);
            const s = drag.samples;
            const quick = performance.now() - drag.t0 < 350;
            if (!drag.moved && quick && !cancelled) {
                activate(b);
            } else if (!b.isStatic && s.length > 1) {
                const a = s[0], z = s[s.length - 1];
                const dt = Math.max(8, z.t - a.t) / (1000 / 60);
                const pvx = (z.x - a.x) / dt, pvy = (z.y - a.y) / dt;
                Body.setVelocity(b, { x: clamp(b.velocity.x * 0.4 + pvx * 0.75, -32, 32), y: clamp(b.velocity.y * 0.4 + pvy * 0.75, -32, 32) });
                const sp = Math.hypot(pvx, pvy);
                if (sp > 6) burst(b.position.x, b.position.y, CATS[b.skill.cat].rgb, 5, 0.8);
            }
            b.vis.t = 1;
            b.vis.v += 1.4;
            drag = null;
            stage.classList.remove('is-grabbing');
            if (mode === 'orbit') assignOrbits();
        }
        canvas.addEventListener('pointerup', (e) => endDrag(e, false));
        canvas.addEventListener('pointercancel', (e) => endDrag(e, true));
        canvas.addEventListener('pointerenter', (e) => {
            if (e.pointerType !== 'mouse') return;
            pointer.inside = true;
            pointer.field = mode === 'attract' || mode === 'repel';
        });
        canvas.addEventListener('pointerleave', (e) => {
            if (e.pointerType !== 'mouse') return;
            pointer.inside = false;
            if (!pointer.touchField) pointer.field = false;
            hovered = null;
        });
        // touch: a grab (or a field drag in magnet modes) must not scroll the page; elsewhere the page scrolls
        canvas.addEventListener('touchstart', (e) => {
            const t = e.touches[0];
            if (!t) return;
            const p = local(t);
            if (hit(p, 12) || mode === 'attract' || mode === 'repel') e.preventDefault();
        }, { passive: false });

        /* ------------------------------------------------- keyboard input */
        keys.innerHTML = bodies.map((b, i) => `<li role="option" id="gl-k-${b.skill.id}" aria-selected="${i === 0}">${b.skill.label}, ${CATS[b.skill.cat].name}</li>`).join('');
        keys.setAttribute('aria-activedescendant', `gl-k-${bodies[0].skill.id}`);
        function moveKey(i) {
            keyIdx = (i + bodies.length) % bodies.length;
            keys.querySelectorAll('li').forEach((li, j) => li.setAttribute('aria-selected', String(j === keyIdx)));
            keys.setAttribute('aria-activedescendant', `gl-k-${bodies[keyIdx].skill.id}`);
            const b = bodies[keyIdx];
            status.textContent = `${b.skill.label} · ${CATS[b.skill.cat].name}`;
            b.vis.v += 1;
            kick();
        }
        keys.addEventListener('focus', () => { keyFocus = true; stage.classList.add('is-keys'); moveKey(keyIdx); hideIntro(); });
        keys.addEventListener('blur', () => { keyFocus = false; stage.classList.remove('is-keys'); status.textContent = ''; });
        keys.addEventListener('keydown', (e) => {
            const b = bodies[keyIdx];
            switch (e.key) {
                case 'ArrowRight': case 'ArrowDown': moveKey(keyIdx + 1); break;
                case 'ArrowLeft': case 'ArrowUp': moveKey(keyIdx - 1); break;
                case 'Home': moveKey(0); break;
                case 'End': moveKey(bodies.length - 1); break;
                case 'Enter': activate(b, true); break;
                case ' ': case 'Spacebar':
                    if (!b.isStatic) { const a = Math.random() * Math.PI * 2; accel(b, Math.cos(a) * 12, -Math.abs(Math.sin(a)) * 12 - 4); burst(b.position.x, b.position.y, CATS[b.skill.cat].rgb, 8, 1.2); }
                    break;
                case 'Escape': if (selected) { selected = null; renderInspector(); } break;
                default: return;
            }
            e.preventDefault();
            kick();
        });

        /* -------------------------------------------------- DOM controls */
        modeBtns.forEach((btn) => btn.addEventListener('click', () => setMode(btn.dataset.mode)));
        section.querySelector('.gl-modes').addEventListener('keydown', (e) => {
            const i = modeBtns.indexOf(document.activeElement);
            if (i < 0) return;
            let n = -1;
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (i + 1) % modeBtns.length;
            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (i - 1 + modeBtns.length) % modeBtns.length;
            if (n < 0) return;
            e.preventDefault();
            modeBtns[n].focus();
            modeBtns[n].click();
        });
        const syncRoving = () => modeBtns.forEach((b) => b.tabIndex = b.getAttribute('aria-checked') === 'true' ? 0 : -1);
        modeBtns.forEach((b) => b.addEventListener('click', syncRoving));
        syncRoving();

        chaosBtn.addEventListener('click', chaos);
        section.querySelector('[data-act="reset"]').addEventListener('click', reset);
        buildBtn.addEventListener('click', () => {
            buildOpen = !buildOpen;
            build.hidden = !buildOpen;
            buildBtn.setAttribute('aria-expanded', String(buildOpen));
            buildBtn.classList.toggle('is-on', buildOpen);
            stage.classList.toggle('is-building', buildOpen);
            if (buildOpen) {
                renderBuild(false);
                // keep the lab and the builder on screen together
                requestAnimationFrame(() => {
                    const top = section.querySelector('.gl-bar').getBoundingClientRect().top;
                    const bottom = build.getBoundingClientRect().bottom;
                    if (top < 0 || bottom > window.innerHeight) {
                        const off = window.navOffset ? window.navOffset() : 72;
                        const y = window.scrollY + top - off;
                        if (window.lenis && window.lenis.scrollTo) window.lenis.scrollTo(y, { duration: 0.8 });
                        else window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
                    }
                });
                flashHint('Click bubbles to wire them into your system.', 3000);
                hideIntro();
            }
            kick();
        });
        section.querySelectorAll('.gl-tab').forEach((t) => t.addEventListener('click', () => {
            challenge = t.dataset.ch;
            completeFor = null;
            rebuildSprings();
            renderBuild(true);
        }));
        build.addEventListener('click', (e) => {
            const h = e.target.closest('[data-hint]');
            if (h) {
                const b = bodyById[h.dataset.hint];
                ripple(b.position.x, b.position.y, CATS[b.skill.cat].rgb, b.r + 50, 1.6, 0.8);
                ripple(b.position.x, b.position.y, CATS[b.skill.cat].rgb, b.r + 30, 1, 0.8);
                b.vis.v += 3;
                b.hintUntil = performance.now() + 2600;
                h.textContent = b.skill.label;
                h.disabled = true;
                kick();
            }
            if (e.target.closest('[data-act="clear"]')) { stack = []; rebuildSprings(); renderBuild(false); renderInspector(); }
        });
        insp.addEventListener('click', (e) => {
            const a = e.target.closest('[data-act]');
            if (!a || !selected) return;
            if (a.dataset.act === 'close-insp') { selected = null; renderInspector(); }
            if (a.dataset.act === 'toggle-stack') {
                if (!buildOpen) buildBtn.click();
                toggleStack(selected.skill.id);
            }
            if (a.dataset.act === 'anchor') setMode('orbit', { anchor: selected });
        });
        // in-page project links reuse the site's smooth-scroll offset
        section.addEventListener('click', (e) => {
            const a = e.target.closest('a[data-proj]');
            if (!a || a.target === '_blank') return;
            const t = document.querySelector(a.getAttribute('href'));
            if (!t) return;
            e.preventDefault();
            const off = window.navOffset ? window.navOffset() : 72;
            if (window.lenis && window.lenis.scrollTo) window.lenis.scrollTo(t, { offset: -off, duration: 1.1 });
            else window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - off, behavior: reduced ? 'auto' : 'smooth' });
        });

        function announce(t) { liveSay(t); }
        const live = document.createElement('p');
        live.className = 'gl-sr';
        live.setAttribute('aria-live', 'polite');
        stage.appendChild(live);
        let liveT = 0;
        function liveSay(t) { clearTimeout(liveT); liveT = setTimeout(() => { live.textContent = t; }, 60); }
        status.removeAttribute('aria-live');

        function hideIntro() {
            if (!introShown) return;
            introShown = false;
            intro.classList.add('is-gone');
        }

        /* -------------------------------------------------------- render */
        function render(now) {
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.globalCompositeOperation = 'source-over';
            ctx.drawImage(bg, 0, 0, W, H);

            // pointer light / magnetic field
            const fieldOn = pointer.field && (mode === 'attract' || mode === 'repel');
            const R = W < 600 ? 190 : 290;
            if (pointer.inside || fieldOn) {
                const col = mode === 'repel' ? [251, 113, 133] : mode === 'attract' ? [125, 211, 252] : [255, 255, 255];
                const g = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, fieldOn ? R : 180);
                g.addColorStop(0, rgba(col, fieldOn ? 0.1 : 0.035));
                g.addColorStop(1, rgba(col, 0));
                ctx.fillStyle = g;
                ctx.fillRect(pointer.x - R, pointer.y - R, R * 2, R * 2);
                if (fieldOn) {
                    ctx.save();
                    ctx.strokeStyle = rgba(col, 0.22);
                    ctx.setLineDash([2, 7]);
                    ctx.lineDashOffset = reduced ? 0 : (mode === 'attract' ? 1 : -1) * now * 0.02;
                    ctx.beginPath(); ctx.arc(pointer.x, pointer.y, R * 0.98, 0, Math.PI * 2); ctx.stroke();
                    ctx.beginPath(); ctx.arc(pointer.x, pointer.y, R * 0.55, 0, Math.PI * 2); ctx.stroke();
                    ctx.setLineDash([]);
                    ctx.lineWidth = 1;
                    for (const b of bodies) {
                        const d = Math.hypot(b.position.x - pointer.x, b.position.y - pointer.y);
                        if (d > R || d < b.r) continue;
                        const s = 1 - d / R;
                        ctx.strokeStyle = rgba(col, 0.32 * s);
                        const ux = (b.position.x - pointer.x) / d, uy = (b.position.y - pointer.y) / d;
                        ctx.beginPath();
                        ctx.moveTo(pointer.x + ux * 10, pointer.y + uy * 10);
                        ctx.lineTo(b.position.x - ux * b.r, b.position.y - uy * b.r);
                        ctx.stroke();
                    }
                    ctx.fillStyle = rgba(col, 0.9);
                    ctx.beginPath(); ctx.arc(pointer.x, pointer.y, 3, 0, Math.PI * 2); ctx.fill();
                    ctx.restore();
                }
            }

            // category labels (only meaningful while the clusters exist)
            const labelA = (mode === 'zero' || ((mode === 'attract' || mode === 'repel') && !fieldOn)) ? 0.5 * blend : 0;
            if (labelA > 0.01) {
                ctx.font = `600 ${W < 600 ? 9 : 10}px ${getComputedStyle(document.documentElement).getPropertyValue('--font-mono') || 'monospace'}`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                catLabels.forEach((l) => {
                    ctx.fillStyle = rgba(CATS[l.cat].rgb, labelA);
                    ctx.fillText(CATS[l.cat].name.toUpperCase().split('').join(' '), l.x, l.y);
                });
            }

            // orbit rings
            if (mode === 'orbit' && anchor) {
                ctx.save();
                ctx.setLineDash([1.5, 6]);
                rings.forEach((r) => {
                    ctx.strokeStyle = `rgba(236,238,242,${0.12 * blend})`;
                    ctx.beginPath();
                    ctx.ellipse(anchor.position.x, anchor.position.y, r.a, r.b, 0, 0, Math.PI * 2);
                    ctx.stroke();
                });
                ctx.restore();
                const col = CATS[anchor.skill.cat].rgb;
                const g = ctx.createRadialGradient(anchor.position.x, anchor.position.y, anchor.r, anchor.position.x, anchor.position.y, anchor.r * 3.2);
                g.addColorStop(0, rgba(col, 0.22 * blend));
                g.addColorStop(1, rgba(col, 0));
                ctx.fillStyle = g;
                ctx.beginPath(); ctx.arc(anchor.position.x, anchor.position.y, anchor.r * 3.2, 0, Math.PI * 2); ctx.fill();
            }

            // ambient dust
            if (dust.length) {
                for (const d of dust) {
                    if (!reduced) {
                        if (fieldOn) {
                            const dx = pointer.x - d.x, dy = pointer.y - d.y, dd = Math.hypot(dx, dy);
                            if (dd < R && dd > 1) { const f = (mode === 'attract' ? 0.03 : -0.05) * (1 - dd / R); d.vx += (dx / dd) * f; d.vy += (dy / dd) * f; }
                        }
                        d.vx *= 0.985; d.vy *= 0.985;
                        d.vx += (Math.random() - 0.5) * 0.01; d.vy += (Math.random() - 0.5) * 0.01;
                        d.x += d.vx; d.y += d.vy;
                        if (d.x < 0) d.x += W; if (d.x > W) d.x -= W; if (d.y < 0) d.y += H; if (d.y > H) d.y -= H;
                    }
                    ctx.fillStyle = `rgba(236,238,242,${d.a})`;
                    ctx.fillRect(d.x, d.y, d.s, d.s);
                }
            }

            // stack connections + packets
            const order = stackOrder();
            if (order.length > 1) {
                for (let i = 0; i < order.length - 1; i++) {
                    const a = bodyById[order[i]], b = bodyById[order[i + 1]];
                    const ca = CATS[a.skill.cat].rgb, cb = CATS[b.skill.cat].rgb;
                    const dx = b.position.x - a.position.x, dy = b.position.y - a.position.y;
                    const d = Math.hypot(dx, dy) || 1;
                    const ux = dx / d, uy = dy / d;
                    const x0 = a.position.x + ux * a.r, y0 = a.position.y + uy * a.r;
                    const x1 = b.position.x - ux * b.r, y1 = b.position.y - uy * b.r;
                    const g = ctx.createLinearGradient(x0, y0, x1, y1);
                    g.addColorStop(0, rgba(ca, 0.75)); g.addColorStop(1, rgba(cb, 0.75));
                    ctx.strokeStyle = g; ctx.lineWidth = 1.6;
                    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
                    if (d > a.r + b.r + 4) {
                        const tt = reduced ? 0.5 : ((now * 0.0006 + i * 0.37) % 1);
                        for (let k = 0; k < 3; k++) {
                            const t = tt - k * 0.035;
                            if (t < 0) continue;
                            const px = lerp(x0, x1, t), py = lerp(y0, y1, t);
                            ctx.fillStyle = rgba(mix(ca, cb, t), k === 0 ? 1 : 0.4 - k * 0.12);
                            ctx.beginPath(); ctx.arc(px, py, k === 0 ? 2.8 : 2, 0, Math.PI * 2); ctx.fill();
                        }
                    }
                }
            }

            // trails behind fast bubbles
            if (!reduced) {
                ctx.lineCap = 'round';
                for (const b of bodies) {
                    const sp = Math.hypot(b.velocity.x, b.velocity.y);
                    if (sp > 5) { b.trail.push(b.position.x, b.position.y); if (b.trail.length > 16) b.trail.splice(0, 2); }
                    else if (b.trail.length) b.trail.splice(0, 2);
                    if (b.trail.length < 4) continue;
                    const col = CATS[b.skill.cat].rgb;
                    for (let i = 2; i < b.trail.length; i += 2) {
                        const f = i / b.trail.length;
                        ctx.strokeStyle = rgba(col, 0.16 * f);
                        ctx.lineWidth = Math.max(1, b.r * 0.22 * f);
                        ctx.beginPath(); ctx.moveTo(b.trail[i - 2], b.trail[i - 1]); ctx.lineTo(b.trail[i], b.trail[i + 1]); ctx.stroke();
                    }
                }
            }

            // bubbles
            const focusB = keyFocus ? bodies[keyIdx] : null;
            for (const b of bodies) {
                const inStack = stack.includes(b.skill.id);
                const hint = b.hintUntil && now < b.hintUntil;
                const want = b === selected || b === hovered || inStack || b === anchor || hint || (drag && drag.body === b) ? 1 : 0;
                b.glow += (want - b.glow) * 0.14;
                // visual spring
                const k = 0.18, c = 0.22;
                b.vis.v += ((b.vis.t - b.vis.s) * k - b.vis.v * c);
                b.vis.s += b.vis.v * 0.1;
                const s = clamp(b.vis.s, 0.85, 1.2);
                const col = CATS[b.skill.cat].rgb;
                if (b.glow > 0.02) {
                    const gr = ctx.createRadialGradient(b.position.x, b.position.y, b.r * 0.8, b.position.x, b.position.y, b.r * 2);
                    gr.addColorStop(0, rgba(col, 0.32 * b.glow));
                    gr.addColorStop(1, rgba(col, 0));
                    ctx.fillStyle = gr;
                    ctx.beginPath(); ctx.arc(b.position.x, b.position.y, b.r * 2, 0, Math.PI * 2); ctx.fill();
                }
                const o = b.spriteO * s;
                ctx.drawImage(b.sprite, b.position.x - o, b.position.y - o, o * 2, o * 2);
                if (b === selected || inStack || b === anchor) {
                    ctx.strokeStyle = rgba(col, b === selected ? 0.95 : 0.7);
                    ctx.lineWidth = b === selected ? 1.8 : 1.3;
                    ctx.beginPath(); ctx.arc(b.position.x, b.position.y, b.r * s + 4, 0, Math.PI * 2); ctx.stroke();
                }
                if (b === focusB) {
                    ctx.strokeStyle = 'rgba(255,255,255,0.95)';
                    ctx.lineWidth = 2;
                    ctx.setLineDash([4, 4]);
                    ctx.beginPath(); ctx.arc(b.position.x, b.position.y, b.r * s + 8, 0, Math.PI * 2); ctx.stroke();
                    ctx.setLineDash([]);
                }
            }

            // ripples + sparks
            for (let i = ripples.length - 1; i >= 0; i--) {
                const r = ripples[i];
                r.r += (r.maxR - r.r) * 0.08 * r.speed + 0.3;
                r.life -= 0.022 * r.speed * 0.6;
                if (r.life <= 0) { ripples.splice(i, 1); continue; }
                ctx.strokeStyle = rgba(r.col, 0.45 * r.life);
                ctx.lineWidth = r.w;
                ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2); ctx.stroke();
            }
            ctx.globalCompositeOperation = 'lighter';
            for (let i = sparks.length - 1; i >= 0; i--) {
                const p = sparks[i];
                p.x += p.vx; p.y += p.vy; p.vx *= 0.94; p.vy *= 0.94;
                p.life -= p.decay;
                if (p.life <= 0) { sparks.splice(i, 1); continue; }
                ctx.fillStyle = rgba(p.col, 0.85 * p.life);
                ctx.fillRect(p.x - p.s / 2, p.y - p.s / 2, p.s, p.s);
            }
            ctx.globalCompositeOperation = 'source-over';

            // first-visit demonstration: a ghost grab on one bubble
            if (demo && now < demo.end) {
                const b = demo.body;
                const t = (now - demo.start) / (demo.end - demo.start);
                const a = Math.sin(Math.PI * clamp(t, 0, 1));
                ctx.strokeStyle = `rgba(255,255,255,${0.7 * a})`;
                ctx.lineWidth = 1.5;
                ctx.beginPath(); ctx.arc(b.position.x, b.position.y, b.r + 8 + 6 * Math.sin(now * 0.008), 0, Math.PI * 2); ctx.stroke();
            }
        }

        /* ---------------------------------------------------------- loop */
        let cost = 0, running = false, inView = false, raf = 0, last = 0, acc = 0, demo = null, demoDone = false;
        const STEP = 1000 / 60;
        function frame(now) {
            raf = 0;
            if (!running) return;
            const t0 = performance.now();
            const dt = Math.min(now - last, 100);
            last = now;
            acc += dt;
            let n = 0;
            while (acc >= STEP && n < 3) {
                runChaosQueue(now);
                applyFields(now);
                if (demo && now < demo.end && now - demo.start > 500 && !demo.pushed) {
                    demo.pushed = true;
                    accel(demo.body, -7 * scale, -5 * scale);
                    demo.body.vis.v += 2;
                }
                Engine.update(engine, STEP);
                containBodies();
                acc -= STEP;
                n++;
            }
            if (n === 3) acc = 0;
            render(now);
            cost = cost * 0.95 + (performance.now() - t0) * 0.05;
            raf = requestAnimationFrame(frame);
        }
        function kick() { if (running && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }
        function setRunning(on) {
            on = on && inView && !document.hidden;
            if (on === running) return;
            running = on;
            if (on) {
                kick();
                if (!demoDone && !reduced && introShown) {
                    demoDone = true;
                    const t = performance.now() + 700;
                    demo = { body: bodyById.python, start: t, end: t + 1800, pushed: false };
                }
            } else if (raf) { cancelAnimationFrame(raf); raf = 0; }
        }

        if ('IntersectionObserver' in window) {
            new IntersectionObserver((en) => { inView = en[0].isIntersecting; setRunning(true); }, { rootMargin: '80px' }).observe(stage);
        } else inView = true;
        document.addEventListener('visibilitychange', () => setRunning(true));
        let rT = 0;
        const onResize = () => { clearTimeout(rT); rT = setTimeout(resize, 120); };
        if ('ResizeObserver' in window) new ResizeObserver(onResize).observe(stage); else window.addEventListener('resize', onResize);
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { bodies.forEach(makeSprite); if (!running) render(performance.now()); });

        stage.dataset.mode = mode;
        resize();
        setRunning(true);
        render(performance.now());

        // debug/QA hook (read-only snapshot)
        window.gravityLab = {
            state: () => ({ frameMs: +cost.toFixed(2), mode, W, H, scale, stack: stack.slice(), selected: selected && selected.skill.id, anchor: anchor && anchor.skill.id, rings: rings.length, running, sparks: sparks.length, escaped: bodies.filter((b) => b.position.x < b.r - 1 || b.position.x > W - b.r + 1 || b.position.y < b.r - 1 || b.position.y > H - b.r + 1).length }),
            pos: (id) => { const b = bodyById[id]; return { x: b.position.x, y: b.position.y, r: b.r, vx: b.velocity.x, vy: b.velocity.y }; },
            all: () => bodies.map((b) => ({ id: b.skill.id, x: b.position.x, y: b.position.y, r: b.r }))
        };
    }

    function fallback(section) {
        section.classList.add('gl--fallback');
        const list = section.querySelector('.gl-fallback');
        list.innerHTML = CAT_ORDER.map((c) => `<li><span style="--c:${CATS[c].rgb.join(',')}">${CATS[c].name}</span>${SKILLS.filter((s) => s.cat === c).map((s) => `<b>${s.label}</b>`).join('')}</li>`).join('');
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
