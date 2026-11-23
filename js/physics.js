/**
 * Suyash Tiwari — AI Systems & Infrastructure Portfolio
 * Three.js WebGL Ambient Neural Field (the Matter.js playground lives in js/gravity-lab.js)
 * Equipped with IntersectionObserver performance guards and dynamic resize lifecycle.
 */

document.addEventListener('DOMContentLoaded', () => {
    initThreeBackground();
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
