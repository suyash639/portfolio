/**
 * Chapter 03 — Netsmartz: Enterprise Intelligence laboratory.
 *   Ingestion   documents → parse → structure → chunk → metadata → embed → index (inspectable chunks)
 *   Workbench   working retrieval over a small fictional demo corpus:
 *                 keyword  = BM25 over stemmed terms
 *                 semantic = cosine similarity over a lightweight concept-aware embedding
 *                 hybrid   = Reciprocal Rank Fusion of both (k = 60)
 *   Answer      extractive grounded answer built from the selected context, every sentence cited
 *   Service     FastAPI request path with validation and error-recovery boundaries
 *
 * The demo embedding is not the production model; the corpus is fictional. Both are labelled on screen.
 */
(() => {
    'use strict';
    const K = window.JKit;
    if (!K) return;
    const esc = K.esc;

    /* =====================================================================
       DEMO CORPUS (fictional)
       ===================================================================== */
    const DOCS = [
        { id: 'remote', title: 'Remote Work Policy', type: 'PDF · policy', sections: [
            ['Eligibility', 'Employees who have completed probation may work remotely up to three days per week with manager approval. Roles that require on-site equipment are excluded.'],
            ['Equipment', 'The company provides a laptop and a monitor for home use. Personal devices must not be used to access customer data.'],
            ['Security at home', 'Connect through the corporate VPN before opening internal tools. Lock your screen whenever you step away from your desk.']
        ] },
        { id: 'vpn', title: 'VPN Setup Guide', type: 'PDF · technical manual', sections: [
            ['Installing the client', 'Download the VPN client from the IT portal and sign in with your corporate account. Multi-factor authentication is required on first login.'],
            ['Troubleshooting', 'If the connection drops repeatedly, switch to the TCP profile and restart the client. Persistent failures should be reported to the IT service desk.']
        ] },
        { id: 'expense', title: 'Expense Reimbursement Policy', type: 'PDF · policy', sections: [
            ['Eligible expenses', 'Travel, client meals and approved training are reimbursable. Alcohol and personal entertainment are not reimbursed.'],
            ['Submitting a claim', 'Submit claims in the finance portal within 30 days with itemized receipts attached. Claims above 500 USD need director approval.']
        ] },
        { id: 'incident', title: 'Incident Response Runbook', type: 'PDF · runbook', sections: [
            ['Severity levels', 'Sev-1 means a customer-facing outage or data exposure; page the on-call engineer immediately. Sev-3 issues are handled during business hours.'],
            ['Communication', 'Open an incident channel, assign an incident commander and post status updates every 30 minutes until the incident is resolved.']
        ] },
        { id: 'retention', title: 'Data Retention Policy', type: 'PDF · policy', sections: [
            ['Retention periods', 'Customer records are retained for seven years after the contract ends. Application logs are deleted after 90 days.'],
            ['Deletion requests', 'Verified deletion requests must be completed within 30 days and confirmed to the requester in writing.']
        ] },
        { id: 'api', title: 'API Platform Standards', type: 'PDF · technical manual', sections: [
            ['Rate limits', 'Public endpoints allow 100 requests per minute per API key. Exceeding the limit returns HTTP 429 with a Retry-After header.'],
            ['Error format', 'Errors return a JSON body with code, message and request_id so that issues can be traced in the logs.']
        ] },
        { id: 'leave', title: 'Leave Policy', type: 'PDF · policy', sections: [
            ['Annual leave', 'Full-time employees accrue 24 days of paid annual leave per year, credited monthly.'],
            ['Sick leave', 'Up to 12 days of paid sick leave are available each year. A medical certificate is required for absences longer than two days.']
        ] },
        { id: 'onboard', title: 'Onboarding Handbook', type: 'PDF · handbook', sections: [
            ['First week', 'New hires receive their laptop, accounts and an onboarding buddy on day one, and complete security training within the first week.'],
            ['Access requests', 'Request access to additional systems through the IT portal. Your manager approves each access request.']
        ] }
    ];
    const DOC_COLORS = {
        remote: [52, 211, 153], vpn: [56, 189, 248], expense: [250, 204, 21], incident: [248, 113, 113],
        retention: [192, 132, 252], api: [129, 140, 248], leave: [251, 146, 60], onboard: [45, 212, 191]
    };

    // concept groups give the demo embedding its "semantic" behaviour
    const CONCEPTS = {
        remote: ['remote', 'remotely', 'home', 'wfh', 'telework', 'hybrid', 'offsite'],
        network: ['vpn', 'connect', 'connection', 'connecting', 'disconnect', 'disconnecting', 'disconnects', 'drops', 'network', 'tunnel', 'tcp'],
        device: ['laptop', 'computer', 'device', 'devices', 'monitor', 'equipment', 'hardware', 'pc'],
        money: ['expense', 'expenses', 'reimburse', 'reimbursed', 'reimbursable', 'reimbursement', 'claim', 'claims', 'receipt', 'receipts', 'refund', 'cost', 'money', 'pay', 'paid'],
        travel: ['travel', 'trip', 'flight', 'hotel', 'meal', 'meals', 'dinner', 'lunch'],
        outage: ['outage', 'incident', 'down', 'downtime', 'sev', 'emergency', 'broken', 'page', 'on-call', 'oncall'],
        leave: ['leave', 'vacation', 'holiday', 'holidays', 'pto', 'absence', 'absences', 'sick', 'ill', 'annual'],
        retention: ['delete', 'deleted', 'deletion', 'erase', 'remove', 'retention', 'retained', 'retain', 'gdpr', 'logs'],
        limits: ['limit', 'limits', 'throttle', 'throttled', '429', 'quota', 'rate', 'requests', 'minute'],
        errors: ['error', 'errors', 'fail', 'failure', 'failures', 'exception', 'issue', 'issues', 'trace'],
        security: ['security', 'secure', 'mfa', 'multi-factor', 'authentication', 'password', 'login', 'sign', 'lock'],
        access: ['access', 'permission', 'permissions', 'account', 'accounts', 'approve', 'approves', 'approval'],
        newhire: ['onboarding', 'new', 'hire', 'hires', 'joiner', 'day', 'buddy', 'training']
    };
    const CONCEPT_OF = {};
    Object.entries(CONCEPTS).forEach(([g, ws]) => ws.forEach((w) => { (CONCEPT_OF[w] = CONCEPT_OF[w] || []).push(g); }));
    const GROUPS = Object.keys(CONCEPTS);

    const STOP = new Set('a an and are as at be before by can do does for from has have how i if in into is it its may me must my no not of on or our per should so than that the their them then there these they this to up we what when whenever where which who why will with within you your our us get got happens happen'.split(' '));

    const tokenize = (s) => s.toLowerCase().replace(/[^a-z0-9\-\s]/g, ' ').split(/\s+/).filter(Boolean);
    const stem = (w) => w.replace(/(ings|ing|ed|es|s)$/,'').replace(/(.)\1$/, '$1') || w;
    const terms = (s) => tokenize(s).filter((w) => !STOP.has(w)).map((w) => ({ raw: w, st: stem(w) }));

    /* ---------- build chunks + indexes ---------- */
    const CHUNKS = [];
    DOCS.forEach((d) => d.sections.forEach(([sec, text], i) => {
        CHUNKS.push({ id: `${d.id}-${i + 1}`, doc: d, section: sec, text, pos: i + 1, of: d.sections.length });
    }));

    const DIM = 64;
    const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return Math.abs(h); };
    function embed(text) {
        const v = new Float32Array(DIM + GROUPS.length);
        terms(text).forEach(({ raw, st }) => {
            v[hash(st) % DIM] += 0.35;                    // lexical component
            (CONCEPT_OF[raw] || CONCEPT_OF[st] || []).forEach((g) => { v[DIM + GROUPS.indexOf(g)] += 1; }); // concept component
        });
        let n = 0; for (let i = 0; i < v.length; i++) n += v[i] * v[i];
        n = Math.sqrt(n) || 1;
        for (let i = 0; i < v.length; i++) v[i] /= n;
        return v;
    }
    const cos = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; };

    CHUNKS.forEach((c) => {
        c.terms = terms(`${c.section} ${c.text}`);
        c.vec = embed(`${c.section} ${c.text}`);
        c.tokens = Math.round(tokenize(c.text).length * 1.33);
        c.tf = {};
        c.terms.forEach(({ st }) => { c.tf[st] = (c.tf[st] || 0) + 1; });
        c.len = c.terms.length;
        // 2D map position from concept weights (deterministic, meaningful clusters)
        let x = 0, y = 0, w = 0;
        GROUPS.forEach((g, i) => {
            const a = c.vec[DIM + i];
            if (a <= 0) return;
            const th = (i / GROUPS.length) * Math.PI * 2;
            x += Math.cos(th) * a; y += Math.sin(th) * a; w += a;
        });
        const j = hash(c.id);
        c.mx = (w ? x / w : 0) * 0.78 + ((j % 100) / 100 - 0.5) * 0.18;
        c.my = (w ? y / w : 0) * 0.78 + (((j >> 8) % 100) / 100 - 0.5) * 0.18;
    });
    const AVGDL = CHUNKS.reduce((s, c) => s + c.len, 0) / CHUNKS.length;
    const DF = {};
    CHUNKS.forEach((c) => Object.keys(c.tf).forEach((t) => { DF[t] = (DF[t] || 0) + 1; }));

    function bm25(q) {
        const qs = Array.from(new Set(terms(q).map((t) => t.st)));
        const N = CHUNKS.length, k1 = 1.2, b = 0.75;
        return CHUNKS.map((c) => {
            let s = 0; const hit = [];
            qs.forEach((t) => {
                const f = c.tf[t];
                if (!f) return;
                const idf = Math.log(1 + (N - DF[t] + 0.5) / (DF[t] + 0.5));
                s += idf * (f * (k1 + 1)) / (f + k1 * (1 - b + b * c.len / AVGDL));
                hit.push(t);
            });
            return { c, s, hit };
        }).filter((r) => r.s > 0).sort((a, b2) => b2.s - a.s);
    }

    function semantic(q) {
        const qv = embed(q);
        const qGroups = GROUPS.filter((g, i) => qv[DIM + i] > 0);
        return { qv, list: CHUNKS.map((c) => {
            const s = cos(qv, c.vec);
            const shared = qGroups.filter((g) => c.vec[DIM + GROUPS.indexOf(g)] > 0);
            return { c, s, shared };
        }).filter((r) => r.s > 0.12).sort((a, b) => b.s - a.s) };
    }

    function hybrid(kw, sem) {
        const K0 = 60;
        const m = new Map();
        kw.slice(0, 10).forEach((r, i) => { m.set(r.c.id, { c: r.c, s: 1 / (K0 + i + 1), kr: i + 1, hit: r.hit, shared: [] }); });
        sem.slice(0, 10).forEach((r, i) => {
            const e = m.get(r.c.id) || { c: r.c, s: 0, hit: [], shared: [] };
            e.s += 1 / (K0 + i + 1); e.sr = i + 1; e.shared = r.shared;
            m.set(r.c.id, e);
        });
        return Array.from(m.values()).sort((a, b) => b.s - a.s);
    }

    // highlight exact keyword hits (<mark>) and concept matches (<span class="ns-sem">)
    function highlight(text, hitStems, groups) {
        return text.split(/(\s+)/).map((tok) => {
            const m = /^([^a-z0-9\-]*)([a-z0-9\-]+)([^a-z0-9\-]*)$/i.exec(tok);
            if (!m) return esc(tok);
            const [, pre, word, post] = m;
            const w = word.toLowerCase();
            if (hitStems.includes(stem(w))) return `${esc(pre)}<mark>${esc(word)}</mark>${esc(post)}`;
            const g = CONCEPT_OF[w] || CONCEPT_OF[stem(w)];
            if (g && g.some((x) => groups.includes(x))) return `${esc(pre)}<span class="ns-sem">${esc(word)}</span>${esc(post)}`;
            return esc(tok);
        }).join('');
    }

    const SUGGEST = [
        'The VPN keeps disconnecting',
        'Am I allowed to WFH on my personal computer?',
        'How do I get reimbursed for a client dinner?',
        'error 429',
        'How long do we keep application logs?'
    ];

    /* =====================================================================
       INGESTION
       ===================================================================== */
    const STEPS = ['Documents', 'Parsing', 'Structure', 'Chunking', 'Metadata', 'Embedding', 'Indexing'];

    class Ingestion {
        constructor(el, owner) {
            this.el = el;
            this.owner = owner;
            el.innerHTML = `
                <div class="nz-head">
                    <div><p class="ns-kicker">Document ingestion</p><h4 class="ns-title">From PDFs to an index you can query</h4>
                    <p class="ns-sub">Structure-aware parsing: every chunk keeps its document and section. Select one to inspect.</p><ul class="ns-tags"><li>Recursive multi-format parsing</li><li>Structural metadata</li><li>Token-budget chunking</li><li>Vector index sync</li></ul></div>
                    <button type="button" class="jr-btn" data-run><span class="jr-btn__icon" aria-hidden="true">▶</span>Run ingestion</button>
                </div>
                <ol class="nz-steps">${STEPS.map((s, i) => `<li data-step="${i}"><span>${String(i + 1).padStart(2, '0')}</span>${s}</li>`).join('')}</ol>
                <div class="nz-ing">
                    <div class="nz-chunks" role="group" aria-label="${DOCS.length} documents split into ${CHUNKS.length} chunks">${CHUNKS.map((c, i) => `<button type="button" class="nz-chunk" data-chunk="${c.id}" style="--c:${DOC_COLORS[c.doc.id].join(',')};--i:${i}" aria-label="Chunk: ${esc(c.doc.title)}, ${esc(c.section)}"><span class="nz-chunk__d">${esc(c.doc.title)}</span><span class="nz-chunk__s">${esc(c.section)}</span><span class="nz-chunk__v" aria-hidden="true"></span></button>`).join('')}</div>
                    <div class="nz-inspect" aria-live="polite"></div>
                </div>`;
            this.el.addEventListener('click', (e) => {
                const b = e.target.closest('[data-chunk]');
                if (b) this.inspect(b.dataset.chunk);
            });
            el.querySelector('[data-run]').addEventListener('click', () => this.run());
            this.setStep(STEPS.length);
            this.inspect(CHUNKS[1].id);
        }

        setStep(n) {
            this.el.querySelectorAll('.nz-steps li').forEach((li) => {
                const i = Number(li.dataset.step);
                li.classList.toggle('is-done', i < n);
                li.classList.toggle('is-active', i === n);
            });
            const ing = this.el.querySelector('.nz-ing');
            ing.dataset.stage = String(n);
        }

        run() {
            clearTimeout(this.tm);
            if (K.reduced) { this.setStep(STEPS.length); return; }
            let i = 0;
            const ing = this.el.querySelector('.nz-ing');
            ing.classList.remove('is-running'); void ing.offsetWidth; ing.classList.add('is-running');
            const tick = () => { this.setStep(i); i++; if (i <= STEPS.length) this.tm = setTimeout(tick, 520); };
            tick();
        }

        inspect(id) {
            const c = CHUNKS.find((x) => x.id === id);
            this.el.querySelectorAll('.nz-chunk').forEach((b) => b.classList.toggle('is-sel', b.dataset.chunk === id));
            const bars = Array.from(c.vec.slice(DIM, DIM + GROUPS.length)).map((v) => `<i style="height:${Math.max(4, v * 100)}%"></i>`).join('');
            this.el.querySelector('.nz-inspect').innerHTML = `
                <p class="nz-inspect__path"><span style="--c:${DOC_COLORS[c.doc.id].join(',')}">${esc(c.doc.title)}</span> › ${esc(c.section)}</p>
                <blockquote>${esc(c.text)}</blockquote>
                <dl>
                    <div><dt>Source</dt><dd>${esc(c.doc.type)}</dd></div>
                    <div><dt>Position</dt><dd>section ${c.pos} of ${c.of}</dd></div>
                    <div><dt>Tokens</dt><dd>≈ ${c.tokens} <em>approx.</em></dd></div>
                    <div><dt>Chunk id</dt><dd><code>${c.id}</code></dd></div>
                </dl>
                <div class="nz-vec"><span class="nz-vec__l">Embedding · concept dimensions</span><div class="nz-vec__bars" aria-hidden="true">${bars}</div><span class="nz-vec__n">${DIM + GROUPS.length}-d demo vector · indexed for BM25 and cosine search</span></div>`;
        }
    }

    /* =====================================================================
       RETRIEVAL WORKBENCH + ANSWER
       ===================================================================== */
    class Workbench {
        constructor(el) {
            this.el = el;
            this.mqNarrow = window.matchMedia('(max-width: 760px)');
            // phones get one readable column first; the comparison is one tap away
            this.mode = this.mqNarrow.matches ? 'hybrid' : 'compare';
            el.innerHTML = `
                <div class="nz-head">
                    <div><p class="ns-kicker">Hybrid retrieval laboratory</p><h4 class="ns-title">Ask the demo corpus</h4>
                    <p class="ns-sub">Your own query, ranked three ways over the same 17 chunks. <span class="nz-mark-k"><mark>exact keyword</mark></span> <span class="nz-mark-k"><span class="ns-sem">concept match</span></span></p></div>
                </div>
                <form class="nz-search" role="search">
                    <label for="nz-q" class="jr-sr">Query</label>
                    <input id="nz-q" type="search" maxlength="160" autocomplete="off" placeholder="Ask about remote work, expenses, incidents, API limits…">
                    <button type="submit" class="jr-btn">Search</button>
                </form>
                <div class="nz-suggest">${SUGGEST.map((s) => `<button type="button" class="jr-chip" data-q="${esc(s)}">${esc(s)}</button>`).join('')}</div>
                <div class="nz-modes" role="tablist" aria-label="Retrieval mode">
                    ${[['compare', 'Compare all'], ['semantic', 'Semantic'], ['keyword', 'Keyword · BM25'], ['hybrid', 'Hybrid · RRF']].map(([k, n]) => `<button type="button" role="tab" class="jr-seg" data-key="${k}" aria-selected="${k === this.mode}" tabindex="${k === this.mode ? 0 : -1}">${n}</button>`).join('')}
                </div>
                <div class="nz-bench">
                    <div class="nz-results" aria-live="polite"></div>
                    <div class="nz-map">
                        <p class="nz-map__h">Embedding space <em>2-D projection of the demo vectors</em></p>
                        <svg class="nz-map__svg" viewBox="-1 -1 2 2" aria-hidden="true"></svg>
                    </div>
                </div>
                <div class="nz-answer">
                    <div class="nz-ctx">
                        <p class="nz-block__h">Context assembly <span data-budget></span></p>
                        <ol class="nz-ctx__list"></ol>
                    </div>
                    <div class="nz-gen">
                        <p class="nz-block__h">Grounded answer</p>
                        <div class="nz-gen__body" aria-live="polite"></div>
                    </div>
                </div>
                <p class="jr-footnote">Fictional corpus and a lightweight in-browser embedding, not the production model. BM25 and Reciprocal Rank Fusion are real.</p>`;
            this.input = el.querySelector('#nz-q');
            el.querySelector('.nz-search').addEventListener('submit', (e) => { e.preventDefault(); this.search(this.input.value); });
            el.querySelector('.nz-suggest').addEventListener('click', (e) => { const b = e.target.closest('[data-q]'); if (b) { this.input.value = b.dataset.q; this.search(b.dataset.q); } });
            K.tabs(el.querySelector('.nz-modes'), (k) => { this.mode = k; this.render(); });
            el.addEventListener('pointerover', (e) => { const c = e.target.closest('[data-cite]'); this.cite(c ? c.dataset.cite : null); });
            el.addEventListener('focusin', (e) => { const c = e.target.closest('[data-cite]'); this.cite(c ? c.dataset.cite : null); });
            el.addEventListener('pointerout', (e) => { if (e.target.closest('[data-cite]')) this.cite(null); });
            this.input.value = SUGGEST[0];
            this.search(SUGGEST[0]);
        }

        cite(n) {
            this.el.querySelectorAll('.nz-ctx__list li').forEach((li) => li.classList.toggle('is-cited', li.dataset.n === n));
            this.el.querySelectorAll('.nz-gen [data-cite]').forEach((b) => b.classList.toggle('is-cited', b.dataset.cite === n));
        }

        search(q) {
            q = (q || '').trim().slice(0, 160);
            if (!q) return;
            this.q = q;
            this.kw = bm25(q);
            const sem = semantic(q);
            this.qv = sem.qv;
            this.sem = sem.list;
            this.hy = hybrid(this.kw, this.sem);
            this.render();
            this.renderAnswer();
        }

        col(name, list, kind) {
            const top = list.slice(0, this.mode === 'compare' ? 3 : 5);
            const ctxIds = this.hy.slice(0, 3).map((r) => r.c.id);
            const max = top.length ? top[0].s : 1;
            const rows = top.length ? top.map((r, i) => {
                const hit = r.hit || [];
                const groups = r.shared || [];
                const why = [];
                if (hit.length) why.push(`keyword: ${hit.slice(0, 3).join(', ')}`);
                if (groups.length) why.push(`concept: ${groups.slice(0, 2).join(', ')}`);
                if (kind === 'hybrid') why.push(`ranks ${r.kr ? `#${r.kr} kw` : '— kw'} · ${r.sr ? `#${r.sr} sem` : '— sem'}`);
                return `<li class="nz-hit${ctxIds.includes(r.c.id) && kind === 'hybrid' ? ' is-ctx' : ''}" style="--c:${DOC_COLORS[r.c.doc.id].join(',')}">
                    <div class="nz-hit__top"><span class="nz-hit__r">${i + 1}</span><span class="nz-hit__src">${esc(r.c.doc.title)} <i>›</i> ${esc(r.c.section)}</span><span class="nz-hit__s">${kind === 'hybrid' ? r.s.toFixed(4) : r.s.toFixed(2)}</span></div>
                    <span class="nz-hit__bar" aria-hidden="true"><i style="transform:scaleX(${(r.s / max).toFixed(3)})"></i></span>
                    <p class="nz-hit__txt">${highlight(r.c.text, kind === 'semantic' ? [] : hit, kind === 'keyword' ? [] : groups)}</p>
                    <p class="nz-hit__why">${why.map((w) => `<span>${esc(w)}</span>`).join('')}</p>
                </li>`;
            }).join('') : `<li class="nz-empty">${kind === 'keyword' ? 'No chunk contains these terms.' : 'Nothing semantically close in the demo corpus.'}</li>`;
            return `<div class="nz-col" data-kind="${kind}"><p class="nz-col__h">${name}<span>${kind === 'keyword' ? 'BM25 score' : kind === 'semantic' ? 'cosine' : 'RRF score'}</span></p><ol>${rows}</ol></div>`;
        }

        render() {
            const R = this.el.querySelector('.nz-results');
            const m = this.mode;
            R.dataset.mode = m;
            const parts = {
                semantic: () => this.col('Semantic', this.sem, 'semantic'),
                keyword: () => this.col('Keyword', this.kw, 'keyword'),
                hybrid: () => this.col('Hybrid', this.hy, 'hybrid')
            };
            R.innerHTML = m === 'compare' ? parts.keyword() + parts.semantic() + parts.hybrid() : parts[m]();
            this.renderMap();
        }

        renderMap() {
            const svg = this.el.querySelector('.nz-map__svg');
            // project the query the same way chunks are projected
            let x = 0, y = 0, w = 0;
            GROUPS.forEach((g, i) => { const a = this.qv[DIM + i]; if (a <= 0) return; const th = (i / GROUPS.length) * Math.PI * 2; x += Math.cos(th) * a; y += Math.sin(th) * a; w += a; });
            const qx = (w ? x / w : 0) * 0.78, qy = (w ? y / w : 0) * 0.78;
            const list = this.mode === 'keyword' ? this.kw : this.mode === 'semantic' ? this.sem : this.hy;
            const top = list.slice(0, 3).map((r) => r.c.id);
            const rings = [0.33, 0.66, 0.95].map((r) => `<circle class="nz-ring" cx="0" cy="0" r="${r}"/>`).join('');
            const lines = top.map((id) => { const c = CHUNKS.find((k) => k.id === id); return `<line class="nz-link" x1="${qx}" y1="${qy}" x2="${c.mx}" y2="${c.my}"/>`; }).join('');
            const pts = CHUNKS.map((c) => `<circle class="nz-pt${top.includes(c.id) ? ' is-top' : ''}" cx="${c.mx.toFixed(3)}" cy="${c.my.toFixed(3)}" r="${top.includes(c.id) ? 0.045 : 0.03}" style="--c:${DOC_COLORS[c.doc.id].join(',')}"><title>${esc(c.doc.title)} › ${esc(c.section)}</title></circle>`).join('');
            svg.innerHTML = `${rings}${lines}${pts}<g class="nz-q"><circle cx="${qx}" cy="${qy}" r="0.05"/><circle class="nz-q__halo" cx="${qx}" cy="${qy}" r="0.11"/></g>`;
        }

        renderAnswer() {
            const ctx = this.hy.slice(0, 3);
            const list = this.el.querySelector('.nz-ctx__list');
            const budget = 300;
            const used = ctx.reduce((s, r) => s + r.c.tokens, 0);
            this.el.querySelector('[data-budget]').innerHTML = ctx.length ? `<span class="nz-budget"><i style="transform:scaleX(${Math.min(1, used / budget).toFixed(3)})"></i></span>≈ ${used} / ${budget} tokens` : '';
            list.innerHTML = ctx.map((r, i) => `<li data-n="${i + 1}" style="--c:${DOC_COLORS[r.c.doc.id].join(',')}"><span class="nz-ctx__n">${i + 1}</span><p class="nz-ctx__src">${esc(r.c.doc.title)} › ${esc(r.c.section)}</p><span class="nz-ctx__tok">≈ ${r.c.tokens} tok</span></li>`).join('');

            const body = this.el.querySelector('.nz-gen__body');
            const qTerms = terms(this.q).map((t) => t.st);
            const qGroups = GROUPS.filter((g, i) => this.qv[DIM + i] > 0);
            const sentences = [];
            ctx.forEach((r, i) => {
                const ss = r.c.text.split(/(?<=\.)\s+/);
                let best = null, bs = 0;
                ss.forEach((s) => {
                    const t = terms(s);
                    let score = 0;
                    t.forEach(({ raw, st }) => {
                        if (qTerms.includes(st)) score += 1.2;
                        const g = CONCEPT_OF[raw] || CONCEPT_OF[st];
                        if (g && g.some((x) => qGroups.includes(x))) score += 1;
                    });
                    if (score > bs) { bs = score; best = s; }
                });
                // require real evidence: a concept match plus a term, or several terms
                if (best && bs >= 2) sentences.push([best.replace(/\.$/, ''), i + 1]);
            });
            if (!sentences.length) {
                body.innerHTML = '<p class="nz-decline">No grounded answer. Nothing in the demo corpus supports one, so the system declines instead of guessing.</p>';
                return;
            }
            body.innerHTML = `<p>${sentences.map(([s, n]) => `${esc(s)} <button type="button" class="nz-cite" data-cite="${n}" aria-label="Source ${n}">${n}</button>`).join('. ')}.</p>
                <p class="nz-gen__src">Extracted from cited chunks; in production this context feeds an LLM via LangChain.</p>`;
        }
    }

    /* =====================================================================
       SERVICE PATH (FastAPI)
       ===================================================================== */
    const SVC = [
        ['req', 'Request', 'POST /query'],
        ['api', 'FastAPI', 'async · Pydantic'],
        ['proc', 'Processing', 'LangChain chain'],
        ['ret', 'Retrieval', 'hybrid search'],
        ['ctx', 'Context', 'token budget'],
        ['res', 'Response', 'answer + sources']
    ];
    const SCEN = {
        ok: { path: ['req', 'api', 'proc', 'ret', 'ctx', 'res'], status: '200 OK', note: 'Validated payload flows through retrieval and context assembly; the response carries answer and sources.', cls: 'ok' },
        bad: { path: ['req', 'api'], stopAt: 'api', status: '422 Unprocessable Entity', note: 'Pydantic rejects the payload at the boundary (missing "query" field) before any downstream work starts.', cls: 'bad' },
        flaky: { path: ['req', 'api', 'proc', 'ret', 'ret', 'ctx', 'res'], retryAt: 'ret', status: '200 OK · recovered', note: 'A transient retrieval failure is caught and retried; the client still gets a normal response.', cls: 'warn' }
    };

    class Service {
        constructor(el) {
            this.el = el;
            el.innerHTML = `
                <div class="nz-head">
                    <div><p class="ns-kicker">Production service path</p><h4 class="ns-title">FastAPI, with its boundaries visible</h4>
                    <p class="ns-sub">Async microservices with explicit validation and recovery boundaries.</p><ul class="ns-tags"><li>Pydantic validation</li><li>Connection pooling</li><li>LangChain orchestration</li><li>Automated recovery</li></ul></div>
                </div>
                <div class="nz-svc">
                    <div class="nz-svc__zone" aria-hidden="true"><span>validation boundary</span></div>
                    <div class="nz-svc__zone nz-svc__zone--rec" aria-hidden="true"><span>error-recovery boundary</span></div>
                    ${SVC.map(([k, t, s]) => `<div class="nz-svc__n" data-n="${k}"><b>${t}</b><span>${s}</span></div>`).join('<span class="nz-svc__a" aria-hidden="true"></span>')}
                </div>
                <div class="nz-svc__ctl" role="group" aria-label="Send a request">
                    <button type="button" class="jr-chip" data-s="ok">Valid request</button>
                    <button type="button" class="jr-chip" data-s="bad">Invalid payload</button>
                    <button type="button" class="jr-chip" data-s="flaky">Transient retriever failure</button>
                </div>
                <div class="nz-svc__out" aria-live="polite"></div>`;
            el.querySelector('.nz-svc__ctl').addEventListener('click', (e) => { const b = e.target.closest('[data-s]'); if (b) this.run(b.dataset.s); });
            this.run('ok', true);
        }

        run(key, instant) {
            clearTimeout(this.tm);
            const sc = SCEN[key];
            const nodes = this.el.querySelectorAll('.nz-svc__n');
            nodes.forEach((n) => { n.className = 'nz-svc__n'; });
            const out = this.el.querySelector('.nz-svc__out');
            out.innerHTML = '';
            let i = 0;
            const done = () => {
                out.innerHTML = `<span class="nz-svc__code is-${sc.cls}">${sc.status}</span><p>${sc.note}</p>`;
            };
            const sync = instant || K.reduced;
            const step = () => {
                const k = sc.path[i];
                const n = this.el.querySelector(`[data-n="${k}"]`);
                const retrying = sc.retryAt === k && sc.path.indexOf(k) === i;
                if (n) {
                    n.classList.add(retrying ? 'is-retry' : 'is-pass');
                    if (sc.stopAt === k) n.classList.add('is-stop');
                }
                i++;
                if (sync) return;
                if (i < sc.path.length) this.tm = setTimeout(step, 320);
                else done();
            };
            if (sync) { while (i < sc.path.length) step(); done(); return; }
            step();
        }
    }

    /* =====================================================================
       LAB
       ===================================================================== */
    class NetsmartzLab {
        constructor(root) {
            root.classList.add('nz');
            root.innerHTML = `<div class="nz-card nz-card--ing"></div><div class="nz-card nz-card--bench"></div><div class="nz-card nz-card--svc"></div>`;
            this.ing = new Ingestion(root.querySelector('.nz-card--ing'), this);
            this.bench = new Workbench(root.querySelector('.nz-card--bench'));
            this.svc = new Service(root.querySelector('.nz-card--svc'));
        }
        activate() {}
        deactivate() {}
    }

    window.JLabs.netsmartz = { mount: (root) => new NetsmartzLab(root), engine: { bm25, semantic, hybrid, CHUNKS } };
})();
