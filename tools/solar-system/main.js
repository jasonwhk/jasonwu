const VIEWPORT_ID = 'viewport';
const STATUS_ID = 'status';
const TOGGLE_VISIBILITY_SCALE_ID = 'toggleVisibilityScale';
const TOGGLE_LABELS_ID = 'toggleLabels';

const ORBIT_SEGMENTS = 512;

function clampDevicePixelRatio(dpr) {
  if (!Number.isFinite(dpr) || dpr <= 0) return 1;
  return Math.min(2, Math.max(1, dpr));
}

function setStatus(text) {
  const statusEl = document.getElementById(STATUS_ID);
  if (statusEl) statusEl.textContent = text;
}

function clampOrbitSegments(segments) {
  if (!Number.isFinite(segments)) return 256;
  return Math.max(64, Math.min(2048, Math.floor(segments)));
}

function createCanvas(viewportEl) {
  const canvas = document.createElement('canvas');
  canvas.className = 'ss-canvas';
  canvas.setAttribute('aria-label', 'Solar System 3D canvas');
  viewportEl.appendChild(canvas);
  return canvas;
}

function preventScrollOnCanvas(canvas) {
  canvas.style.touchAction = 'none';
  canvas.addEventListener(
    'touchmove',
    (event) => {
      event.preventDefault();
    },
    { passive: false },
  );
}

function getViewportSize(viewportEl) {
  const rect = viewportEl.getBoundingClientRect();
  return {
    width: Math.max(1, Math.floor(rect.width)),
    height: Math.max(1, Math.floor(rect.height)),
  };
}

async function createThreeApp({ viewportEl, canvas }) {
  const THREE = await import('https://esm.sh/three@0.160.0');
  const { OrbitControls } = await import('https://esm.sh/three@0.160.0/examples/jsm/controls/OrbitControls.js');
  const { CSS2DRenderer, CSS2DObject } = await import(
    'https://esm.sh/three@0.160.0/examples/jsm/renderers/CSS2DRenderer.js',
  );

  const TAU = Math.PI * 2;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  });
  renderer.setClearColor(0x05060a, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(clampDevicePixelRatio(window.devicePixelRatio));

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(50, 1, 0.01, 2000);
  camera.position.set(0, 12, 45);

  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient);

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.0);
  keyLight.position.set(10, 12, 8);
  scene.add(keyLight);

  const sunGeo = new THREE.SphereGeometry(0.24, 48, 24);
  const sunMat = new THREE.MeshStandardMaterial({
    color: 0xffcc44,
    emissive: 0x331a00,
    roughness: 0.55,
    metalness: 0.0,
  });
  const sunMesh = new THREE.Mesh(sunGeo, sunMat);
  scene.add(sunMesh);

  const labelRenderer = new CSS2DRenderer();
  labelRenderer.domElement.className = 'ss-label-layer';
  viewportEl.appendChild(labelRenderer.domElement);

  const PLANETS = [
    { name: 'Mercury', color: 0xb8b8b8, aAU: 0.387098, e: 0.205630, radius: 0.03 },
    { name: 'Venus', color: 0xd6c08d, aAU: 0.723332, e: 0.006772, radius: 0.06 },
    { name: 'Earth', color: 0x3f74ff, aAU: 1.0, e: 0.0167086, radius: 0.06 },
    { name: 'Mars', color: 0xc56c3a, aAU: 1.523679, e: 0.0934, radius: 0.04 },
    { name: 'Jupiter', color: 0xd7b48a, aAU: 5.2044, e: 0.0489, radius: 0.22 },
    { name: 'Saturn', color: 0xe3cf9b, aAU: 9.5826, e: 0.0565, radius: 0.19 },
    { name: 'Uranus', color: 0x7bd3dd, aAU: 19.2184, e: 0.0463, radius: 0.14 },
    { name: 'Neptune', color: 0x3d64ff, aAU: 30.1104, e: 0.009, radius: 0.14 },
  ];

  function getOrbitRadiusAU({ aAU, e }, theta) {
    const ecc = Math.max(0, Math.min(0.99, Number(e)));
    const a = Math.max(0.0001, Number(aAU));
    const denom = 1 + ecc * Math.cos(theta);
    if (denom <= 1e-8) return a;
    return (a * (1 - ecc * ecc)) / denom;
  }

  function createOrbitRing({ aAU, e, color }, ringIndex) {
    const segments = clampOrbitSegments(ORBIT_SEGMENTS);
    const positions = new Float32Array(segments * 3);

    for (let i = 0; i < segments; i += 1) {
      const theta = (i / segments) * TAU;
      const r = getOrbitRadiusAU({ aAU, e }, theta);
      const x = r * Math.cos(theta);
      const z = r * Math.sin(theta);
      const base = i * 3;
      positions[base + 0] = x;
      positions[base + 1] = 0;
      positions[base + 2] = z;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const lineColor = new THREE.Color(color).lerp(new THREE.Color(0xffffff), 0.15);
    const material = new THREE.LineBasicMaterial({
      color: lineColor,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });

    const line = new THREE.LineLoop(geometry, material);
    line.position.y = 0.001 * (ringIndex + 1);
    line.renderOrder = 1;

    return { line, geometry, material };
  }

  const orbitsGroup = new THREE.Group();
  orbitsGroup.name = 'Orbits';
  scene.add(orbitsGroup);

  const orbitEntries = [];
  for (let i = 0; i < PLANETS.length; i += 1) {
    const planet = PLANETS[i];
    const orbit = createOrbitRing(planet, i);
    orbitsGroup.add(orbit.line);
    orbitEntries.push(orbit);
  }

  const planetsGroup = new THREE.Group();
  planetsGroup.name = 'Planets';
  scene.add(planetsGroup);

  const planetGeometry = new THREE.SphereGeometry(1, 32, 16);
  const planetEntries = [];

  for (const planet of PLANETS) {
    const material = new THREE.MeshStandardMaterial({
      color: planet.color,
      roughness: 0.85,
      metalness: 0.0,
    });
    const mesh = new THREE.Mesh(planetGeometry, material);
    mesh.position.set(getOrbitRadiusAU(planet, 0), 0, 0);
    mesh.scale.setScalar(planet.radius);
    mesh.name = planet.name;

    const labelEl = document.createElement('div');
    labelEl.className = 'ss-label';
    labelEl.textContent = planet.name;
    const labelObj = new CSS2DObject(labelEl);
    labelObj.position.set(0, 1.4, 0);
    mesh.add(labelObj);

    planetsGroup.add(mesh);
    planetEntries.push({ mesh, material, baseRadius: planet.radius, labelObj });
  }

  const grid = new THREE.GridHelper(60, 60, 0x223366, 0x112244);
  grid.position.y = -2.25;
  grid.material.depthWrite = false;
  scene.add(grid);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.enablePan = true;
  controls.screenSpacePanning = true;
  controls.minDistance = 3;
  controls.maxDistance = 400;
  controls.target.set(0, 0, 0);
  controls.update();

  function resize() {
    renderer.setPixelRatio(clampDevicePixelRatio(window.devicePixelRatio));
    const { width, height } = getViewportSize(viewportEl);
    renderer.setSize(width, height, false);
    labelRenderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  resize();

  let useVisibilityScale = true;
  let labelsVisible = true;

  function applyPlanetScale() {
    const visibilityMultiplier = useVisibilityScale ? 4.5 : 1;
    for (const entry of planetEntries) {
      entry.mesh.scale.setScalar(entry.baseRadius * visibilityMultiplier);
      entry.labelObj.position.set(0, entry.mesh.scale.y + 0.4, 0);
    }
  }

  function applyLabelsVisible() {
    for (const entry of planetEntries) {
      entry.labelObj.visible = labelsVisible;
    }
  }

  applyPlanetScale();
  applyLabelsVisible();

  let rafId = 0;
  function frame() {
    controls.update();
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
    rafId = window.requestAnimationFrame(frame);
  }

  rafId = window.requestAnimationFrame(frame);

  return {
    resize,
    setVisibilityScale(enabled) {
      useVisibilityScale = Boolean(enabled);
      applyPlanetScale();
    },
    setLabelsVisible(visible) {
      labelsVisible = Boolean(visible);
      applyLabelsVisible();
    },
    dispose() {
      window.cancelAnimationFrame(rafId);
      controls.dispose();
      renderer.dispose();
      sunGeo.dispose();
      sunMat.dispose();
      planetGeometry.dispose();
      for (const entry of planetEntries) {
        entry.material.dispose();
        if (entry.labelObj?.element?.remove) entry.labelObj.element.remove();
      }
      planetsGroup.removeFromParent();
      labelRenderer.domElement.remove();
      grid.geometry.dispose();
      const gridMaterials = Array.isArray(grid.material) ? grid.material : [grid.material];
      for (const material of gridMaterials) material.dispose();
      for (const orbit of orbitEntries) {
        orbit.geometry.dispose();
        orbit.material.dispose();
      }
      orbitsGroup.removeFromParent();
    },
  };
}

function getToggle(id) {
  const el = document.getElementById(id);
  if (!el) return null;
  if (!(el instanceof HTMLInputElement)) return null;
  if (el.type !== 'checkbox') return null;
  return el;
}

function init() {
  const viewportEl = document.getElementById(VIEWPORT_ID);
  if (!viewportEl) {
    setStatus('Error: missing viewport');
    return;
  }

  const canvas = createCanvas(viewportEl);
  preventScrollOnCanvas(canvas);

  setStatus('Loading Three.js…');
  createThreeApp({ viewportEl, canvas })
    .then((app) => {
      setStatus('Ready');

      const visibilityToggle = getToggle(TOGGLE_VISIBILITY_SCALE_ID);
      if (visibilityToggle) {
        app.setVisibilityScale(visibilityToggle.checked);
        visibilityToggle.addEventListener('change', () => app.setVisibilityScale(visibilityToggle.checked));
      }

      const labelsToggle = getToggle(TOGGLE_LABELS_ID);
      if (labelsToggle) {
        app.setLabelsVisible(labelsToggle.checked);
        labelsToggle.addEventListener('change', () => app.setLabelsVisible(labelsToggle.checked));
      }

      if (typeof ResizeObserver !== 'undefined') {
        const ro = new ResizeObserver(() => app.resize());
        ro.observe(viewportEl);
      } else {
        window.addEventListener('resize', () => app.resize(), { passive: true });
      }
    })
    .catch((error) => {
      setStatus('Error: WebGL unavailable or blocked.');
      console.error(error);
    });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
