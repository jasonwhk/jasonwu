const VIEWPORT_ID = 'viewport';
const STATUS_ID = 'status';
const TOGGLE_VISIBILITY_SCALE_ID = 'toggleVisibilityScale';
const TOGGLE_LABELS_ID = 'toggleLabels';
const BTN_NOW_ID = 'btnNow';
const BTN_PLAY_PAUSE_ID = 'btnPlayPause';
const SPEED_SELECT_ID = 'speedSelect';
const TIME_OFFSET_SLIDER_ID = 'timeOffsetDays';
const TIME_OFFSET_LABEL_ID = 'timeOffsetLabel';

const ORBIT_SEGMENTS = 512;

const ORBITAL_ELEMENTS_APPROX = {
  Mercury: {
    a0: 0.38709927,
    aRate: 0.00000037,
    e0: 0.20563593,
    eRate: 0.00001906,
    i0: 7.00497902,
    iRate: -0.00594749,
    L0: 252.2503235,
    LRate: 149472.67411175,
    longPeri0: 77.45779628,
    longPeriRate: 0.16047689,
    longNode0: 48.33076593,
    longNodeRate: -0.12534081,
  },
  Venus: {
    a0: 0.72333566,
    aRate: 0.0000039,
    e0: 0.00677672,
    eRate: -0.00004107,
    i0: 3.39467605,
    iRate: -0.0007889,
    L0: 181.9790995,
    LRate: 58517.81538729,
    longPeri0: 131.60246718,
    longPeriRate: 0.00268329,
    longNode0: 76.67984255,
    longNodeRate: -0.27769418,
  },
  Earth: {
    a0: 1.00000261,
    aRate: 0.00000562,
    e0: 0.01671123,
    eRate: -0.00004392,
    i0: -0.00001531,
    iRate: -0.01294668,
    L0: 100.46457166,
    LRate: 35999.37244981,
    longPeri0: 102.93768193,
    longPeriRate: 0.32327364,
    longNode0: 0,
    longNodeRate: 0,
  },
  Mars: {
    a0: 1.52371034,
    aRate: 0.00001847,
    e0: 0.0933941,
    eRate: 0.00007882,
    i0: 1.84969142,
    iRate: -0.00813131,
    L0: -4.55343205,
    LRate: 19140.30268499,
    longPeri0: -23.94362959,
    longPeriRate: 0.44441088,
    longNode0: 49.55953891,
    longNodeRate: -0.29257343,
  },
  Jupiter: {
    a0: 5.202887,
    aRate: -0.00011607,
    e0: 0.04838624,
    eRate: -0.00013253,
    i0: 1.30439695,
    iRate: -0.00183714,
    L0: 34.39644051,
    LRate: 3034.74612775,
    longPeri0: 14.72847983,
    longPeriRate: 0.21252668,
    longNode0: 100.47390909,
    longNodeRate: 0.20469106,
  },
  Saturn: {
    a0: 9.53667594,
    aRate: -0.0012506,
    e0: 0.05386179,
    eRate: -0.00050991,
    i0: 2.48599187,
    iRate: 0.00193609,
    L0: 49.95424423,
    LRate: 1222.49362201,
    longPeri0: 92.59887831,
    longPeriRate: -0.41897216,
    longNode0: 113.66242448,
    longNodeRate: -0.28867794,
  },
  Uranus: {
    a0: 19.18916464,
    aRate: -0.00196176,
    e0: 0.04725744,
    eRate: -0.00004397,
    i0: 0.77263783,
    iRate: -0.00242939,
    L0: 313.23810451,
    LRate: 428.48202785,
    longPeri0: 170.9542763,
    longPeriRate: 0.40805281,
    longNode0: 74.01692503,
    longNodeRate: 0.04240589,
  },
  Neptune: {
    a0: 30.06992276,
    aRate: 0.00026291,
    e0: 0.00859048,
    eRate: 0.00005105,
    i0: 1.77004347,
    iRate: 0.00035372,
    L0: -55.12002969,
    LRate: 218.45945325,
    longPeri0: 44.96476227,
    longPeriRate: -0.32241464,
    longNode0: 131.78422574,
    longNodeRate: -0.00508664,
  },
};

function clampDevicePixelRatio(dpr) {
  if (!Number.isFinite(dpr) || dpr <= 0) return 1;
  return Math.min(2, Math.max(1, dpr));
}

function degreesToRadians(deg) {
  return (Number(deg) * Math.PI) / 180;
}

function normalizeDegrees(deg) {
  if (!Number.isFinite(deg)) return 0;
  const mod = deg % 360;
  return mod < 0 ? mod + 360 : mod;
}

function normalizeRadians(rad) {
  if (!Number.isFinite(rad)) return 0;
  const tau = Math.PI * 2;
  const mod = rad % tau;
  return mod < -Math.PI ? mod + tau : mod > Math.PI ? mod - tau : mod;
}

function dateToJulianDay(date) {
  const ms = date instanceof Date ? date.getTime() : Date.now();
  return ms / 86400000 + 2440587.5;
}

function centuriesSinceJ2000(jd) {
  return (jd - 2451545.0) / 36525.0;
}

function solveKeplerEquation(M, e) {
  const ecc = Math.max(0, Math.min(0.999999, Number(e)));
  const meanAnomaly = normalizeRadians(Number(M));

  if (ecc < 1e-8) return meanAnomaly;

  let E = ecc < 0.8 ? meanAnomaly : Math.PI;
  for (let i = 0; i < 12; i += 1) {
    const f = E - ecc * Math.sin(E) - meanAnomaly;
    const fp = 1 - ecc * Math.cos(E);
    const step = fp !== 0 ? f / fp : 0;
    E -= step;
    if (Math.abs(step) < 1e-12) break;
  }
  return E;
}

function orbitalElementsAtEpoch(planetName, jd) {
  const elements = ORBITAL_ELEMENTS_APPROX[planetName];
  if (!elements) return null;

  const T = centuriesSinceJ2000(jd);

  const a = elements.a0 + elements.aRate * T;
  const e = elements.e0 + elements.eRate * T;
  const i = degreesToRadians(elements.i0 + elements.iRate * T);
  const longPeri = normalizeDegrees(elements.longPeri0 + elements.longPeriRate * T);
  const longNode = normalizeDegrees(elements.longNode0 + elements.longNodeRate * T);

  const omega = degreesToRadians(normalizeDegrees(longPeri - longNode));
  const Omega = degreesToRadians(longNode);

  return { a, e, i, omega, Omega };
}

function computeHeliocentricEclipticXYZ_AU(planetName, jd) {
  const elements = ORBITAL_ELEMENTS_APPROX[planetName];
  if (!elements) return { x: 0, y: 0, z: 0, rAU: 0 };

  const T = centuriesSinceJ2000(jd);

  const a = elements.a0 + elements.aRate * T;
  const e = elements.e0 + elements.eRate * T;
  const i = degreesToRadians(elements.i0 + elements.iRate * T);
  const L = normalizeDegrees(elements.L0 + elements.LRate * T);
  const longPeri = normalizeDegrees(elements.longPeri0 + elements.longPeriRate * T);
  const longNode = normalizeDegrees(elements.longNode0 + elements.longNodeRate * T);

  const M = degreesToRadians(normalizeDegrees(L - longPeri));
  const E = solveKeplerEquation(M, e);

  const rAU = a * (1 - e * Math.cos(E));
  const sqrtOneMinusESq = Math.sqrt(Math.max(0, 1 - e * e));
  const sinNu = (sqrtOneMinusESq * Math.sin(E)) / Math.max(1e-12, 1 - e * Math.cos(E));
  const cosNu = (Math.cos(E) - e) / Math.max(1e-12, 1 - e * Math.cos(E));
  const nu = Math.atan2(sinNu, cosNu);

  const omega = degreesToRadians(normalizeDegrees(longPeri - longNode));
  const Omega = degreesToRadians(longNode);

  const cosOmega = Math.cos(Omega);
  const sinOmega = Math.sin(Omega);
  const cosI = Math.cos(i);
  const sinI = Math.sin(i);

  const arg = omega + nu;
  const cosArg = Math.cos(arg);
  const sinArg = Math.sin(arg);

  const X = rAU * (cosOmega * cosArg - sinOmega * sinArg * cosI);
  const Y = rAU * (sinOmega * cosArg + cosOmega * sinArg * cosI);
  const Z = rAU * (sinArg * sinI);

  return { x: X, y: Y, z: Z, rAU };
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

  function getOrbitRadiusFromElementsAU({ a, e }, nu) {
    const ecc = Math.max(0, Math.min(0.999999, Number(e)));
    const semiMajor = Math.max(0.0001, Number(a));
    const denom = 1 + ecc * Math.cos(nu);
    if (denom <= 1e-12) return semiMajor;
    return (semiMajor * (1 - ecc * ecc)) / denom;
  }

  function createOrbitRing(planet, epochJd) {
    const segments = clampOrbitSegments(ORBIT_SEGMENTS);
    const positions = new Float32Array(segments * 3);

    const frame = orbitalElementsAtEpoch(planet.name, epochJd);
    const a = frame?.a ?? planet.aAU;
    const e = frame?.e ?? planet.e;
    const inclination = frame?.i ?? 0;
    const omega = frame?.omega ?? 0;
    const Omega = frame?.Omega ?? 0;

    const cosOmega = Math.cos(Omega);
    const sinOmega = Math.sin(Omega);
    const cosI = Math.cos(inclination);
    const sinI = Math.sin(inclination);

    for (let i = 0; i < segments; i += 1) {
      const nu = (i / segments) * TAU;
      const r = getOrbitRadiusFromElementsAU({ a, e }, nu);

      const arg = omega + nu;
      const cosArg = Math.cos(arg);
      const sinArg = Math.sin(arg);

      const X = r * (cosOmega * cosArg - sinOmega * sinArg * cosI);
      const Y = r * (sinOmega * cosArg + cosOmega * sinArg * cosI);
      const Z = r * (sinArg * sinI);

      const base = i * 3;
      positions[base + 0] = X;
      positions[base + 1] = Z;
      positions[base + 2] = Y;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const lineColor = new THREE.Color(planet.color).lerp(new THREE.Color(0xffffff), 0.15);
    const material = new THREE.LineBasicMaterial({
      color: lineColor,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });

    const line = new THREE.LineLoop(geometry, material);
    line.renderOrder = 1;

    return { line, geometry, material };
  }

  const orbitsGroup = new THREE.Group();
  orbitsGroup.name = 'Orbits';
  scene.add(orbitsGroup);

  const orbitEntries = [];
  const orbitEpochJd = dateToJulianDay(new Date());
  for (let i = 0; i < PLANETS.length; i += 1) {
    const planet = PLANETS[i];
    const orbit = createOrbitRing(planet, orbitEpochJd);
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
    planetEntries.push({ mesh, material, baseRadius: planet.radius, labelObj, name: planet.name });
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

  function updatePlanetPositions(jd) {
    for (const entry of planetEntries) {
      const pos = computeHeliocentricEclipticXYZ_AU(entry.name, jd);
      entry.mesh.position.set(pos.x, pos.z, pos.y);
    }
  }

  const DAY_MS = 86400000;

  let timeOffsetDays = 0;
  let speedMultiplier = 1;
  let isPlaying = true;

  let simTimeMs = Date.now();
  let playOriginPerfMs = performance.now();
  let playOriginSimMs = simTimeMs;

  function computeSimTimeMs(nowPerfMs) {
    if (!isPlaying) return simTimeMs;
    const perfNow = Number.isFinite(nowPerfMs) ? nowPerfMs : performance.now();
    return playOriginSimMs + (perfNow - playOriginPerfMs) * speedMultiplier;
  }

  function setPlayingInternal(nextPlaying) {
    const playing = Boolean(nextPlaying);
    if (playing === isPlaying) return;
    const perfNow = performance.now();
    simTimeMs = computeSimTimeMs(perfNow);
    isPlaying = playing;
    if (isPlaying) {
      playOriginPerfMs = perfNow;
      playOriginSimMs = simTimeMs;
    }
  }

  function setSpeedMultiplierInternal(nextSpeed) {
    const speed = Number(nextSpeed);
    const allowed = speed === 1 || speed === 60 || speed === 600;
    const normalized = allowed ? speed : 1;
    if (normalized === speedMultiplier) return;
    const perfNow = performance.now();
    simTimeMs = computeSimTimeMs(perfNow);
    speedMultiplier = normalized;
    if (isPlaying) {
      playOriginPerfMs = perfNow;
      playOriginSimMs = simTimeMs;
    }
  }

  function setOffsetDaysInternal(nextDays) {
    const clamped = Math.max(-365, Math.min(365, Math.round(Number(nextDays) || 0)));
    if (clamped === timeOffsetDays) return;
    const perfNow = performance.now();
    simTimeMs = computeSimTimeMs(perfNow);
    const deltaDays = clamped - timeOffsetDays;
    simTimeMs += deltaDays * DAY_MS;
    timeOffsetDays = clamped;
    if (isPlaying) {
      playOriginPerfMs = perfNow;
      playOriginSimMs = simTimeMs;
    }
  }

  function setNowInternal() {
    const perfNow = performance.now();
    simTimeMs = Date.now();
    timeOffsetDays = 0;
    if (isPlaying) {
      playOriginPerfMs = perfNow;
      playOriginSimMs = simTimeMs;
    }
  }

  let lastStatusText = '';
  function updateSimStatus(force = false) {
    const iso = new Date(simTimeMs).toISOString().replace(/\.\d{3}Z$/, 'Z');
    const mode = isPlaying ? `Playing ${speedMultiplier}×` : 'Paused';
    const offset = timeOffsetDays === 0 ? 'Offset 0 d' : `Offset ${timeOffsetDays > 0 ? '+' : ''}${timeOffsetDays} d`;
    const text = `Sim: ${iso} • ${mode} • ${offset}`;
    if (!force && text === lastStatusText) return;
    lastStatusText = text;
    setStatus(text);
  }

  let rafId = 0;
  let lastUpdateSimSecond = -1;
  function frame() {
    controls.update();
    simTimeMs = computeSimTimeMs();
    const simSecond = Math.floor(simTimeMs / 1000);
    if (simSecond !== lastUpdateSimSecond) {
      lastUpdateSimSecond = simSecond;
      updatePlanetPositions(dateToJulianDay(new Date(simTimeMs)));
    }
    updateSimStatus();
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
    rafId = window.requestAnimationFrame(frame);
  }

  updatePlanetPositions(dateToJulianDay(new Date(simTimeMs)));
  updateSimStatus(true);

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
    getTimeState() {
      return { playing: isPlaying, speedMultiplier, offsetDays: timeOffsetDays };
    },
    setPlaying(playing) {
      setPlayingInternal(playing);
      updateSimStatus(true);
    },
    setSpeedMultiplier(speed) {
      setSpeedMultiplierInternal(speed);
      updateSimStatus(true);
    },
    setOffsetDays(days) {
      setOffsetDaysInternal(days);
      updateSimStatus(true);
    },
    setNow() {
      setNowInternal();
      updateSimStatus(true);
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

function getRange(id) {
  const el = document.getElementById(id);
  if (!el) return null;
  if (!(el instanceof HTMLInputElement)) return null;
  if (el.type !== 'range') return null;
  return el;
}

function getSelect(id) {
  const el = document.getElementById(id);
  if (!el) return null;
  if (!(el instanceof HTMLSelectElement)) return null;
  return el;
}

function getButton(id) {
  const el = document.getElementById(id);
  if (!el) return null;
  if (!(el instanceof HTMLButtonElement)) return null;
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

      const nowBtn = getButton(BTN_NOW_ID);
      const playPauseBtn = getButton(BTN_PLAY_PAUSE_ID);
      const speedSelect = getSelect(SPEED_SELECT_ID);
      const offsetSlider = getRange(TIME_OFFSET_SLIDER_ID);
      const offsetLabel = document.getElementById(TIME_OFFSET_LABEL_ID);

      function setPlayPauseUi(playing) {
        if (!playPauseBtn) return;
        playPauseBtn.textContent = playing ? 'Pause' : 'Play';
        playPauseBtn.setAttribute('aria-pressed', playing ? 'true' : 'false');
      }

      function setOffsetLabel(days) {
        if (!offsetLabel) return;
        const n = Number(days) || 0;
        if (n === 0) offsetLabel.textContent = '0 d';
        else offsetLabel.textContent = `${n > 0 ? '+' : ''}${n} d`;
      }

      if (nowBtn) {
        nowBtn.addEventListener('click', () => {
          if (offsetSlider) offsetSlider.value = '0';
          setOffsetLabel(0);
          app.setNow();
        });
      }

      if (playPauseBtn) {
        setPlayPauseUi(app.getTimeState().playing);
        playPauseBtn.addEventListener('click', () => {
          const nextPlaying = !app.getTimeState().playing;
          app.setPlaying(nextPlaying);
          setPlayPauseUi(nextPlaying);
        });
      }

      if (speedSelect) {
        speedSelect.value = String(app.getTimeState().speedMultiplier);
        speedSelect.addEventListener('change', () => {
          const speed = Number(speedSelect.value);
          app.setSpeedMultiplier(speed);
        });
      }

      if (offsetSlider) {
        setOffsetLabel(Number(offsetSlider.value));
        offsetSlider.addEventListener('input', () => {
          const days = Math.max(-365, Math.min(365, Math.round(Number(offsetSlider.value) || 0)));
          offsetSlider.value = String(days);
          setOffsetLabel(days);
          app.setOffsetDays(days);
        });
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
