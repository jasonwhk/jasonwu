const VIEWPORT_ID = 'viewport';
const STATUS_ID = 'status';
const TOGGLE_VISIBILITY_SCALE_ID = 'toggleVisibilityScale';
const TOGGLE_LABELS_ID = 'toggleLabels';
const TOGGLE_MOONS_ID = 'toggleMoons';
const TOGGLE_MOON_ORBITS_ID = 'toggleMoonOrbits';
const TOGGLE_MOON_LABELS_ID = 'toggleMoonLabels';
const MOON_SIZE_BOOST_ID = 'moonSizeBoost';
const MOON_DENSITY_ID = 'moonDensity';
const TOGGLE_MOONS_FOCUS_ONLY_ID = 'toggleMoonsFocusOnly';
const BTN_NOW_ID = 'btnNow';
const BTN_PLAY_PAUSE_ID = 'btnPlayPause';
const SPEED_SELECT_ID = 'speedSelect';
const CUSTOM_SPEED_WRAP_ID = 'customSpeedWrap';
const CUSTOM_SPEED_INPUT_ID = 'customSpeedInput';
const TIME_OFFSET_SLIDER_ID = 'timeOffsetDays';
const TIME_OFFSET_LABEL_ID = 'timeOffsetLabel';
const VIEW_PRESET_ID = 'viewPreset';
const FOCUS_SELECT_ID = 'focusSelect';
const TRACK_FOCUS_ID = 'trackFocus';

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

function timeMsToJulianDay(ms) {
  const n = Number(ms);
  if (!Number.isFinite(n)) return dateToJulianDay(new Date());
  return n / 86400000 + 2440587.5;
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
  const AU_KM = 149597870.7;
  const SUN_RADIUS_KM = 695700;

  const CAMERA_TRANSITION_MS = 650;
  const CAMERA_EPSILON = 1e-4;

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

  const camera = new THREE.PerspectiveCamera(50, 1, 0.001, 2000);
  camera.position.set(0, 12, 45);

  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient);

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.0);
  keyLight.position.set(10, 12, 8);
  scene.add(keyLight);

  const sunRadiusAU = SUN_RADIUS_KM / AU_KM;
  const bodyPhysicalScale = 0.24 / Math.max(1e-12, sunRadiusAU);
  const bodyVisibilityMultiplier = 4.5;
  const sunBaseRadius = sunRadiusAU * bodyPhysicalScale;
  const sunGeo = new THREE.SphereGeometry(1, 48, 24);
  const sunMat = new THREE.MeshStandardMaterial({
    color: 0xffcc44,
    emissive: 0x331a00,
    roughness: 0.55,
    metalness: 0.0,
  });
  const sunMesh = new THREE.Mesh(sunGeo, sunMat);
  sunMesh.scale.setScalar(sunBaseRadius);
  scene.add(sunMesh);

  const labelRenderer = new CSS2DRenderer();
  labelRenderer.domElement.className = 'ss-label-layer';
  viewportEl.appendChild(labelRenderer.domElement);

  const PLANETS = [
    { name: 'Mercury', color: 0xb8b8b8, aAU: 0.387098, e: 0.205630, visualRadius: 0.03, radiusKm: 2439.7 },
    { name: 'Venus', color: 0xd6c08d, aAU: 0.723332, e: 0.006772, visualRadius: 0.06, radiusKm: 6051.8 },
    { name: 'Earth', color: 0x3f74ff, aAU: 1.0, e: 0.0167086, visualRadius: 0.06, radiusKm: 6371.0 },
    { name: 'Mars', color: 0xc56c3a, aAU: 1.523679, e: 0.0934, visualRadius: 0.04, radiusKm: 3389.5 },
    { name: 'Jupiter', color: 0xd7b48a, aAU: 5.2044, e: 0.0489, visualRadius: 0.22, radiusKm: 69911 },
    { name: 'Saturn', color: 0xe3cf9b, aAU: 9.5826, e: 0.0565, visualRadius: 0.19, radiusKm: 58232 },
    { name: 'Uranus', color: 0x7bd3dd, aAU: 19.2184, e: 0.0463, visualRadius: 0.14, radiusKm: 25362 },
    { name: 'Neptune', color: 0x3d64ff, aAU: 30.1104, e: 0.009, visualRadius: 0.14, radiusKm: 24622 },
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
  const planetEntryByName = new Map();

  for (const planet of PLANETS) {
    const material = new THREE.MeshStandardMaterial({
      color: planet.color,
      emissive: new THREE.Color(planet.color).multiplyScalar(0.08),
      roughness: 0.85,
      metalness: 0.0,
    });
    const mesh = new THREE.Mesh(planetGeometry, material);
    mesh.position.set(0, 0, 0);
    mesh.scale.setScalar(((Number(planet.radiusKm) || 0) / AU_KM) * bodyPhysicalScale);
    mesh.name = planet.name;

    const labelEl = document.createElement('div');
    labelEl.className = 'ss-label';
    labelEl.textContent = planet.name;
    const labelObj = new CSS2DObject(labelEl);
    labelObj.position.set(0, 1.4, 0);
    mesh.add(labelObj);

    const group = new THREE.Group();
    group.name = `${planet.name}-Group`;
    group.position.set(getOrbitRadiusAU(planet, 0), 0, 0);
    group.add(mesh);

    planetsGroup.add(group);
    const entry = {
      group,
      mesh,
      material,
      baseRadius: Math.max(0.000001, ((Number(planet.radiusKm) || 0) / AU_KM) * bodyPhysicalScale),
      radiusKm: Math.max(0, Number(planet.radiusKm) || 0),
      labelObj,
      name: planet.name,
    };
    planetEntries.push(entry);
    planetEntryByName.set(entry.name, entry);
  }

  const MOON_LABEL_UPDATE_MS = 100;

  const MOONS = [
    { name: 'Moon', parent: 'Earth', radiusKm: 1737.4, semiMajorAxisKm: 384400, orbitalPeriodDays: 27.321661, inclinationDeg: 5.145 },
    { name: 'Phobos', parent: 'Mars', radiusKm: 11.2667, semiMajorAxisKm: 9376, orbitalPeriodDays: 0.31891023, inclinationDeg: 1.093 },
    { name: 'Deimos', parent: 'Mars', radiusKm: 6.2, semiMajorAxisKm: 23463, orbitalPeriodDays: 1.26244, inclinationDeg: 0.93 },
    { name: 'Io', parent: 'Jupiter', radiusKm: 1821.6, semiMajorAxisKm: 421700, orbitalPeriodDays: 1.769137786, inclinationDeg: 0.04 },
    { name: 'Europa', parent: 'Jupiter', radiusKm: 1560.8, semiMajorAxisKm: 671100, orbitalPeriodDays: 3.551181, inclinationDeg: 0.47 },
    { name: 'Ganymede', parent: 'Jupiter', radiusKm: 2634.1, semiMajorAxisKm: 1070400, orbitalPeriodDays: 7.154553, inclinationDeg: 0.2 },
    { name: 'Callisto', parent: 'Jupiter', radiusKm: 2410.3, semiMajorAxisKm: 1882700, orbitalPeriodDays: 16.6890184, inclinationDeg: 0.28 },
    { name: 'Titan', parent: 'Saturn', radiusKm: 2574.7, semiMajorAxisKm: 1221870, orbitalPeriodDays: 15.945421, inclinationDeg: 0.34854 },
    { name: 'Rhea', parent: 'Saturn', radiusKm: 763.8, semiMajorAxisKm: 527108, orbitalPeriodDays: 4.518212, inclinationDeg: 0.345 },
    { name: 'Iapetus', parent: 'Saturn', radiusKm: 734.5, semiMajorAxisKm: 3560820, orbitalPeriodDays: 79.3215, inclinationDeg: 15.47 },
    { name: 'Dione', parent: 'Saturn', radiusKm: 561.4, semiMajorAxisKm: 377396, orbitalPeriodDays: 2.736915, inclinationDeg: 0.028 },
    { name: 'Tethys', parent: 'Saturn', radiusKm: 531.1, semiMajorAxisKm: 294672, orbitalPeriodDays: 1.887802, inclinationDeg: 1.12 },
    { name: 'Enceladus', parent: 'Saturn', radiusKm: 252.1, semiMajorAxisKm: 237948, orbitalPeriodDays: 1.370218, inclinationDeg: 0.009 },
    { name: 'Mimas', parent: 'Saturn', radiusKm: 198.2, semiMajorAxisKm: 185540, orbitalPeriodDays: 0.942422, inclinationDeg: 1.574 },
    { name: 'Titania', parent: 'Uranus', radiusKm: 788.9, semiMajorAxisKm: 435910, orbitalPeriodDays: 8.705872, inclinationDeg: 0.079 },
    { name: 'Oberon', parent: 'Uranus', radiusKm: 761.4, semiMajorAxisKm: 583520, orbitalPeriodDays: 13.463234, inclinationDeg: 0.068 },
    { name: 'Umbriel', parent: 'Uranus', radiusKm: 584.7, semiMajorAxisKm: 266000, orbitalPeriodDays: 4.144177, inclinationDeg: 0.128 },
    { name: 'Ariel', parent: 'Uranus', radiusKm: 578.9, semiMajorAxisKm: 191020, orbitalPeriodDays: 2.520379, inclinationDeg: 0.041 },
    { name: 'Miranda', parent: 'Uranus', radiusKm: 235.8, semiMajorAxisKm: 129900, orbitalPeriodDays: 1.413479, inclinationDeg: 4.232 },
    { name: 'Triton', parent: 'Neptune', radiusKm: 1353.4, semiMajorAxisKm: 354759, orbitalPeriodDays: 5.876854, inclinationDeg: 156.885 },
    { name: 'Proteus', parent: 'Neptune', radiusKm: 210, semiMajorAxisKm: 117647, orbitalPeriodDays: 1.122315, inclinationDeg: 0.0 },
    { name: 'Nereid', parent: 'Neptune', radiusKm: 170, semiMajorAxisKm: 5513818, orbitalPeriodDays: 360.1362, inclinationDeg: 7.23 },
  ];

  const moonGeometry = new THREE.SphereGeometry(1, 18, 10);
  const moonOrbitUnitGeometry = (() => {
    const segments = clampOrbitSegments(256);
    const positions = new Float32Array(segments * 3);
    for (let i = 0; i < segments; i += 1) {
      const theta = (i / segments) * TAU;
      const base = i * 3;
      positions[base + 0] = Math.cos(theta);
      positions[base + 1] = 0;
      positions[base + 2] = Math.sin(theta);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geometry;
  })();

  const moonOrbitMaterial = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.25,
    depthWrite: false,
  });

  const moonMaterialByParent = new Map();
  function getMoonMaterial(parentName) {
    const key = String(parentName || '');
    const existing = moonMaterialByParent.get(key);
    if (existing) return existing;

    const parent = planetEntryByName.get(key);
    const baseColor = parent ? new THREE.Color(parent.material.color).lerp(new THREE.Color(0xffffff), 0.55) : new THREE.Color(0xd9d9d9);
    const material = new THREE.MeshStandardMaterial({
      color: baseColor,
      roughness: 0.9,
      metalness: 0.0,
    });
    moonMaterialByParent.set(key, material);
    return material;
  }

  const moonLabelLayer = document.createElement('div');
  moonLabelLayer.className = 'ss-moon-label-layer';
  viewportEl.appendChild(moonLabelLayer);

  const moonEntries = [];

  for (const moon of MOONS) {
    const parentEntry = planetEntryByName.get(moon.parent);
    if (!parentEntry) continue;

    const orbitPlane = new THREE.Group();
    orbitPlane.name = `${moon.parent}-${moon.name}-Plane`;
    orbitPlane.rotation.x = degreesToRadians(Number(moon.inclinationDeg) || 0);
    parentEntry.group.add(orbitPlane);

    const pivot = new THREE.Group();
    pivot.name = `${moon.parent}-${moon.name}-Pivot`;
    orbitPlane.add(pivot);

    const material = getMoonMaterial(moon.parent);
    const mesh = new THREE.Mesh(moonGeometry, material);
    mesh.name = moon.name;
    pivot.add(mesh);

    const orbitLine = new THREE.LineLoop(moonOrbitUnitGeometry, moonOrbitMaterial);
    orbitLine.name = `${moon.parent}-${moon.name}-Orbit`;
    orbitLine.renderOrder = 2;
    orbitPlane.add(orbitLine);

    const labelEl = document.createElement('div');
    labelEl.className = 'ss-moon-label';
    labelEl.textContent = moon.name;
    moonLabelLayer.appendChild(labelEl);

    moonEntries.push({
      name: moon.name,
      parentName: moon.parent,
      parentPlanetMesh: parentEntry.mesh,
      orbitPlane,
      pivot,
      mesh,
      orbitLine,
      labelEl,
      radiusKm: Math.max(0, Number(moon.radiusKm) || 0),
      semiMajorAxisKm: Math.max(0, Number(moon.semiMajorAxisKm) || 0),
      orbitRadiusAU: (Math.max(0, Number(moon.semiMajorAxisKm) || 0) / AU_KM) * bodyPhysicalScale,
      periodDays: Math.max(0.0001, Number(moon.orbitalPeriodDays) || 1),
      phaseRad: Number.isFinite(moon.phaseAtJ2000) ? Number(moon.phaseAtJ2000) : 0,
      inclinationRad: degreesToRadians(Number(moon.inclinationDeg) || 0),
      baseRadius: (Math.max(0, Number(moon.radiusKm) || 0) / AU_KM) * bodyPhysicalScale,
      displayOrbitRadius: 0,
      active: true,
    });
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
  controls.minDistance = 0.25;
  controls.maxDistance = 400;
  controls.target.set(0, 0, 0);
  controls.update();

  const initialOffset = camera.position.clone().sub(controls.target);
  const initialDistance = Math.max(controls.minDistance, initialOffset.length());
  const initialOffsetDir = initialOffset.lengthSq() > 0 ? initialOffset.clone().normalize() : new THREE.Vector3(0, 0.25, 1);

  let viewPreset = 'tilted';
  let focusName = 'Sun';
  let trackFocus = false;

  const focusTargets = new Map();
  focusTargets.set('Sun', sunMesh);
  for (const entry of planetEntries) focusTargets.set(entry.name, entry.group);

  let cameraTransition = null;

  function easeInOutCubic(t) {
    const clamped = Math.max(0, Math.min(1, Number(t)));
    return clamped < 0.5 ? 4 * clamped * clamped * clamped : 1 - Math.pow(-2 * clamped + 2, 3) / 2;
  }

  function startCameraTransition({ nextTarget, nextCameraPos, durationMs = CAMERA_TRANSITION_MS }) {
    const target = nextTarget instanceof THREE.Vector3 ? nextTarget.clone() : controls.target.clone();
    const cameraPos = nextCameraPos instanceof THREE.Vector3 ? nextCameraPos.clone() : camera.position.clone();

    cameraTransition = {
      startPerfMs: performance.now(),
      durationMs: Math.max(0, Number(durationMs) || 0),
      fromTarget: controls.target.clone(),
      toTarget: target,
      fromPos: camera.position.clone(),
      toPos: cameraPos,
    };
  }

  function cancelCameraTransition() {
    cameraTransition = null;
  }

  function applyCameraTransition(nowPerfMs) {
    if (!cameraTransition) return false;

    const tRaw =
      cameraTransition.durationMs <= 0 ? 1 : (Number(nowPerfMs) - cameraTransition.startPerfMs) / cameraTransition.durationMs;
    const t = easeInOutCubic(tRaw);

    controls.target.lerpVectors(cameraTransition.fromTarget, cameraTransition.toTarget, t);
    camera.position.lerpVectors(cameraTransition.fromPos, cameraTransition.toPos, t);

    if (tRaw >= 1) cameraTransition = null;
    return true;
  }

  function getFocusObject(name) {
    if (!name) return null;
    return focusTargets.get(String(name)) ?? null;
  }

  function getCurrentDistance() {
    return Math.max(controls.minDistance, camera.position.distanceTo(controls.target));
  }

  function computePresetOffset(presetName, distance) {
    const d = Math.max(controls.minDistance, Math.min(controls.maxDistance, Number(distance) || initialDistance));
    if (presetName === 'top') {
      return new THREE.Vector3(CAMERA_EPSILON, d, CAMERA_EPSILON);
    }
    if (presetName === 'tilted') {
      return initialOffsetDir.clone().multiplyScalar(d);
    }
    return null;
  }

  function setViewPresetInternal(nextPreset) {
    const preset = String(nextPreset || 'free');
    viewPreset = preset;
    if (preset === 'free') {
      cancelCameraTransition();
      return;
    }
    const distance = getCurrentDistance();
    const offset = computePresetOffset(preset, distance);
    if (!offset) return;
    const nextTarget = controls.target.clone();
    const nextPos = nextTarget.clone().add(offset);
    startCameraTransition({ nextTarget, nextCameraPos: nextPos });
  }

  function setFocusInternal(nextFocusName) {
    const name = String(nextFocusName || 'Sun');
    const obj = getFocusObject(name);
    if (!obj) return;
    focusName = name;
    applyMoonVisibility();

    const prevTarget = controls.target.clone();
    const nextTarget = obj.position.clone();
    const delta = nextTarget.clone().sub(prevTarget);
    const nextPos = camera.position.clone().add(delta);

    startCameraTransition({ nextTarget, nextCameraPos: nextPos });
  }

  function setTrackFocusInternal(nextTrack) {
    trackFocus = Boolean(nextTrack);
  }

  controls.addEventListener('start', cancelCameraTransition);

  let viewportWidth = 1;
  let viewportHeight = 1;

  let useVisibilityScale = false;
  let labelsVisible = true;
  let moonsVisible = true;
  let moonOrbitsVisible = false;
  let moonLabelsVisible = false;
  let moonSizeBoost = 1;
  let moonDensity = 'major';
  let moonsFocusOnly = false;
  let lastMoonLabelUpdatePerfMs = -1;
  const moonLabelTmp = new THREE.Vector3();

  function resize() {
    renderer.setPixelRatio(clampDevicePixelRatio(window.devicePixelRatio));
    const { width, height } = getViewportSize(viewportEl);
    viewportWidth = width;
    viewportHeight = height;
    renderer.setSize(width, height, false);
    labelRenderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    updateMoonLabelPositions(true);
  }

  resize();

  function applyPlanetScale() {
    const mult = useVisibilityScale ? bodyVisibilityMultiplier : 1;
    sunMesh.scale.setScalar(sunBaseRadius * mult);
    for (const entry of planetEntries) {
      entry.mesh.scale.setScalar(entry.baseRadius * mult);
      entry.labelObj.position.set(0, entry.mesh.scale.y + 0.4, 0);
    }
    applyMoonScale();
  }

  function applyLabelsVisible() {
    for (const entry of planetEntries) {
      entry.labelObj.visible = labelsVisible;
    }
  }

  applyPlanetScale();
  applyLabelsVisible();

  function applyMoonScale() {
    if (moonEntries.length === 0) return;
    const boost = Math.max(1, Number(moonSizeBoost) || 1);

    for (const entry of moonEntries) {
      const parentRadius = Math.max(0, entry.parentPlanetMesh?.scale?.x ?? 0);
      entry.displayOrbitRadius = useVisibilityScale ? Math.max(entry.orbitRadiusAU, parentRadius * 1.2) : entry.orbitRadiusAU;
      entry.mesh.scale.setScalar(Math.max(0.000001, entry.baseRadius * boost));
      entry.mesh.position.set(entry.displayOrbitRadius, 0, 0);
      entry.orbitLine.scale.setScalar(entry.displayOrbitRadius);
    }
  }

  function applyMoonVisibility() {
    const focusedParent = moonsFocusOnly && focusName && focusName !== 'Sun' ? focusName : null;
    const densityOk = moonDensity === 'major';
    for (const entry of moonEntries) {
      const active =
        Boolean(moonsVisible) &&
        densityOk &&
        (focusedParent === null || entry.parentName === focusedParent);
      entry.active = active;
      entry.mesh.visible = active;
      entry.orbitLine.visible = active && Boolean(moonOrbitsVisible);
      entry.labelEl.style.display = active && Boolean(moonLabelsVisible) ? '' : 'none';
    }
  }

  function updateMoonLabelPositions(force = false) {
    if (!moonsVisible || !moonLabelsVisible) return;

    const now = performance.now();
    if (!force && lastMoonLabelUpdatePerfMs >= 0 && now - lastMoonLabelUpdatePerfMs < MOON_LABEL_UPDATE_MS) return;
    lastMoonLabelUpdatePerfMs = now;

    for (const entry of moonEntries) {
      if (!entry.active) continue;
      moonLabelTmp.set(0, 0, 0);
      entry.mesh.getWorldPosition(moonLabelTmp);
      moonLabelTmp.project(camera);

      if (moonLabelTmp.z < -1 || moonLabelTmp.z > 1) {
        entry.labelEl.style.display = 'none';
        continue;
      }

      const x = (moonLabelTmp.x * 0.5 + 0.5) * viewportWidth;
      const y = (-moonLabelTmp.y * 0.5 + 0.5) * viewportHeight;

      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        entry.labelEl.style.display = 'none';
        continue;
      }

      entry.labelEl.style.display = '';
      entry.labelEl.style.transform = `translate(-50%, -50%) translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    }
  }

  applyMoonScale();
  applyMoonVisibility();

  function updatePlanetPositions(jd) {
    for (const entry of planetEntries) {
      const pos = computeHeliocentricEclipticXYZ_AU(entry.name, jd);
      entry.group.position.set(pos.x, pos.z, pos.y);
    }
  }

  function updateMoonPositions(jd) {
    if (!moonsVisible || moonEntries.length === 0) return;
    const tDays = Number(jd) - 2451545.0;

    for (const entry of moonEntries) {
      if (!entry.active) continue;
      const n = TAU / entry.periodDays;
      const theta = entry.phaseRad + n * tDays;
      entry.pivot.rotation.y = normalizeRadians(theta);
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
    if (!Number.isFinite(speed) || speed <= 0) return;
    const normalized = Math.min(1_000_000, speed);
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
    const prettySpeed =
      Number.isFinite(speedMultiplier) && Math.abs(speedMultiplier - Math.round(speedMultiplier)) < 1e-9
        ? String(Math.round(speedMultiplier))
        : String(speedMultiplier);
    const mode = isPlaying ? `Playing ${prettySpeed}×` : 'Paused';
    const offset = timeOffsetDays === 0 ? 'Offset 0 d' : `Offset ${timeOffsetDays > 0 ? '+' : ''}${timeOffsetDays} d`;
    const text = `Sim: ${iso} • ${mode} • ${offset}`;
    if (!force && text === lastStatusText) return;
    lastStatusText = text;
    setStatus(text);
  }

  let rafId = 0;
  let lastUpdateSimSecond = -1;
  function frame() {
    applyCameraTransition(performance.now());
    controls.update();
    simTimeMs = computeSimTimeMs();
    const simJd = timeMsToJulianDay(simTimeMs);
    const simSecond = Math.floor(simTimeMs / 1000);
    if (simSecond !== lastUpdateSimSecond) {
      lastUpdateSimSecond = simSecond;
      updatePlanetPositions(simJd);
    }
    updateMoonPositions(simJd);

    if (!cameraTransition && trackFocus) {
      const focusObj = getFocusObject(focusName);
      if (focusObj) {
        const nextTarget = focusObj.position;
        const delta = nextTarget.clone().sub(controls.target);
        controls.target.add(delta);
        camera.position.add(delta);
      }
    }

    updateMoonLabelPositions();
    updateSimStatus();
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
    rafId = window.requestAnimationFrame(frame);
  }

  updatePlanetPositions(dateToJulianDay(new Date(simTimeMs)));
  updateMoonPositions(timeMsToJulianDay(simTimeMs));
  updateMoonLabelPositions(true);
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
    setMoonsVisible(visible) {
      moonsVisible = Boolean(visible);
      applyMoonVisibility();
    },
    setMoonOrbitsVisible(visible) {
      moonOrbitsVisible = Boolean(visible);
      applyMoonVisibility();
    },
    setMoonLabelsVisible(visible) {
      moonLabelsVisible = Boolean(visible);
      applyMoonVisibility();
      updateMoonLabelPositions(true);
    },
    setMoonSizeBoost(nextBoost) {
      const n = Math.round(Number(nextBoost) || 1);
      const allowed = new Set([1, 20, 50, 100, 200]);
      moonSizeBoost = allowed.has(n) ? n : 50;
      applyMoonScale();
      updateMoonLabelPositions(true);
    },
    setMoonDensity(value) {
      const next = String(value || 'major');
      if (next !== 'major') return;
      moonDensity = next;
      applyMoonVisibility();
      updateMoonLabelPositions(true);
    },
    setMoonsFocusOnly(enabled) {
      moonsFocusOnly = Boolean(enabled);
      applyMoonVisibility();
      updateMoonLabelPositions(true);
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
    setViewPreset(preset) {
      setViewPresetInternal(preset);
    },
    setFocus(name) {
      setFocusInternal(name);
    },
    setTrackFocus(enabled) {
      setTrackFocusInternal(enabled);
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
        entry.group.removeFromParent();
      }
      moonGeometry.dispose();
      moonOrbitUnitGeometry.dispose();
      moonOrbitMaterial.dispose();
      for (const material of moonMaterialByParent.values()) material.dispose();
      for (const entry of moonEntries) {
        if (entry.labelEl?.remove) entry.labelEl.remove();
        entry.orbitPlane.removeFromParent();
      }
      moonLabelLayer.remove();
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

function getCheckbox(id) {
  const el = document.getElementById(id);
  if (!el) return null;
  if (!(el instanceof HTMLInputElement)) return null;
  if (el.type !== 'checkbox') return null;
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

      const moonsToggle = getToggle(TOGGLE_MOONS_ID);
      if (moonsToggle) {
        app.setMoonsVisible(moonsToggle.checked);
        moonsToggle.addEventListener('change', () => app.setMoonsVisible(moonsToggle.checked));
      }

      const moonOrbitsToggle = getToggle(TOGGLE_MOON_ORBITS_ID);
      if (moonOrbitsToggle) {
        app.setMoonOrbitsVisible(moonOrbitsToggle.checked);
        moonOrbitsToggle.addEventListener('change', () => app.setMoonOrbitsVisible(moonOrbitsToggle.checked));
      }

      const moonLabelsToggle = getToggle(TOGGLE_MOON_LABELS_ID);
      if (moonLabelsToggle) {
        app.setMoonLabelsVisible(moonLabelsToggle.checked);
        moonLabelsToggle.addEventListener('change', () => app.setMoonLabelsVisible(moonLabelsToggle.checked));
      }

      const moonSizeBoostSelect = getSelect(MOON_SIZE_BOOST_ID);
      if (moonSizeBoostSelect) {
        app.setMoonSizeBoost(moonSizeBoostSelect.value);
        moonSizeBoostSelect.addEventListener('change', () => app.setMoonSizeBoost(moonSizeBoostSelect.value));
      }

      const moonDensitySelect = getSelect(MOON_DENSITY_ID);
      if (moonDensitySelect) {
        app.setMoonDensity(moonDensitySelect.value);
        moonDensitySelect.addEventListener('change', () => app.setMoonDensity(moonDensitySelect.value));
      }

      const moonsFocusOnlyToggle = getToggle(TOGGLE_MOONS_FOCUS_ONLY_ID);
      if (moonsFocusOnlyToggle) {
        app.setMoonsFocusOnly(moonsFocusOnlyToggle.checked);
        moonsFocusOnlyToggle.addEventListener('change', () => app.setMoonsFocusOnly(moonsFocusOnlyToggle.checked));
      }

      const nowBtn = getButton(BTN_NOW_ID);
      const playPauseBtn = getButton(BTN_PLAY_PAUSE_ID);
      const speedSelect = getSelect(SPEED_SELECT_ID);
      const customSpeedWrap = document.getElementById(CUSTOM_SPEED_WRAP_ID);
      const customSpeedInput = document.getElementById(CUSTOM_SPEED_INPUT_ID);
      const offsetSlider = getRange(TIME_OFFSET_SLIDER_ID);
      const offsetLabel = document.getElementById(TIME_OFFSET_LABEL_ID);
      const viewPresetSelect = getSelect(VIEW_PRESET_ID);
      const focusSelect = getSelect(FOCUS_SELECT_ID);
      const trackFocusToggle = getCheckbox(TRACK_FOCUS_ID);

      function parseCustomSpeed(value) {
        const n = Number(value);
        if (!Number.isFinite(n)) return null;
        const rounded = Math.round(n);
        if (rounded <= 0) return null;
        return Math.min(1_000_000, rounded);
      }

      function showCustomSpeedUi(show) {
        if (!customSpeedWrap) return;
        if (show) customSpeedWrap.removeAttribute('hidden');
        else customSpeedWrap.setAttribute('hidden', '');
      }

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
        const currentSpeed = app.getTimeState().speedMultiplier;
        const preset = ['1', '60', '600', '6000', '60000'];
        if (preset.includes(String(currentSpeed))) {
          speedSelect.value = String(currentSpeed);
          showCustomSpeedUi(false);
        } else {
          speedSelect.value = 'custom';
          showCustomSpeedUi(true);
          if (customSpeedInput instanceof HTMLInputElement) customSpeedInput.value = String(Math.round(currentSpeed));
        }
        speedSelect.addEventListener('change', () => {
          if (speedSelect.value === 'custom') {
            showCustomSpeedUi(true);
            const parsed = customSpeedInput instanceof HTMLInputElement ? parseCustomSpeed(customSpeedInput.value) : null;
            if (parsed !== null) app.setSpeedMultiplier(parsed);
            if (customSpeedInput instanceof HTMLInputElement) customSpeedInput.focus();
            return;
          }
          showCustomSpeedUi(false);
          const speed = Number(speedSelect.value);
          app.setSpeedMultiplier(speed);
        });
      }

      if (customSpeedInput instanceof HTMLInputElement) {
        customSpeedInput.addEventListener('input', () => {
          if (!speedSelect || speedSelect.value !== 'custom') return;
          const parsed = parseCustomSpeed(customSpeedInput.value);
          if (parsed !== null) app.setSpeedMultiplier(parsed);
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

      if (viewPresetSelect) {
        app.setViewPreset(viewPresetSelect.value);
        viewPresetSelect.addEventListener('change', () => app.setViewPreset(viewPresetSelect.value));
      }

      if (focusSelect) {
        app.setFocus(focusSelect.value);
        focusSelect.addEventListener('change', () => app.setFocus(focusSelect.value));
      }

      if (trackFocusToggle) {
        app.setTrackFocus(trackFocusToggle.checked);
        trackFocusToggle.addEventListener('change', () => app.setTrackFocus(trackFocusToggle.checked));
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
