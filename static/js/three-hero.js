/**
 * BuyWise AI — Three.js Hero (three-hero.js)
 * Creates a premium 3D interactive scene in the hero canvas.
 * 
 * Scene composition:
 *  - Icosahedron geometry with metallic MeshStandardMaterial
 *  - Wireframe overlay for the geometric grid look
 *  - Particle field (Points geometry) surrounding the crystal
 *  - Ambient + point + rim lighting setup
 *  - Mouse-parallax rotation (lerped for 60fps smoothness)
 *  - GSAP entrance animation
 *  - Graceful mobile degradation
 */

(function () {
  'use strict';

  // Don't run on mobile — canvas is hidden via CSS, avoid wasted GPU
  if (window.innerWidth < 1024) return;

  const canvas = document.getElementById('three-canvas');
  if (!canvas) return;

  // Wait for Three.js to load
  function waitForThree(callback, attempts = 0) {
    if (window.THREE) {
      callback();
    } else if (attempts < 30) {
      setTimeout(() => waitForThree(callback, attempts + 1), 100);
    }
  }

  waitForThree(initScene);

  function initScene() {
    const THREE = window.THREE;

    // ── Renderer ──────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    // ── Scene & Camera ────────────────────────────────────────────────────────
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      45,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 5);

    // ── Lighting ──────────────────────────────────────────────────────────────
    const ambientLight = new THREE.AmbientLight(0x6C63FF, 0.3);
    scene.add(ambientLight);

    // Primary light — violet
    const light1 = new THREE.PointLight(0x7B73FF, 4, 15);
    light1.position.set(3, 3, 3);
    scene.add(light1);

    // Secondary light — teal/emerald
    const light2 = new THREE.PointLight(0x00D4AA, 3, 12);
    light2.position.set(-3, -2, 2);
    scene.add(light2);

    // Rim light — white
    const light3 = new THREE.PointLight(0xffffff, 1.5, 10);
    light3.position.set(0, 5, -3);
    scene.add(light3);

    // ── Main Crystal Icosahedron ──────────────────────────────────────────────
    const icosaGeo = new THREE.IcosahedronGeometry(1.4, 1);

    const icosaMat = new THREE.MeshStandardMaterial({
      color: 0x6C63FF,
      metalness: 0.8,
      roughness: 0.15,
      emissive: 0x1a1640,
      emissiveIntensity: 0.3,
    });

    const icosa = new THREE.Mesh(icosaGeo, icosaMat);
    scene.add(icosa);

    // ── Wireframe Overlay ─────────────────────────────────────────────────────
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x9490FF,
      wireframe: true,
      transparent: true,
      opacity: 0.25,
    });

    const wireGeo = new THREE.IcosahedronGeometry(1.42, 1);
    const wireMesh = new THREE.Mesh(wireGeo, wireMat);
    scene.add(wireMesh);

    // ── Inner Glowing Core ────────────────────────────────────────────────────
    const coreGeo = new THREE.IcosahedronGeometry(0.6, 2);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x00D4AA,
      metalness: 0.5,
      roughness: 0.1,
      emissive: 0x00D4AA,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.7,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    scene.add(core);

    // ── Outer Ring (Torus) ────────────────────────────────────────────────────
    const ringGeo = new THREE.TorusGeometry(2.2, 0.015, 8, 80);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x6C63FF,
      transparent: true,
      opacity: 0.35,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    scene.add(ring);

    const ring2Geo = new THREE.TorusGeometry(2.6, 0.01, 8, 80);
    const ring2 = new THREE.Mesh(ring2Geo, new THREE.MeshBasicMaterial({
      color: 0x00D4AA,
      transparent: true,
      opacity: 0.2,
    }));
    ring2.rotation.x = Math.PI / 3;
    ring2.rotation.y = Math.PI / 5;
    scene.add(ring2);

    // ── Particle Field ────────────────────────────────────────────────────────
    const PARTICLE_COUNT = 800;
    const positions = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Place particles in a sphere shell
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 2.5 + Math.random() * 2.5;

      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const particleMat = new THREE.PointsMaterial({
      color: 0x8B95FF,
      size: 0.025,
      transparent: true,
      opacity: 0.7,
      sizeAttenuation: true,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // ── Group everything for parallax rotation ─────────────────────────────
    const group = new THREE.Group();
    group.add(icosa, wireMesh, core, ring, ring2, particles);
    scene.add(group);

    // ── Entrance: start hidden, animate in via scale ───────────────────────
    group.scale.setScalar(0);

    // Use GSAP if available, else plain JS fallback
    const delay = 0.3;
    if (window.gsap) {
      gsap.to(group.scale, {
        x: 1, y: 1, z: 1,
        duration: 1.4,
        delay,
        ease: 'back.out(1.2)',
      });
    } else {
      // Fallback: simple lerp entrance
      let entranceProgress = 0;
      const entranceStart = performance.now() + delay * 1000;
      function lerpEntrance(now) {
        if (now < entranceStart) { requestAnimationFrame(lerpEntrance); return; }
        const elapsed = now - entranceStart;
        entranceProgress = Math.min(elapsed / 1400, 1);
        const eased = 1 - Math.pow(1 - entranceProgress, 3);
        group.scale.setScalar(eased);
        if (entranceProgress < 1) requestAnimationFrame(lerpEntrance);
      }
      requestAnimationFrame(lerpEntrance);
    }

    // ── Mouse Parallax ────────────────────────────────────────────────────────
    const mouse = { x: 0, y: 0 };
    const targetRotation = { x: 0, y: 0 };
    const currentRotation = { x: 0, y: 0 };

    window.addEventListener('mousemove', (e) => {
      // Normalize to [-1, 1]
      targetRotation.x = (e.clientY / window.innerHeight - 0.5) * 0.8;
      targetRotation.y = (e.clientX / window.innerWidth  - 0.5) * 1.2;
    });

    // ── Resize Handler ────────────────────────────────────────────────────────
    function onResize() {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    }
    window.addEventListener('resize', onResize, { passive: true });

    // ── Animation Loop ────────────────────────────────────────────────────────
    let frameId;
    const clock = new THREE.Clock();

    function animate() {
      frameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Smooth lerp toward mouse target (0.04 = gentle follow)
      const lerpFactor = 0.04;
      currentRotation.x += (targetRotation.x - currentRotation.x) * lerpFactor;
      currentRotation.y += (targetRotation.y - currentRotation.y) * lerpFactor;

      // Apply mouse parallax + auto-rotation
      group.rotation.x = currentRotation.x + Math.sin(elapsed * 0.3) * 0.05;
      group.rotation.y = currentRotation.y + elapsed * 0.18;

      // Inner core counter-rotation for visual interest
      core.rotation.y = -elapsed * 0.35;
      core.rotation.z = elapsed * 0.2;

      // Rings orbit
      ring.rotation.z  = elapsed * 0.25;
      ring2.rotation.y = elapsed * 0.15;
      ring2.rotation.x += 0.003;

      // Particle drift
      particles.rotation.y = elapsed * 0.05;
      particles.rotation.x = elapsed * 0.02;

      // Pulsing emissive intensity
      icosaMat.emissiveIntensity = 0.3 + Math.sin(elapsed * 1.5) * 0.1;
      coreMat.emissiveIntensity  = 0.6 + Math.sin(elapsed * 2.0) * 0.2;

      // Oscillating lights
      light1.intensity = 4 + Math.sin(elapsed * 1.2) * 0.8;
      light2.intensity = 3 + Math.sin(elapsed * 0.8 + 1) * 0.5;

      renderer.render(scene, camera);
    }

    animate();

    // Pause rendering when tab is hidden (perf)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        cancelAnimationFrame(frameId);
      } else {
        animate();
      }
    });
  }

})();
