const VIEWPORT_ID = 'viewport';
const STATUS_ID = 'status';

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
  const THREE = await import('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js');
  const { OrbitControls } = await import(
    'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js'
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
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  resize();

  let rafId = 0;
  function frame() {
    controls.update();
    renderer.render(scene, camera);
    rafId = window.requestAnimationFrame(frame);
  }

  rafId = window.requestAnimationFrame(frame);

  return {
    resize,
    dispose() {
      window.cancelAnimationFrame(rafId);
      controls.dispose();
      renderer.dispose();
      sunGeo.dispose();
      sunMat.dispose();
      grid.geometry.dispose();
      const gridMaterials = Array.isArray(grid.material) ? grid.material : [grid.material];
      for (const material of gridMaterials) material.dispose();
    },
  };
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
