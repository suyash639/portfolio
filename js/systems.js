/**
 * Production Systems & Open Source (#systems)
 *  - each project "comes alive" on hover / keyboard focus (touch: when scrolled into view)
 *  - SVG (SMIL) animations run only while their project is live
 *  - notification pipeline stages are inspectable; copy reflects the repository's actual flow
 *  - clicking a panel's background opens that project's detail inspector (the existing modal)
 */
(() => {
    'use strict';

    const STAGES = {
        api: 'Client applications call the REST API to send an email or a push notification.',
        fastapi: 'FastAPI routes validate the request against Pydantic schemas and hand it to the delivery service.',
        ses: 'AWS SES sends the email and returns its message id.',
        fcm: 'Firebase Cloud Messaging delivers push to one device, several devices or a topic.',
        record: 'Each sent email is stored in MongoDB together with its SES message id.',
        inbound: 'Mail addressed to the domain is received by AWS SES.',
        s3: 'SES writes the raw .eml message to S3.',
        sns: 'SNS notifies the service that a new message has arrived.',
        webhook: 'The /webhook/ses endpoint accepts the notification and processes it in a background task.',
        inbox: 'The parser extracts sender, recipients, body and attachments into the MongoDB inbox; failures go to an error collection.'
    };

    function init() {
        const section = document.getElementById('systems');
        if (!section || !section.classList.contains('ps')) return;
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const touch = window.matchMedia('(hover: none)').matches;
        const panels = Array.from(section.querySelectorAll('[data-ps]'));

        const setLive = (panel, on) => {
            panel.classList.toggle('is-live', on);
            panel.querySelectorAll('svg').forEach((svg) => {
                if (!svg.pauseAnimations) return;
                if (on && !reduced) svg.unpauseAnimations(); else svg.pauseAnimations();
            });
        };

        panels.forEach((panel) => {
            setLive(panel, false);
            if (reduced) { panel.classList.add('is-live'); return; } // final states, no motion

            panel.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') setLive(panel, true); });
            panel.addEventListener('pointerleave', (e) => {
                if (e.pointerType === 'mouse' && !panel.contains(document.activeElement)) setLive(panel, false);
            });
            panel.addEventListener('focusin', () => setLive(panel, true));
            panel.addEventListener('focusout', () => {
                setTimeout(() => { if (!panel.contains(document.activeElement) && !panel.matches(':hover')) setLive(panel, false); }, 0);
            });

            // selection: clicking the panel itself (not a link or button) opens its detail inspector
            const details = panel.querySelector('[data-project]');
            if (details) {
                panel.style.cursor = 'pointer';
                panel.addEventListener('click', (e) => {
                    if (e.target.closest('a, button')) return;
                    details.click();
                });
            }
        });

        // touch devices have no hover: bring each project to life as it scrolls into view
        if (touch && !reduced && 'IntersectionObserver' in window) {
            const io = new IntersectionObserver((entries) => {
                entries.forEach((en) => setLive(en.target, en.isIntersecting));
            }, { threshold: 0.45 });
            panels.forEach((p) => io.observe(p));
        }

        // notification stages: hover (or tap) to inspect
        const nfy = section.querySelector('.nfy');
        if (nfy) {
            const cap = section.querySelector('.nfy__cap');
            const nodes = nfy.querySelectorAll('.nfy__node');
            const show = (n) => {
                nodes.forEach((x) => x.classList.toggle('is-on', x === n));
                cap.textContent = STAGES[n.dataset.stage] || '';
            };
            nodes.forEach((n) => {
                n.addEventListener('pointerenter', () => show(n));
                n.addEventListener('click', (e) => { e.stopPropagation(); show(n); });
            });
        }
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
