// Physics JavaScript file for Suyash Tiwari's Portfolio

document.addEventListener('DOMContentLoaded', () => {
    // Initialize physics effects
    initBackgroundEffects();
    initSkillBubblePhysics();
});

// Background Effects with Three.js
function initBackgroundEffects() {
    const canvas = document.getElementById('background-canvas');
    
    if (!canvas) return;
    
    // Initialize Three.js scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true,
        antialias: true
    });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Camera position
    camera.position.z = 30;
    
    // Create liquid blobs
    const blobs = [];
    const blobCount = 5;
    
    for (let i = 0; i < blobCount; i++) {
        // Create blob geometry
        const geometry = new THREE.SphereGeometry(Math.random() * 3 + 2, 32, 32);
        
        // Create blob material
        const material = new THREE.MeshBasicMaterial({
            color: 0xff7a00,
            transparent: true,
            opacity: 0.1,
            wireframe: false
        });
        
        // Create blob mesh
        const blob = new THREE.Mesh(geometry, material);
        
        // Random position
        blob.position.x = (Math.random() - 0.5) * 50;
        blob.position.y = (Math.random() - 0.5) * 50;
        blob.position.z = (Math.random() - 0.5) * 10;
        
        // Random rotation speed
        blob.rotationSpeed = {
            x: (Math.random() - 0.5) * 0.01,
            y: (Math.random() - 0.5) * 0.01,
            z: (Math.random() - 0.5) * 0.01
        };
        
        // Random movement speed
        blob.movementSpeed = {
            x: (Math.random() - 0.5) * 0.05,
            y: (Math.random() - 0.5) * 0.05,
            z: (Math.random() - 0.5) * 0.02
        };
        
        // Add to scene and blobs array
        scene.add(blob);
        blobs.push(blob);
    }
    
    // Create particles
    const particleCount = 200;
    const particles = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSizes = new Float32Array(particleCount);
    
    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        particlePositions[i3] = (Math.random() - 0.5) * 100;
        particlePositions[i3 + 1] = (Math.random() - 0.5) * 100;
        particlePositions[i3 + 2] = (Math.random() - 0.5) * 50;
        
        particleSizes[i] = Math.random() * 0.5 + 0.1;
    }
    
    particles.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particles.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));
    
    // Particle material
    const particleMaterial = new THREE.PointsMaterial({
        color: 0xff7a00,
        size: 0.5,
        transparent: true,
        opacity: 0.3,
        sizeAttenuation: true
    });
    
    // Create particle system
    const particleSystem = new THREE.Points(particles, particleMaterial);
    scene.add(particleSystem);
    
    // Mouse movement effect
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;
    
    document.addEventListener('mousemove', (event) => {
        mouseX = (event.clientX / window.innerWidth) * 2 - 1;
        mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    });
    
    // Handle window resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
    
    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        
        // Smooth mouse movement
        targetX += (mouseX - targetX) * 0.05;
        targetY += (mouseY - targetY) * 0.05;
        
        // Rotate and move blobs
        blobs.forEach(blob => {
            // Rotate blob
            blob.rotation.x += blob.rotationSpeed.x;
            blob.rotation.y += blob.rotationSpeed.y;
            blob.rotation.z += blob.rotationSpeed.z;
            
            // Move blob
            blob.position.x += blob.movementSpeed.x;
            blob.position.y += blob.movementSpeed.y;
            blob.position.z += blob.movementSpeed.z;
            
            // Boundary check and reverse direction
            if (Math.abs(blob.position.x) > 30) blob.movementSpeed.x *= -1;
            if (Math.abs(blob.position.y) > 30) blob.movementSpeed.y *= -1;
            if (Math.abs(blob.position.z) > 10) blob.movementSpeed.z *= -1;
            
            // Subtle deformation based on mouse position
            blob.scale.x = 1 + targetX * 0.1;
            blob.scale.y = 1 + targetY * 0.1;
        });
        
        // Move particle system based on mouse
        particleSystem.rotation.x += targetY * 0.0005;
        particleSystem.rotation.y += targetX * 0.0005;
        
        // Render scene
        renderer.render(scene, camera);
    }
    
    // Start animation
    animate();
}

// Skill Bubble Physics with Matter.js
function initSkillBubblePhysics() {
    const skillsContainer = document.querySelector('.skills-container');
    const skillBubbles = document.querySelectorAll('.skill-bubble');
    
    if (!skillsContainer || !skillBubbles.length || !window.Matter) return;
    
    // Get container dimensions
    const containerRect = skillsContainer.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;
    
    // Initialize Matter.js
    const Engine = Matter.Engine;
    const Render = Matter.Render;
    const World = Matter.World;
    const Bodies = Matter.Bodies;
    const Body = Matter.Body;
    const Mouse = Matter.Mouse;
    const MouseConstraint = Matter.MouseConstraint;
    
    // Create engine and world
    const engine = Engine.create();
    const world = engine.world;
    
    // Create renderer (hidden, we'll use DOM elements for visuals)
    const render = Render.create({
        element: skillsContainer,
        engine: engine,
        options: {
            width: containerWidth,
            height: containerHeight,
            wireframes: false,
            background: 'transparent',
            pixelRatio: window.devicePixelRatio
        }
    });
    
    // Disable gravity
    world.gravity.y = 0;
    
    // Create boundaries
    const wallThickness = 50;
    const walls = [
        // Top wall
        Bodies.rectangle(containerWidth / 2, -wallThickness / 2, containerWidth, wallThickness, { isStatic: true }),
        // Bottom wall
        Bodies.rectangle(containerWidth / 2, containerHeight + wallThickness / 2, containerWidth, wallThickness, { isStatic: true }),
        // Left wall
        Bodies.rectangle(-wallThickness / 2, containerHeight / 2, wallThickness, containerHeight, { isStatic: true }),
        // Right wall
        Bodies.rectangle(containerWidth + wallThickness / 2, containerHeight / 2, wallThickness, containerHeight, { isStatic: true })
    ];
    
    World.add(world, walls);
    
    // Create bodies for skill bubbles
    const bubbleBodies = [];
    
    skillBubbles.forEach(bubble => {
        // Get bubble dimensions
        const bubbleRect = bubble.getBoundingClientRect();
        const bubbleWidth = bubbleRect.width;
        const bubbleHeight = bubbleRect.height;
        const bubbleRadius = bubbleWidth / 2;
        
        // Get bubble position
        const bubbleX = parseFloat(bubble.style.left) / 100 * containerWidth;
        const bubbleY = parseFloat(bubble.style.top) / 100 * containerHeight;
        
        // Create circular body with properties based on size
        const sizeClass = bubble.classList.contains('large') ? 'large' : 
                         bubble.classList.contains('medium') ? 'medium' : 'small';
        
        // Adjust physics properties based on size
        let density, restitution, friction;
        switch(sizeClass) {
            case 'large':
                density = 0.002;
                restitution = 0.7;
                friction = 0.01;
                break;
            case 'medium':
                density = 0.001;
                restitution = 0.8;
                friction = 0.008;
                break;
            case 'small':
                density = 0.0005;
                restitution = 0.9;
                friction = 0.005;
                break;
            default:
                density = 0.001;
                restitution = 0.8;
                friction = 0.005;
        }
        
        // Create circular body
        const body = Bodies.circle(bubbleX, bubbleY, bubbleRadius, {
            restitution: restitution,
            friction: friction,
            frictionAir: 0.01,
            density: density
        });
        
        // Store reference to DOM element
        body.element = bubble;
        
        // Add to world and array
        World.add(world, body);
        bubbleBodies.push(body);
        
        // Add click event to apply impulse
        bubble.addEventListener('click', () => {
            // Apply random impulse on click
            const impulseX = (Math.random() - 0.5) * 0.05;
            const impulseY = (Math.random() - 0.5) * 0.05;
            Body.applyForce(body, body.position, { x: impulseX, y: impulseY });
            
            // Add pulse animation class
            bubble.classList.add('pulse');
            setTimeout(() => {
                bubble.classList.remove('pulse');
            }, 300);
        });
    });
    
    // Add mouse control
    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
        mouse: mouse,
        constraint: {
            stiffness: 0.2,
            render: {
                visible: false
            }
        }
    });
    
    World.add(world, mouseConstraint);
    
    // Mouse hover effect - repel bubbles
    skillsContainer.addEventListener('mousemove', e => {
        const mouseX = e.clientX - containerRect.left;
        const mouseY = e.clientY - containerRect.top;
        
        bubbleBodies.forEach(body => {
            const dx = body.position.x - mouseX;
            const dy = body.position.y - mouseY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Apply repulsion force if mouse is close
            if (distance < 150) {
                const force = 0.0005 * (1 - distance / 150);
                Body.applyForce(body, body.position, {
                    x: dx * force,
                    y: dy * force
                });
                
                // Add hover effect class
                body.element.classList.add('hover');
            } else {
                body.element.classList.remove('hover');
            }
        });
    });
    
    // Add occasional random forces for more dynamic movement
    setInterval(() => {
        bubbleBodies.forEach(body => {
            if (Math.random() > 0.7) { // Only apply to some bubbles
                const impulseX = (Math.random() - 0.5) * 0.002;
                const impulseY = (Math.random() - 0.5) * 0.002;
                Body.applyForce(body, body.position, { x: impulseX, y: impulseY });
            }
        });
    }, 2000);
    
    // Update bubble positions
    function updateBubblePositions() {
        bubbleBodies.forEach(body => {
            const bubble = body.element;
            const x = (body.position.x / containerWidth) * 100;
            const y = (body.position.y / containerHeight) * 100;
            
            bubble.style.left = `${x}%`;
            bubble.style.top = `${y}%`;
            
            // Apply rotation for a more dynamic feel
            const angle = body.angle * (180 / Math.PI);
            bubble.style.transform = `rotate(${angle}deg)`;
        });
        
        requestAnimationFrame(updateBubblePositions);
    }
    
    // Run the engine and start updating positions
    Engine.run(engine);
    updateBubblePositions();
    
    // Handle window resize
    window.addEventListener('resize', () => {
        // Get new container dimensions
        const newContainerRect = skillsContainer.getBoundingClientRect();
        const newWidth = newContainerRect.width;
        const newHeight = newContainerRect.height;
        
        // Update renderer size
        render.options.width = newWidth;
        render.options.height = newHeight;
        render.canvas.width = newWidth;
        render.canvas.height = newHeight;
        
        // Update wall positions
        Body.setPosition(walls[0], { x: newWidth / 2, y: -wallThickness / 2 });
        Body.setPosition(walls[1], { x: newWidth / 2, y: newHeight + wallThickness / 2 });
        Body.setPosition(walls[2], { x: -wallThickness / 2, y: newHeight / 2 });
        Body.setPosition(walls[3], { x: newWidth + wallThickness / 2, y: newHeight / 2 });
        
        // Scale body positions
        bubbleBodies.forEach(body => {
            const scaleX = newWidth / containerWidth;
            const scaleY = newHeight / containerHeight;
            
            Body.setPosition(body, {
                x: body.position.x * scaleX,
                y: body.position.y * scaleY
            });
        });
        
        // Update container dimensions
        containerWidth = newWidth;
        containerHeight = newHeight;
    });
    
    // Export functions for external control
    window.skillPhysics = {
        applyExplosion: () => {
            bubbleBodies.forEach(body => {
                const forceX = (Math.random() - 0.5) * 0.1;
                const forceY = (Math.random() - 0.5) * 0.1;
                Body.applyForce(body, body.position, { x: forceX, y: forceY });
            });
        },
        resetPositions: () => {
            bubbleBodies.forEach(body => {
                const randomX = Math.random() * (containerWidth - 100) + 50;
                const randomY = Math.random() * (containerHeight - 100) + 50;
                Body.setPosition(body, { x: randomX, y: randomY });
                Body.setVelocity(body, { x: 0, y: 0 });
            });
        }
    };
}

// Particle Effect for Scroll
document.addEventListener('DOMContentLoaded', () => {
    // Create canvas for particles
    const canvas = document.createElement('canvas');
    canvas.id = 'particle-canvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '0';
    document.body.appendChild(canvas);
    
    // Initialize canvas
    const ctx = canvas.getContext('2d');
    let width = window.innerWidth;
    let height = window.innerHeight;
    
    // Set canvas size
    canvas.width = width;
    canvas.height = height;
    
    // Particle class
    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.size = Math.random() * 3 + 1;
            this.speedX = Math.random() * 2 - 1;
            this.speedY = Math.random() * 2 - 1;
            this.color = `rgba(255, 122, 0, ${Math.random() * 0.2 + 0.1})`;
        }
        
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            
            // Boundary check
            if (this.x < 0 || this.x > width) this.speedX *= -1;
            if (this.y < 0 || this.y > height) this.speedY *= -1;
        }
        
        draw() {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // Create particles
    const particles = [];
    const particleCount = 50;
    
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
    
    // Mouse influence
    let mouseX = 0;
    let mouseY = 0;
    let scrollY = 0;
    
    document.addEventListener('mousemove', e => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });
    
    window.addEventListener('scroll', () => {
        scrollY = window.scrollY;
    });
    
    // Animation loop
    function animate() {
        ctx.clearRect(0, 0, width, height);
        
        // Update and draw particles
        particles.forEach(particle => {
            // Add mouse influence
            const dx = particle.x - mouseX;
            const dy = particle.y - mouseY + scrollY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 100) {
                const angle = Math.atan2(dy, dx);
                const force = (100 - distance) / 500;
                
                particle.speedX += Math.cos(angle) * force;
                particle.speedY += Math.sin(angle) * force;
            }
            
            // Add scroll influence
            particle.y += scrollY * 0.01;
            
            // Apply speed limits
            particle.speedX = Math.max(-2, Math.min(2, particle.speedX));
            particle.speedY = Math.max(-2, Math.min(2, particle.speedY));
            
            // Apply friction
            particle.speedX *= 0.98;
            particle.speedY *= 0.98;
            
            // Update and draw
            particle.update();
            particle.draw();
        });
        
        requestAnimationFrame(animate);
    }
    
    // Handle window resize
    window.addEventListener('resize', () => {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    });
    
    // Start animation
    animate();
});