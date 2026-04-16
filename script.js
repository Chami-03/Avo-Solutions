const menuToggle = document.getElementById("menu-toggle");
const navLinks = document.getElementById("nav-links");
const navBackdrop = document.getElementById("nav-backdrop");
const introSplash = document.getElementById("intro-splash");
const navAnchors = document.querySelectorAll('a[href^="#"]');
const year = document.getElementById("year");
const root = document.documentElement;
const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const mobileBreakpoint = window.matchMedia("(max-width: 768px)");

function getScrollTopForTarget(target) {
  const header = document.querySelector(".site-header");
  const headerHeight = header ? header.offsetHeight : 0;
  const extraOffset = window.innerWidth <= 768 ? 10 : 14;
  return Math.max(target.getBoundingClientRect().top + window.scrollY - headerHeight - extraOffset, 0);
}

function scrollToTarget(target, behavior = "smooth") {
  if (!target) return;
  window.scrollTo({ top: getScrollTopForTarget(target), behavior });
}

function initIntroSplash() {
  if (!introSplash) return;
  const hideDelay = prefersReducedMotion ? 400 : 1600;

  window.setTimeout(() => {
    introSplash.classList.add("hidden");
  }, hideDelay);
}

initIntroSplash();

if (year) {
  year.textContent = new Date().getFullYear();
}

function setMobileMenuState(isOpen) {
  if (!menuToggle || !navLinks) return;
  menuToggle.classList.toggle("active", isOpen);
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  navLinks.classList.toggle("active", isOpen);
  navLinks.setAttribute("aria-hidden", String(!isOpen));
  document.body.classList.toggle("menu-open", isOpen);

  if (navBackdrop) {
    navBackdrop.classList.toggle("active", isOpen);
    navBackdrop.setAttribute("aria-hidden", String(!isOpen));
  }
}

function closeMobileMenu() {
  setMobileMenuState(false);
}

closeMobileMenu();
window.addEventListener("pageshow", closeMobileMenu);

if (menuToggle && navLinks) {
  const toggleMobileMenu = () => {
    const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
    setMobileMenuState(!isExpanded);
  };

  menuToggle.addEventListener("click", toggleMobileMenu);
  menuToggle.addEventListener("touchstart", (event) => {
    event.preventDefault();
    toggleMobileMenu();
  }, { passive: false });
}

const handleBreakpointChange = (event) => {
  if (!event.matches) {
    closeMobileMenu();
  }
};

if (typeof mobileBreakpoint.addEventListener === "function") {
  mobileBreakpoint.addEventListener("change", handleBreakpointChange);
} else if (typeof mobileBreakpoint.addListener === "function") {
  mobileBreakpoint.addListener(handleBreakpointChange);
}

if (navBackdrop) {
  navBackdrop.addEventListener("click", closeMobileMenu);
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeMobileMenu();
  }
});

navAnchors.forEach((anchor) => {
  anchor.addEventListener("click", (event) => {
    const targetId = anchor.getAttribute("href");
    if (!targetId || targetId === "#") return;

    if (targetId === "#home") {
      event.preventDefault();
      closeMobileMenu();
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
      return;
    }

    const target = document.querySelector(targetId);
    if (!target) return;

    event.preventDefault();
    closeMobileMenu();
    window.requestAnimationFrame(() => {
      scrollToTarget(target, "smooth");
    });
    if (window.history && typeof window.history.replaceState === "function") {
      window.history.replaceState(null, "", targetId);
    }
  });
});

window.addEventListener("load", () => {
  const navEntry = performance.getEntriesByType("navigation")[0];
  const isReload = navEntry && navEntry.type === "reload";

  if (isReload) {
    if (window.history && typeof window.history.replaceState === "function") {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
    window.scrollTo({ top: 0, behavior: "auto" });
    return;
  }

  if (!window.location.hash || window.location.hash === "#home") return;
  const target = document.querySelector(window.location.hash);
  if (!target) return;
  scrollToTarget(target, "auto");
});

function updateAccentHue() {
  const maxScrollable = Math.max(document.body.scrollHeight - window.innerHeight, 1);
  const progress = window.scrollY / maxScrollable;
  const hour = new Date().getHours();
  const timeOffset = hour < 12 ? -8 : hour < 18 ? 0 : 10;
  const hue = 164 + Math.round(progress * 28) + timeOffset;
  root.style.setProperty("--accent-hue", String(Math.min(198, Math.max(156, hue))));
}

updateAccentHue();
window.addEventListener("scroll", updateAccentHue, { passive: true });

const revealItems = document.querySelectorAll(".reveal");
revealItems.forEach((item) => {
  const delay = item.getAttribute("data-reveal-delay") || "0";
  item.style.setProperty("--delay", `${delay}ms`);
});

if ("IntersectionObserver" in window && revealItems.length) {
  const observer = new IntersectionObserver(
    (entries, currentObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("visible");
        currentObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.16 }
  );

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("visible"));
}

const tiltCards = document.querySelectorAll("[data-tilt]");
if (!prefersReducedMotion) {
  const applyTilt = (card, clientX, clientY) => {
    const rect = card.getBoundingClientRect();
    const px = (clientX - rect.left) / rect.width;
    const py = (clientY - rect.top) / rect.height;
    const rotateY = (px - 0.5) * 8;
    const rotateX = (0.5 - py) * 7;
    card.style.transform = `perspective(900px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-4px)`;
  };

  const resetTilt = (card) => {
    card.style.transform = "";
  };

  tiltCards.forEach((card) => {
    if (!isCoarsePointer) {
      card.addEventListener("mousemove", (event) => {
        applyTilt(card, event.clientX, event.clientY);
      });

      card.addEventListener("mouseleave", () => {
        resetTilt(card);
      });
      return;
    }

    card.addEventListener("touchstart", (event) => {
      if (!event.touches || !event.touches.length) return;
      const touch = event.touches[0];
      applyTilt(card, touch.clientX, touch.clientY);
    }, { passive: true });

    card.addEventListener("touchmove", (event) => {
      if (!event.touches || !event.touches.length) return;
      const touch = event.touches[0];
      applyTilt(card, touch.clientX, touch.clientY);
    }, { passive: true });

    card.addEventListener("touchend", () => {
      resetTilt(card);
    }, { passive: true });

    card.addEventListener("touchcancel", () => {
      resetTilt(card);
    }, { passive: true });
  });
}

function initBackgroundDotsScene() {
  if (!window.THREE) return;

  const canvas = document.getElementById("bg-dots-canvas");
  if (!canvas) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 150);
  camera.position.set(0, 0, 22);

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isCoarsePointer ? 1.1 : 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.setClearColor(0x000000, 0);

  const dotCount = isCoarsePointer ? 260 : 520;
  const spread = isCoarsePointer ? 16 : 20;
  const positions = new Float32Array(dotCount * 3);
  const basePositions = new Float32Array(dotCount * 3);
  const velocities = new Float32Array(dotCount * 3);

  for (let i = 0; i < dotCount; i += 1) {
    const i3 = i * 3;
    const x = (Math.random() - 0.5) * spread * 2;
    const y = (Math.random() - 0.5) * spread * 2;
    const z = (Math.random() - 0.5) * spread;

    positions[i3] = x;
    positions[i3 + 1] = y;
    positions[i3 + 2] = z;

    basePositions[i3] = x;
    basePositions[i3 + 1] = y;
    basePositions[i3 + 2] = z;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: 0x8adfff,
    size: isCoarsePointer ? 0.07 : 0.06,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geometry, material);
  scene.add(points);

  const pointerNdc = new THREE.Vector2(2, 2);
  const raycaster = new THREE.Raycaster();
  const interactionPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const pointerWorld = new THREE.Vector3(999, 999, 0);
  let pointerActive = false;

  const updatePointer = (clientX, clientY) => {
    pointerNdc.x = (clientX / window.innerWidth) * 2 - 1;
    pointerNdc.y = -(clientY / window.innerHeight) * 2 + 1;
    pointerActive = true;
  };

  window.addEventListener("mousemove", (event) => {
    updatePointer(event.clientX, event.clientY);
  });

  window.addEventListener("touchmove", (event) => {
    if (!event.touches || !event.touches.length) return;
    const touch = event.touches[0];
    updatePointer(touch.clientX, touch.clientY);
  }, { passive: true });

  window.addEventListener("mouseout", () => {
    pointerActive = false;
  });

  let rafId = 0;
  const animate = () => {
    raycaster.setFromCamera(pointerNdc, camera);
    if (pointerActive) {
      raycaster.ray.intersectPlane(interactionPlane, pointerWorld);
    }

    const repelRadius = isCoarsePointer ? 2.2 : 2.8;
    const repelRadiusSq = repelRadius * repelRadius;
    const repelForce = isCoarsePointer ? 0.11 : 0.16;

    for (let i = 0; i < dotCount; i += 1) {
      const i3 = i * 3;

      let x = positions[i3];
      let y = positions[i3 + 1];
      let z = positions[i3 + 2];

      let vx = velocities[i3];
      let vy = velocities[i3 + 1];
      let vz = velocities[i3 + 2];

      const bx = basePositions[i3];
      const by = basePositions[i3 + 1];
      const bz = basePositions[i3 + 2];

      vx += (bx - x) * 0.012;
      vy += (by - y) * 0.012;
      vz += (bz - z) * 0.01;

      if (pointerActive) {
        const dx = x - pointerWorld.x;
        const dy = y - pointerWorld.y;
        const distSq = dx * dx + dy * dy;

        if (distSq < repelRadiusSq) {
          const dist = Math.sqrt(distSq) || 0.0001;
          const strength = (1 - distSq / repelRadiusSq) * repelForce;
          vx += (dx / dist) * strength;
          vy += (dy / dist) * strength;
          vz += strength * 0.26;
        }
      }

      vx *= 0.92;
      vy *= 0.92;
      vz *= 0.92;

      x += vx;
      y += vy;
      z += vz;

      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;

      velocities[i3] = vx;
      velocities[i3 + 1] = vy;
      velocities[i3 + 2] = vz;
    }

    points.rotation.y += isCoarsePointer ? 0.00045 : 0.0007;
    points.rotation.x += 0.00018;

    geometry.attributes.position.needsUpdate = true;
    renderer.render(scene, camera);
    rafId = requestAnimationFrame(animate);
  };

  animate();

  const handleResize = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  };

  window.addEventListener("resize", handleResize);

  window.addEventListener("beforeunload", () => {
    cancelAnimationFrame(rafId);
    renderer.dispose();
    geometry.dispose();
    material.dispose();
  });
}

function initWebGlScene() {
  if (!window.THREE || prefersReducedMotion) return;
  const canvas = document.getElementById("webgl-canvas");
  if (!canvas) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
  camera.position.set(0, 0, isCoarsePointer ? 5.8 : 5.2);

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isCoarsePointer ? 1.2 : 1.8));
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);

  const ambient = new THREE.AmbientLight(0xffffff, 0.9);
  scene.add(ambient);

  const point = new THREE.PointLight(0x22d3b4, 1.2, 20);
  point.position.set(3.2, 2.6, 3);
  scene.add(point);

  const coreGeometry = new THREE.IcosahedronGeometry(1.08, isCoarsePointer ? 1 : 2);
  const coreWire = new THREE.WireframeGeometry(coreGeometry);
  const coreMaterial = new THREE.LineBasicMaterial({ color: 0x22d3b4, transparent: true, opacity: 0.95 });
  const coreMesh = new THREE.LineSegments(coreWire, coreMaterial);
  scene.add(coreMesh);

  const orbitGeometry = new THREE.TorusGeometry(1.92, 0.015, 6, isCoarsePointer ? 110 : 180);
  const orbitWire = new THREE.WireframeGeometry(orbitGeometry);
  const orbitMaterial = new THREE.LineBasicMaterial({ color: 0x5ab6ff, transparent: true, opacity: 0.72 });
  const orbitA = new THREE.LineSegments(orbitWire, orbitMaterial);
  orbitA.rotation.x = Math.PI * 0.35;
  orbitA.rotation.y = Math.PI * 0.18;
  scene.add(orbitA);

  const orbitB = new THREE.LineSegments(orbitWire, orbitMaterial.clone());
  orbitB.rotation.x = Math.PI * 0.73;
  orbitB.rotation.z = Math.PI * 0.12;
  orbitB.material.opacity = 0.52;
  scene.add(orbitB);

  const particlesGeometry = new THREE.BufferGeometry();
  const particleCount = isCoarsePointer ? 80 : 140;
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i += 1) {
    const i3 = i * 3;
    const radius = 2.15 + Math.random() * 1.15;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = radius * Math.cos(phi);
    positions[i3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
  }
  particlesGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const particlesMaterial = new THREE.PointsMaterial({
    color: 0x9ce4ff,
    size: 0.026,
    transparent: true,
    opacity: 0.9,
  });
  const particles = new THREE.Points(particlesGeometry, particlesMaterial);
  scene.add(particles);

  let rafId = 0;
  const animate = () => {
    const speed = isCoarsePointer ? 0.72 : 1;
    coreMesh.rotation.x += 0.005 * speed;
    coreMesh.rotation.y += 0.007 * speed;
    orbitA.rotation.z += 0.0036 * speed;
    orbitB.rotation.y -= 0.0031 * speed;
    particles.rotation.y += 0.0018 * speed;
    renderer.render(scene, camera);
    rafId = requestAnimationFrame(animate);
  };

  animate();

  const handleResize = () => {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (!width || !height) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  };

  window.addEventListener("resize", handleResize);

  window.addEventListener("beforeunload", () => {
    cancelAnimationFrame(rafId);
    renderer.dispose();
    coreGeometry.dispose();
    coreWire.dispose();
    coreMaterial.dispose();
    orbitGeometry.dispose();
    orbitWire.dispose();
    orbitMaterial.dispose();
    orbitB.material.dispose();
    particlesGeometry.dispose();
    particlesMaterial.dispose();
  });
}

initBackgroundDotsScene();
initWebGlScene();
