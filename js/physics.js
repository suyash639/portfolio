/**
 * Suyash Tiwari — AI Systems & Infrastructure Portfolio
 * Three.js WebGL Ambient Neural Field & Matter.js 2D Rigid Body Physics Engine
 * Equipped with IntersectionObserver performance guards and dynamic resize lifecycle.
 */

document.addEventListener('DOMContentLoaded', () => {
    initThreeBackground();
    initMatterSkillsEngine();
});

/* --------------------------------------------------------------------------
   01. THREE.JS WEBGL AMBIENT NEURAL FIELD
   -------------------------------------------------------------------------- */
function initThreeBackground() {
    const canvas = document.getElementById('background-canvas');
    if (!canvas || !window.THREE) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 40;

    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true,
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Particle Points Mesh
    const particleCount = 180;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        positions[i3] = (Math.random() - 0.5) * 80;
        positions[i3 + 1] = (Math.random() - 0.5) * 80;
        positions[i3 + 2] = (Math.random() - 0.5) * 40;

        // Accent orange / cyan blend
        const isOrange = Math.random() > 0.35;
        if (isOrange) {
            colors[i3] = 1.0;
            colors[i3 + 1] = 0.48; // #ff7a00
            colors[i3 + 2] = 0.0;
        } else {
            colors[i3] = 0.0;
            colors[i3 + 1] = 0.94; // #00f0ff
            colors[i3 + 2] = 1.0;
        }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 0.65,
        vertexColors: true,
        transparent: true,
        opacity: 0.35,
        sizeAttenuation: true
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // Mouse Tracking
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;
    let isVisible = true;
    let animationFrameId = null;

    window.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX / window.innerWidth) * 2 - 1;
        mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    }, { passive: true });

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Visibility Observer to conserve GPU when tab is hidden
    document.addEventListener('visibilitychange', () => {
        isVisible = document.visibilityState === 'visible';
        if (isVisible && !animationFrameId) {
            animate();
        }
    });

    // Animation Loop
    function animate() {
        if (!isVisible) {
            animationFrameId = null;
            return;
        }

        animationFrameId = requestAnimationFrame(animate);

        targetX += (mouseX - targetX) * 0.03;
        targetY += (mouseY - targetY) * 0.03;

        particles.rotation.y += 0.0008;
        particles.rotation.x = targetY * 0.15;
        particles.rotation.y += targetX * 0.002;

        renderer.render(scene, camera);
    }
    animate();
}

/* --------------------------------------------------------------------------
   02. MATTER.JS RIGID-BODY SKILL PHYSICS PLAYGROUND
   -------------------------------------------------------------------------- */
function initMatterSkillsEngine() {
    const container = document.getElementById('matter-skills-container');
    if (!container || !window.Matter) return;

    const SKILLS_DATA = [
        { name: 'AI / Agents', size: 'large', category: 'ai' },
        { name: 'Python', size: 'large', category: 'language' },
        { name: 'FastAPI', size: 'large', category: 'backend' },
        { name: 'TypeScript', size: 'large', category: 'language' },
        { name: 'React 19', size: 'large', category: 'frontend' },
        { name: 'DSA (500+)', size: 'large', category: 'language' },
        
        { name: 'LangChain', size: 'medium', category: 'ai' },
        { name: 'LLaMA', size: 'medium', category: 'ai' },
        { name: 'ChromaDB', size: 'medium', category: 'database' },
        { name: 'PyTorch', size: 'medium', category: 'ai' },
        { name: 'TensorFlow', size: 'medium', category: 'ai' },
        { name: 'Node.js', size: 'medium', category: 'backend' },
        { name: 'MongoDB', size: 'medium', category: 'database' },
        { name: 'AWS (SES/SQS)', size: 'medium', category: 'cloud' },
        { name: 'Redis', size: 'medium', category: 'database' },
        { name: 'Next.js', size: 'medium', category: 'frontend' },
        
        { name: 'Docker', size: 'small', category: 'cloud' },
        { name: 'Git', size: 'small', category: 'cloud' },
        { name: 'SQL', size: 'small', category: 'database' },
        { name: 'REST APIs', size: 'small', category: 'backend' },
        { name: 'GraphQL', size: 'small', category: 'backend' },
        { name: 'Firebase', size: 'small', category: 'cloud' },
        { name: 'Kubernetes', size: 'small', category: 'cloud' },
        { name: 'Azure', size: 'small', category: 'cloud' },
        { name: 'VSCode API', size: 'small', category: 'cloud' },
        { name: 'JavaScript', size: 'small', category: 'language' },
        { name: 'C++', size: 'small', category: 'language' },
        { name: 'Java', size: 'small', category: 'language' },
        { name: 'HTML/CSS', size: 'small', category: 'frontend' },
        { name: 'UI/UX', size: 'small', category: 'frontend' }
    ];

    const { Engine, World, Bodies, Body, Mouse, MouseConstraint } = Matter;

    let width = container.clientWidth || 800;
    let height = container.clientHeight || 480;

    const engine = Engine.create({
        gravity: { x: 0, y: 0.05 } // gentle natural gravity
    });
    const world = engine.world;

    // Boundary Walls
    const wallThick = 60;
    let walls = [
        Bodies.rectangle(width / 2, -wallThick / 2, width * 2, wallThick, { isStatic: true }),
        Bodies.rectangle(width / 2, height + wallThick / 2, width * 2, wallThick, { isStatic: true }),
        Bodies.rectangle(-wallThick / 2, height / 2, wallThick, height * 2, { isStatic: true }),
        Bodies.rectangle(width + wallThick / 2, height / 2, wallThick, height * 2, { isStatic: true })
    ];
    World.add(world, walls);

    // Create Bubbles & DOM Elements
    const bubbleBodies = [];

    SKILLS_DATA.forEach(skill => {
        const bubble = document.createElement('div');
        bubble.className = `skill-bubble ${skill.size}`;
        bubble.setAttribute('data-category', skill.category);
        bubble.setAttribute('data-cursor', 'drag');
        bubble.textContent = skill.name;
        container.appendChild(bubble);

        const radius = skill.size === 'large' ? 50 : (skill.size === 'medium' ? 40 : 32.5);
        const startX = Math.random() * (width - 120) + 60;
        const startY = Math.random() * (height - 120) + 60;

        const body = Bodies.circle(startX, startY, radius, {
            restitution: 0.85,
            friction: 0.05,
            frictionAir: 0.02,
            density: 0.001
        });

        body.element = bubble;
        body.category = skill.category;
        body.radius = radius;

        World.add(world, body);
        bubbleBodies.push(body);

        // Double click pulse / force burst
        bubble.addEventListener('dblclick', () => {
            bubble.classList.add('exploding');
            Body.applyForce(body, body.position, {
                x: (Math.random() - 0.5) * 0.08,
                y: (Math.random() - 0.5) * 0.08
            });
            setTimeout(() => bubble.classList.remove('exploding'), 800);
        });
    });

    // Mouse Interaction Constraint
    const mouse = Mouse.create(container);
    const mouseConstraint = MouseConstraint.create(engine, {
        mouse: mouse,
        constraint: {
            stiffness: 0.15,
            render: { visible: false }
        }
    });
    World.add(world, mouseConstraint);

    // Container hover repulsion
    container.addEventListener('mousemove', (e) => {
        const rect = container.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        bubbleBodies.forEach(b => {
            const dx = b.position.x - mx;
            const dy = b.position.y - my;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 120 && dist > 0) {
                const force = 0.0003 * (1 - dist / 120);
                Body.applyForce(b, b.position, {
                    x: dx * force,
                    y: dy * force
                });
            }
        });
    });

    // Performance Lifecycle Guard via IntersectionObserver
    let isPhysicsActive = false;
    let physicsFrameId = null;

    function syncPhysics() {
        if (!isPhysicsActive) {
            physicsFrameId = null;
            return;
        }

        Engine.update(engine, 1000 / 60);

        bubbleBodies.forEach(b => {
            const el = b.element;
            const x = b.position.x - b.radius;
            const y = b.position.y - b.radius;
            el.style.transform = `translate(${x}px, ${y}px) rotate(${b.angle}rad)`;
        });

        physicsFrameId = requestAnimationFrame(syncPhysics);
    }

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    if (!isPhysicsActive) {
                        isPhysicsActive = true;
                        syncPhysics();
                    }
                } else {
                    isPhysicsActive = false;
                }
            });
        }, { rootMargin: '150px' });

        observer.observe(container);
    } else {
        isPhysicsActive = true;
        syncPhysics();
    }

    // Resize Handler
    window.addEventListener('resize', () => {
        const newWidth = container.clientWidth;
        const newHeight = container.clientHeight;
        if (!newWidth || !newHeight) return;

        width = newWidth;
        height = newHeight;

        Body.setPosition(walls[0], { x: width / 2, y: -wallThick / 2 });
        Body.setPosition(walls[1], { x: width / 2, y: height + wallThick / 2 });
        Body.setPosition(walls[2], { x: -wallThick / 2, y: height / 2 });
        Body.setPosition(walls[3], { x: width + wallThick / 2, y: height / 2 });
    });

    // Exported Control Methods for UI Buttons
    window.skillPhysics = {
        applyExplosion: () => {
            const centerX = width / 2;
            const centerY = height / 2;

            bubbleBodies.forEach(b => {
                const dx = b.position.x - centerX;
                const dy = b.position.y - centerY;
                const dist = Math.max(10, Math.sqrt(dx * dx + dy * dy));
                const forceMag = 0.04;

                Body.applyForce(b, b.position, {
                    x: (dx / dist) * forceMag,
                    y: (dy / dist) * forceMag
                });

                b.element.classList.add('exploding');
                setTimeout(() => b.element.classList.remove('exploding'), 800);
            });
        },
        resetPositions: () => {
            bubbleBodies.forEach(b => {
                const rx = Math.random() * (width - 140) + 70;
                const ry = Math.random() * (height - 140) + 70;
                Body.setPosition(b, { x: rx, y: ry });
                Body.setVelocity(b, { x: (Math.random() - 0.5) * 4, y: (Math.random() - 0.5) * 4 });
            });
        },
        groupByCategory: () => {
            const catTargets = {
                'ai': { x: width * 0.25, y: height * 0.3 },
                'language': { x: width * 0.75, y: height * 0.3 },
                'backend': { x: width * 0.25, y: height * 0.75 },
                'frontend': { x: width * 0.75, y: height * 0.75 },
                'database': { x: width * 0.5, y: height * 0.3 },
                'cloud': { x: width * 0.5, y: height * 0.75 }
            };

            bubbleBodies.forEach(b => {
                const target = catTargets[b.category] || { x: width / 2, y: height / 2 };
                const dx = target.x - b.position.x;
                const dy = target.y - b.position.y;
                Body.applyForce(b, b.position, {
                    x: dx * 0.00015,
                    y: dy * 0.00015
                });
            });
        }
    };
}