const VIEWPORT_ID = 'viewport';
const STATUS_ID = 'status';
const TOGGLE_VISIBILITY_SCALE_ID = 'toggleVisibilityScale';
const TOGGLE_LABELS_ID = 'toggleLabels';

function clampDevicePixelRatio(dpr) {
  if (!Number.isFinite(dpr) || dpr <= 0) return 1;
  return Math.min(2, Math.max(1, dpr));
}

function setStatus(text) {
  const statusEl = document.getElementById(STATUS_ID);
  if (statusEl) statusEl.textContent = text;
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
  camera.position.set(0, 8, 26);

  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient);

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.0);
  keyLight.position.set(10, 12, 8);
  scene.add(keyLight);

  const sunGeo = new THREE.SphereGeometry(1.2, 48, 24);
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
    { name: 'Mercury', color: 0xb8b8b8, distance: 2.2, radius: 0.08 },
    { name: 'Venus', color: 0xd6c08d, distance: 3.3, radius: 0.14 },
    { name: 'Earth', color: 0x3f74ff, distance: 4.5, radius: 0.15 },
    { name: 'Mars', color: 0xc56c3a, distance: 5.7, radius: 0.11 },
    { name: 'Jupiter', color: 0xd7b48a, distance: 8.7, radius: 0.55 },
    { name: 'Saturn', color: 0xe3cf9b, distance: 11.6, radius: 0.47 },
    { name: 'Uranus', color: 0x7bd3dd, distance: 15.2, radius: 0.33 },
    { name: 'Neptune', color: 0x3d64ff, distance: 18.4, radius: 0.32 },
  ];

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
    mesh.position.set(planet.distance, 0, 0);
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
