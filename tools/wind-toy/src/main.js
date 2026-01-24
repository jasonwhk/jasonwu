import { initControls } from "./ui/controls.js";
import { initGestures } from "./ui/gestures.js";
import { addScalar, advectScalar, clearScalarField, createScalarField, resizeScalarField } from "./sim/advect.js";
import { addVelocity, applyDamping, clearField, createField, diffuseField, resizeField } from "./sim/field.js";
import {
  applyObstaclesToField,
  clearObstacles,
  createObstacleField,
  paintObstacle,
  resizeObstacleField,
} from "./sim/obstacles.js";
import { createParticles, resizeParticles, seedParticles, stepParticles } from "./sim/particles.js";

const canvas = document.querySelector("#wind-canvas");
const ctx = canvas.getContext("2d", { alpha: false });

const SIM_STEP = 1 / 60;
const FIELD_DAMPING = 0.96;
const MEMORY_DAMPING = 0.985;
const MEMORY_DIFFUSION = 0.35;
const MAX_WIND_SPEED = 1600;
const GUST_SPEED = 1200;
const SMOKE_DISSIPATION = 0.985;
const TEMP_DISSIPATION = 0.992;
const TEMP_INJECTION = 0.65;
const TEMP_TAP_BOOST = 1.1;
const BUOYANCY_SCALE = 180;
const IDLE_ATTRACT_MS = 5000;
const IDLE_WIND_SPEED = 220;
const IDLE_WIND_RADIUS = 120;
const IDLE_SMOKE_AMOUNT = 0.16;
const IDLE_SWIRL_STRENGTH = 0.35;
const FPS_SAMPLE_MS = 900;
const LOW_POWER_FPS = 48;
const LOW_POWER_SAMPLES = 3;
const HIGH_POWER_FPS = 58;
const HIGH_POWER_SAMPLES = 6;
const AUDIO_SAMPLE_MS = 1000;
const AUDIO_BASE_GAIN = 0.018;
const AUDIO_MIN_FREQ = 180;
const AUDIO_MAX_FREQ = 1200;
const FORCE_FIELD_EPS = 1200;
const FORCE_FIELD_MAX_ACCEL = 1400;
const FORCE_FIELD_DEFAULTS = {
  attractor: { label: "Attractor", strength: 1600, radius: 220 },
  repeller: { label: "Repeller", strength: 1600, radius: 220 },
  dipole: { label: "Dipole", strength: 1900, radius: 260 },
};
const PRO_STORAGE_KEY = "windToyProEnabled";

const THEMES = {
  Classic: {
    label: "Classic",
    particleScale: 1,
    background: { r: 5, g: 7, b: 13, alpha: 0.2 },
    particleOptions: { drag: 0.18, noise: 18, speedScale: 1, gravity: 0 },
    smokeTint: { r: 150, g: 190, b: 255, alpha: 180 },
  },
  Leaves: {
    label: "Autumn Leaves",
    particleScale: 0.85,
    background: { r: 12, g: 9, b: 6, alpha: 0.22 },
    particleOptions: { drag: 0.22, noise: 22, speedScale: 0.9, gravity: 0 },
    smokeTint: { r: 210, g: 150, b: 120, alpha: 140 },
  },
  Snow: {
    label: "Snow",
    particleScale: 0.8,
    background: { r: 7, g: 10, b: 16, alpha: 0.2 },
    particleOptions: { drag: 0.28, noise: 6, speedScale: 0.6, gravity: 48 },
    smokeTint: { r: 190, g: 210, b: 240, alpha: 130 },
  },
  Ink: {
    label: "Ink",
    particleScale: 0.9,
    background: { r: 244, g: 240, b: 233, alpha: 0.26 },
    particleOptions: { drag: 0.16, noise: 12, speedScale: 0.95, gravity: 0 },
    smokeTint: { r: 30, g: 32, b: 40, alpha: 170 },
  },
  Fireflies: {
    label: "Fireflies",
    particleScale: 0.7,
    background: { r: 4, g: 7, b: 12, alpha: 0.16 },
    particleOptions: { drag: 0.2, noise: 10, speedScale: 0.7, gravity: 0 },
    smokeTint: { r: 140, g: 200, b: 170, alpha: 120 },
  },
};

const state = {
  width: 0,
  height: 0,
  dpr: 1,
  brushRadius: 42,
  mode: "Particles",
  brushMode: "Push",
  toolMode: "Wind",
  quality: "High",
  autoLowPower: false,
  showField: false,
  windMemory: false,
  physicsMode: "Wind",
  showTempOverlay: false,
  showObstacleOverlay: false,
  buoyancyStrength: 0.5,
  theme: "Classic",
  trailStrength: 1,
  scienceOverlay: "Off",
  eraseObstacles: false,
  soundEnabled: false,
  soundVolume: 0.25,
  forceFieldsEnabled: false,
  forceFields: [],
  proEnabled: false,
  pointer: {
    active: false,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
  },
  lastFrame: performance.now(),
  accumulator: 0,
  idleTime: 0,
  idleSeed: Math.random() * Math.PI * 2,
};

const audioState = {
  ctx: null,
  masterGain: null,
  toneGain: null,
  noiseGain: null,
  filter: null,
  osc1: null,
  osc2: null,
  noise: null,
  lastSample: 0,
  speedLevel: 0,
  vorticityLevel: 0,
};

const fpsState = {
  enabled: false,
  lastSample: performance.now(),
  frameCount: 0,
  fps: 60,
  lowSamples: 0,
  highSamples: 0,
  inLowPower: false,
};

const field = createField({
  worldWidth: 1,
  worldHeight: 1,
  gridWidth: 24,
  gridHeight: 24,
});
const particles = createParticles();
const smoke = createScalarField({
  worldWidth: 1,
  worldHeight: 1,
  gridWidth: 24,
  gridHeight: 24,
});
const temp = createScalarField({
  worldWidth: 1,
  worldHeight: 1,
  gridWidth: 24,
  gridHeight: 24,
});
const obstacles = createObstacleField({
  worldWidth: 1,
  worldHeight: 1,
  gridWidth: 24,
  gridHeight: 24,
});

const smokeBuffer = {
  canvas: document.createElement("canvas"),
  ctx: null,
  imageData: null,
};
smokeBuffer.ctx = smokeBuffer.canvas.getContext("2d");
const tempBuffer = {
  canvas: document.createElement("canvas"),
  ctx: null,
  imageData: null,
};
tempBuffer.ctx = tempBuffer.canvas.getContext("2d");
const obstacleBuffer = {
  canvas: document.createElement("canvas"),
  ctx: null,
  imageData: null,
};
obstacleBuffer.ctx = obstacleBuffer.canvas.getContext("2d");
const scienceBuffer = {
  canvas: document.createElement("canvas"),
  ctx: null,
  imageData: null,
};
scienceBuffer.ctx = scienceBuffer.canvas.getContext("2d");
const fpsMeter = document.querySelector("#fps-meter");
const proPanel = document.querySelector("#pro-panel");
const forceFieldsList = document.querySelector("#force-fields-list");
const forceFieldTypeSelect = document.querySelector("#force-field-type");
const addForceFieldButton = document.querySelector("#add-force-field-btn");
const clearForceFieldsButton = document.querySelector("#clear-force-fields-btn");
let forceFieldId = 0;

const controls = initControls({
  onReset: () => resetScene(),
  onModeToggle: (mode) => {
    state.mode = mode;
    if (mode === "Smoke") {
      clearScalarField(smoke);
    }
  },
  onQualityToggle: (quality) => {
    fpsState.inLowPower = false;
    fpsState.lowSamples = 0;
    applyQuality(quality, { auto: false });
  },
  onFieldToggle: (enabled) => {
    state.showField = enabled;
  },
  onWindMemoryToggle: (enabled) => {
    state.windMemory = enabled;
  },
  onPhysicsToggle: (mode) => {
    state.physicsMode = mode;
    if (mode === "Wind") {
      clearScalarField(temp);
    }
  },
  onTempOverlayToggle: (enabled) => {
    state.showTempOverlay = enabled;
  },
  onBuoyancyChange: (strength) => {
    state.buoyancyStrength = strength;
  },
  onThemeChange: (theme) => {
    state.theme = theme;
    resizeParticles(particles, {
      count: getParticleCount(),
      width: state.width,
      height: state.height,
      reseed: false,
    });
  },
  onTrailsChange: (strength) => {
    state.trailStrength = strength;
  },
  onScienceOverlayChange: (mode) => {
    state.scienceOverlay = mode;
  },
  onToolToggle: (mode) => {
    state.toolMode = mode;
  },
  onObstacleOverlayToggle: (enabled) => {
    state.showObstacleOverlay = enabled;
  },
  onClearObstacles: () => {
    clearObstacles(obstacles);
  },
  onSoundToggle: (enabled) => {
    state.soundEnabled = enabled;
    syncAudioState();
  },
  onSoundVolumeChange: (volume) => {
    state.soundVolume = volume;
    updateAudioVolume();
  },
  onForceFieldsToggle: (enabled) => {
    state.forceFieldsEnabled = enabled;
  },
  onShare: () => {
    handleShare();
  },
  onBrushToggle: (mode) => {
    state.brushMode = mode;
  },
});

const urlParams = new URLSearchParams(window.location.search);
const queryProEnabled = urlParams.has("pro");
if (queryProEnabled) {
  localStorage.setItem(PRO_STORAGE_KEY, "true");
}
state.proEnabled = queryProEnabled || localStorage.getItem(PRO_STORAGE_KEY) === "true";
if (proPanel) {
  proPanel.hidden = !state.proEnabled;
}

addForceFieldButton?.addEventListener("click", () => {
  if (!state.proEnabled) {
    return;
  }
  const type = forceFieldTypeSelect?.value ?? "attractor";
  addForceField(type);
});

clearForceFieldsButton?.addEventListener("click", () => {
  clearForceFields();
});

forceFieldsList?.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }
  const id = target.dataset.forceFieldId;
  if (!id) {
    return;
  }
  removeForceField(Number(id));
});

renderForceFieldsList();

function applyQuality(quality, { auto = false } = {}) {
  state.quality = quality;
  state.autoLowPower = auto;
  const gridConfig = getGridConfig();
  resizeField(field, {
    worldWidth: state.width,
    worldHeight: state.height,
    gridWidth: gridConfig.gridWidth,
    gridHeight: gridConfig.gridHeight,
  });
  resizeScalarField(smoke, {
    worldWidth: state.width,
    worldHeight: state.height,
    gridWidth: gridConfig.gridWidth,
    gridHeight: gridConfig.gridHeight,
  });
  resizeScalarField(temp, {
    worldWidth: state.width,
    worldHeight: state.height,
    gridWidth: gridConfig.gridWidth,
    gridHeight: gridConfig.gridHeight,
  });
  resizeObstacleField(obstacles, {
    worldWidth: state.width,
    worldHeight: state.height,
    gridWidth: gridConfig.gridWidth,
    gridHeight: gridConfig.gridHeight,
  });
  resizeSmokeBuffer(gridConfig.gridWidth, gridConfig.gridHeight);
  resizeTempBuffer(gridConfig.gridWidth, gridConfig.gridHeight);
  resizeObstacleBuffer(gridConfig.gridWidth, gridConfig.gridHeight);
  resizeScienceBuffer(gridConfig.gridWidth, gridConfig.gridHeight);
  resizeParticles(particles, {
    count: getParticleCount(),
    width: state.width,
    height: state.height,
  });
  fpsState.lowSamples = 0;
  fpsState.highSamples = 0;
  applyCanvasScale();
  const qualityLabel = auto ? `Quality: ${quality} (Auto)` : `Quality: ${quality}`;
  controls.setQuality(quality, qualityLabel);
}

function getDprCap() {
  if (state.autoLowPower && state.quality === "Low") {
    return 1.5;
  }
  return 2;
}

function applyCanvasScale() {
  const { devicePixelRatio } = window;
  const dprCap = getDprCap();
  state.dpr = Math.min(devicePixelRatio || 1, dprCap);
  canvas.width = Math.floor(state.width * state.dpr);
  canvas.height = Math.floor(state.height * state.dpr);
  canvas.style.width = `${state.width}px`;
  canvas.style.height = `${state.height}px`;
  ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
}

function resizeCanvas() {
  const { innerWidth, innerHeight } = window;
  state.width = innerWidth;
  state.height = innerHeight;
  applyCanvasScale();

  const gridConfig = getGridConfig();
  resizeField(field, {
    worldWidth: state.width,
    worldHeight: state.height,
    gridWidth: gridConfig.gridWidth,
    gridHeight: gridConfig.gridHeight,
  });
  resizeScalarField(smoke, {
    worldWidth: state.width,
    worldHeight: state.height,
    gridWidth: gridConfig.gridWidth,
    gridHeight: gridConfig.gridHeight,
  });
  resizeScalarField(temp, {
    worldWidth: state.width,
    worldHeight: state.height,
    gridWidth: gridConfig.gridWidth,
    gridHeight: gridConfig.gridHeight,
  });
  resizeObstacleField(obstacles, {
    worldWidth: state.width,
    worldHeight: state.height,
    gridWidth: gridConfig.gridWidth,
    gridHeight: gridConfig.gridHeight,
  });
  resizeSmokeBuffer(gridConfig.gridWidth, gridConfig.gridHeight);
  resizeTempBuffer(gridConfig.gridWidth, gridConfig.gridHeight);
  resizeObstacleBuffer(gridConfig.gridWidth, gridConfig.gridHeight);
  resizeScienceBuffer(gridConfig.gridWidth, gridConfig.gridHeight);

  resizeParticles(particles, {
    count: getParticleCount(),
    width: state.width,
    height: state.height,
  });
}

function resetScene() {
  ctx.fillStyle = "#05070d";
  ctx.fillRect(0, 0, state.width, state.height);
  clearField(field);
  clearScalarField(smoke);
  clearScalarField(temp);
  clearObstacles(obstacles);
  clearForceFields();
  seedParticles(particles);
  state.idleTime = 0;
}

function clearForceFields() {
  state.forceFields = [];
  forceFieldId = 0;
  renderForceFieldsList();
}

function addForceField(type, { x, y, dx = 1, dy = 0 } = {}) {
  const defaults = FORCE_FIELD_DEFAULTS[type] ?? FORCE_FIELD_DEFAULTS.attractor;
  const position = getForceFieldPlacement(x, y);
  const direction = normalizeVector(dx, dy);
  const entry = {
    id: (forceFieldId += 1),
    type,
    x: position.x,
    y: position.y,
    dx: direction.x,
    dy: direction.y,
    strength: defaults.strength,
    radius: defaults.radius,
  };
  state.forceFields = [...state.forceFields, entry];
  renderForceFieldsList();
}

function removeForceField(id) {
  state.forceFields = state.forceFields.filter((fieldSource) => fieldSource.id !== id);
  renderForceFieldsList();
}

function getForceFieldPlacement(x, y) {
  if (typeof x === "number" && typeof y === "number") {
    return { x, y };
  }
  if (state.pointer.active) {
    return { x: state.pointer.x, y: state.pointer.y };
  }
  return { x: state.width * 0.5, y: state.height * 0.5 };
}

function normalizeVector(x, y) {
  const length = Math.hypot(x, y);
  if (length < 0.01) {
    return { x: 1, y: 0 };
  }
  return { x: x / length, y: y / length };
}

function renderForceFieldsList() {
  if (!forceFieldsList) {
    return;
  }
  forceFieldsList.innerHTML = "";
  if (state.forceFields.length === 0) {
    const empty = document.createElement("div");
    empty.className = "force-fields-empty";
    empty.textContent = "No fields yet.";
    forceFieldsList.appendChild(empty);
    return;
  }
  state.forceFields.forEach((fieldSource) => {
    const item = document.createElement("div");
    item.className = "force-field-item";
    const label = document.createElement("span");
    label.textContent = formatForceFieldLabel(fieldSource);
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.forceFieldId = String(fieldSource.id);
    button.textContent = "Delete";
    item.appendChild(label);
    item.appendChild(button);
    forceFieldsList.appendChild(item);
  });
}

function formatForceFieldLabel(fieldSource) {
  const defaults = FORCE_FIELD_DEFAULTS[fieldSource.type] ?? FORCE_FIELD_DEFAULTS.attractor;
  const radius = Math.round(fieldSource.radius);
  const strength = Math.round(fieldSource.strength);
  return `${defaults.label} · ${radius}px · ${strength}`;
}

function applyForceFields(fieldToUpdate, dt) {
  if (!state.forceFieldsEnabled || state.forceFields.length === 0) {
    return;
  }
  const { width, height, worldWidth, worldHeight, u, v } = fieldToUpdate;
  if (width < 2 || height < 2) {
    return;
  }
  const cellWidth = worldWidth / (width - 1);
  const cellHeight = worldHeight / (height - 1);

  state.forceFields.forEach((fieldSource) => {
    const { type, x, y, strength, radius } = fieldSource;
    if (type === "dipole") {
      const offset = radius * 0.35;
      const offsetX = fieldSource.dx * offset;
      const offsetY = fieldSource.dy * offset;
      const dipoleStrength = strength * 0.85;
      applyForceFieldSource(
        fieldToUpdate,
        x + offsetX,
        y + offsetY,
        radius,
        dipoleStrength,
        false,
        dt,
        cellWidth,
        cellHeight
      );
      applyForceFieldSource(
        fieldToUpdate,
        x - offsetX,
        y - offsetY,
        radius,
        dipoleStrength,
        true,
        dt,
        cellWidth,
        cellHeight
      );
      return;
    }
    applyForceFieldSource(
      fieldToUpdate,
      x,
      y,
      radius,
      strength,
      type === "repeller",
      dt,
      cellWidth,
      cellHeight
    );
  });
}

function applyForceFieldSource(
  fieldToUpdate,
  centerX,
  centerY,
  radius,
  strength,
  isRepel,
  dt,
  cellWidth,
  cellHeight
) {
  const { width, height, worldWidth, worldHeight, u, v } = fieldToUpdate;
  const gx = (centerX / worldWidth) * (width - 1);
  const gy = (centerY / worldHeight) * (height - 1);
  const rx = (radius / worldWidth) * (width - 1);
  const ry = (radius / worldHeight) * (height - 1);
  const r = Math.max(1, Math.max(rx, ry));
  const r2 = radius * radius;
  const minX = Math.max(0, Math.floor(gx - r));
  const maxX = Math.min(width - 1, Math.ceil(gx + r));
  const minY = Math.max(0, Math.floor(gy - r));
  const maxY = Math.min(height - 1, Math.ceil(gy + r));
  const dirSign = isRepel ? 1 : -1;

  for (let iy = minY; iy <= maxY; iy += 1) {
    const y = iy * cellHeight;
    const dy = y - centerY;
    for (let ix = minX; ix <= maxX; ix += 1) {
      const x = ix * cellWidth;
      const dx = x - centerX;
      const dist2 = dx * dx + dy * dy;
      if (dist2 > r2) {
        continue;
      }
      const dist = Math.sqrt(dist2) + 0.001;
      const falloff = 1 - dist / radius;
      const accel = Math.min(FORCE_FIELD_MAX_ACCEL, (strength * falloff) / (dist2 + FORCE_FIELD_EPS));
      const nx = (dx / dist) * dirSign;
      const ny = (dy / dist) * dirSign;
      const index = iy * width + ix;
      u[index] += nx * accel * dt;
      v[index] += ny * accel * dt;
    }
  }
}

function drawBrushRing() {
  if (!state.pointer.active) {
    return;
  }
  ctx.save();
  ctx.strokeStyle = "rgba(138, 180, 255, 0.7)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(state.pointer.x, state.pointer.y, state.brushRadius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawBackground() {
  const theme = getThemeConfig();
  const strength = clamp(state.trailStrength, 0.2, 1);
  const { r, g, b, alpha } = theme.background;
  ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha * strength})`;
  ctx.fillRect(0, 0, state.width, state.height);
}

function drawParticles(time) {
  switch (state.theme) {
    case "Leaves":
      drawLeafParticles();
      return;
    case "Snow":
      drawSnowParticles();
      return;
    case "Ink":
      drawInkParticles();
      return;
    case "Fireflies":
      drawFireflyParticles(time);
      return;
    default:
      drawClassicParticles();
  }
}

function drawClassicParticles() {
  const { count, x, y, px, py } = particles;
  ctx.save();
  ctx.strokeStyle =
    state.mode === "Smoke"
      ? "rgba(130, 170, 255, 0.18)"
      : "rgba(168, 200, 255, 0.35)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < count; i += 1) {
    ctx.moveTo(px[i], py[i]);
    ctx.lineTo(x[i], y[i]);
  }
  ctx.stroke();
  ctx.restore();
}

function drawLeafParticles() {
  const { count, x, y, px, py } = particles;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const colors = ["rgba(255, 176, 92, 0.55)", "rgba(199, 109, 64, 0.5)"];
  for (let pass = 0; pass < colors.length; pass += 1) {
    ctx.fillStyle = colors[pass];
    ctx.beginPath();
    for (let i = pass; i < count; i += colors.length) {
      const dx = x[i] - px[i];
      const dy = y[i] - py[i];
      const angle = Math.atan2(dy, dx);
      const size = 3 + hashFloat(i) * 4;
      const tipX = x[i] + Math.cos(angle) * size;
      const tipY = y[i] + Math.sin(angle) * size;
      const leftX = x[i] + Math.cos(angle + 2.4) * size * 0.6;
      const leftY = y[i] + Math.sin(angle + 2.4) * size * 0.6;
      const rightX = x[i] + Math.cos(angle - 2.4) * size * 0.6;
      const rightY = y[i] + Math.sin(angle - 2.4) * size * 0.6;
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(leftX, leftY);
      ctx.lineTo(rightX, rightY);
      ctx.closePath();
    }
    ctx.fill();
  }
  ctx.restore();
}

function drawSnowParticles() {
  const { count, x, y } = particles;
  ctx.save();
  ctx.fillStyle = "rgba(220, 236, 255, 0.65)";
  ctx.beginPath();
  for (let i = 0; i < count; i += 1) {
    const radius = 1.5 + hashFloat(i) * 2.4;
    ctx.moveTo(x[i] + radius, y[i]);
    ctx.arc(x[i], y[i], radius, 0, Math.PI * 2);
  }
  ctx.fill();
  ctx.restore();
}

function drawInkParticles() {
  const { count, x, y, px, py } = particles;
  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  ctx.strokeStyle = "rgba(20, 20, 24, 0.45)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (let i = 0; i < count; i += 1) {
    ctx.moveTo(px[i], py[i]);
    ctx.lineTo(x[i], y[i]);
  }
  ctx.stroke();
  ctx.restore();
}

function drawFireflyParticles(time) {
  const { count, x, y } = particles;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = "rgba(170, 255, 200, 0.9)";
  for (let i = 0; i < count; i += 1) {
    const phase = hashFloat(i) * Math.PI * 2;
    const twinkle = 0.35 + 0.65 * Math.sin(time * 2 + phase);
    const alpha = clamp(twinkle, 0, 1) * 0.85;
    const size = 1.2 + hashFloat(i + 9) * 2.2;
    ctx.globalAlpha = alpha;
    ctx.fillRect(x[i] - size * 0.5, y[i] - size * 0.5, size, size);
  }
  ctx.restore();
}

function drawSmoke() {
  const { width, height, data } = smoke;
  const { ctx: bufferCtx, imageData } = smokeBuffer;
  if (!imageData) {
    return;
  }
  const tint = getThemeConfig().smokeTint;
  const pixels = imageData.data;
  for (let i = 0; i < data.length; i += 1) {
    const density = Math.min(data[i], 1.4);
    const alpha = Math.min(255, density * tint.alpha);
    const offset = i * 4;
    pixels[offset] = tint.r;
    pixels[offset + 1] = tint.g;
    pixels[offset + 2] = tint.b;
    pixels[offset + 3] = alpha;
  }
  bufferCtx.putImageData(imageData, 0, 0);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.drawImage(smokeBuffer.canvas, 0, 0, width, height, 0, 0, state.width, state.height);
  ctx.restore();
}

function drawTempOverlay() {
  if (!state.showTempOverlay) {
    return;
  }
  const { width, height, data } = temp;
  const { ctx: bufferCtx, imageData } = tempBuffer;
  if (!imageData) {
    return;
  }
  const pixels = imageData.data;
  for (let i = 0; i < data.length; i += 1) {
    const value = clamp(data[i], -1.2, 1.2);
    const intensity = Math.min(1, Math.abs(value));
    const alpha = Math.round(intensity * 140);
    const offset = i * 4;
    if (value >= 0) {
      pixels[offset] = 255;
      pixels[offset + 1] = 110;
      pixels[offset + 2] = 90;
    } else {
      pixels[offset] = 90;
      pixels[offset + 1] = 140;
      pixels[offset + 2] = 255;
    }
    pixels[offset + 3] = alpha;
  }
  bufferCtx.putImageData(imageData, 0, 0);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.drawImage(tempBuffer.canvas, 0, 0, width, height, 0, 0, state.width, state.height);
  ctx.restore();
}

function drawObstacleOverlay() {
  if (!state.showObstacleOverlay) {
    return;
  }
  const { width, height, data } = obstacles;
  const { ctx: bufferCtx, imageData } = obstacleBuffer;
  if (!imageData) {
    return;
  }
  const pixels = imageData.data;
  for (let i = 0; i < data.length; i += 1) {
    const offset = i * 4;
    if (data[i]) {
      pixels[offset] = 180;
      pixels[offset + 1] = 190;
      pixels[offset + 2] = 210;
      pixels[offset + 3] = 120;
    } else {
      pixels[offset] = 0;
      pixels[offset + 1] = 0;
      pixels[offset + 2] = 0;
      pixels[offset + 3] = 0;
    }
  }
  bufferCtx.putImageData(imageData, 0, 0);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.drawImage(obstacleBuffer.canvas, 0, 0, width, height, 0, 0, state.width, state.height);
  ctx.restore();
}

function drawScienceOverlay() {
  if (state.scienceOverlay === "Off") {
    return;
  }
  switch (state.scienceOverlay) {
    case "Arrows":
      drawScienceArrows();
      return;
    case "Streamlines":
      drawScienceStreamlines();
      return;
    case "Vorticity":
      drawScienceVorticity();
      return;
    default:
      return;
  }
}

function drawScienceArrows() {
  const { width, height, u, v } = field;
  if (width < 2 || height < 2) {
    return;
  }
  const config = getOverlayConfig();
  const stepX = Math.max(1, Math.round(width / config.arrowCols));
  const stepY = Math.max(1, Math.round(height / config.arrowRows));
  const scale = config.arrowScale;

  ctx.save();
  ctx.strokeStyle = "rgba(120, 200, 255, 0.65)";
  ctx.lineWidth = 1;
  ctx.globalCompositeOperation = "lighter";

  for (let iy = 0; iy < height; iy += stepY) {
    const y = (iy / (height - 1)) * state.height;
    for (let ix = 0; ix < width; ix += stepX) {
      const index = iy * width + ix;
      const vx = u[index];
      const vy = v[index];
      const mag = Math.hypot(vx, vy);
      if (mag < config.arrowMinSpeed) {
        continue;
      }
      const x = (ix / (width - 1)) * state.width;
      const nx = x + vx * scale;
      const ny = y + vy * scale;
      const angle = Math.atan2(vy, vx);
      const head = 4;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(nx, ny);
      ctx.lineTo(nx - Math.cos(angle - Math.PI / 6) * head, ny - Math.sin(angle - Math.PI / 6) * head);
      ctx.moveTo(nx, ny);
      ctx.lineTo(nx - Math.cos(angle + Math.PI / 6) * head, ny - Math.sin(angle + Math.PI / 6) * head);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawScienceStreamlines() {
  const { width, height } = field;
  if (width < 2 || height < 2) {
    return;
  }
  const config = getOverlayConfig();
  const spacing = config.streamlineSpacing;
  const steps = config.streamlineSteps;
  const stepSize = config.streamlineStepSize;

  ctx.save();
  ctx.strokeStyle = "rgba(140, 220, 255, 0.5)";
  ctx.lineWidth = 1;
  ctx.globalCompositeOperation = "lighter";

  const sample = { vx: 0, vy: 0 };
  for (let y = spacing * 0.5; y < state.height; y += spacing) {
    for (let x = spacing * 0.5; x < state.width; x += spacing) {
      let cx = x;
      let cy = y;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      for (let i = 0; i < steps; i += 1) {
        sampleFieldAt(field, cx, cy, sample);
        const mag = Math.hypot(sample.vx, sample.vy);
        if (mag < config.streamlineMinSpeed) {
          break;
        }
        const nx = cx + sample.vx * stepSize;
        const ny = cy + sample.vy * stepSize;
        ctx.lineTo(nx, ny);
        cx = nx;
        cy = ny;
        if (cx < 0 || cx > state.width || cy < 0 || cy > state.height) {
          break;
        }
      }
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawScienceVorticity() {
  const { width, height, u, v } = field;
  const { ctx: bufferCtx, imageData } = scienceBuffer;
  if (!imageData || width < 3 || height < 3) {
    return;
  }
  const config = getOverlayConfig();
  const pixels = imageData.data;
  const maxCurl = config.vorticityMax;
  for (let y = 0; y < height; y += 1) {
    const yOffset = y * width;
    const yMinus = Math.max(0, y - 1) * width;
    const yPlus = Math.min(height - 1, y + 1) * width;
    for (let x = 0; x < width; x += 1) {
      const xMinus = Math.max(0, x - 1);
      const xPlus = Math.min(width - 1, x + 1);
      const index = yOffset + x;
      const dvx = v[yOffset + xPlus] - v[yOffset + xMinus];
      const duy = u[yPlus + x] - u[yMinus + x];
      const curl = dvx - duy;
      const normalized = clamp(curl / maxCurl, -1, 1);
      const intensity = Math.abs(normalized);
      const alpha = Math.round(intensity * config.vorticityAlpha);
      const offset = index * 4;
      if (normalized >= 0) {
        pixels[offset] = 255;
        pixels[offset + 1] = 140;
        pixels[offset + 2] = 120;
      } else {
        pixels[offset] = 120;
        pixels[offset + 1] = 170;
        pixels[offset + 2] = 255;
      }
      pixels[offset + 3] = alpha;
    }
  }
  bufferCtx.putImageData(imageData, 0, 0);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.drawImage(scienceBuffer.canvas, 0, 0, width, height, 0, 0, state.width, state.height);
  ctx.restore();
}

function drawFieldDebug() {
  if (!state.showField) {
    return;
  }
  const { width, height, u, v } = field;
  if (width < 2 || height < 2) {
    return;
  }
  const stepX = Math.max(1, Math.round(width / 28));
  const stepY = Math.max(1, Math.round(height / 18));
  const scale = 0.02;

  ctx.save();
  ctx.strokeStyle = "rgba(138, 180, 255, 0.6)";
  ctx.lineWidth = 1;
  ctx.globalCompositeOperation = "lighter";
  ctx.beginPath();
  for (let iy = 0; iy < height; iy += stepY) {
    const y = (iy / (height - 1)) * state.height;
    for (let ix = 0; ix < width; ix += stepX) {
      const index = iy * width + ix;
      const vx = u[index];
      const vy = v[index];
      if (Math.abs(vx) + Math.abs(vy) < 5) {
        continue;
      }
      const x = (ix / (width - 1)) * state.width;
      ctx.moveTo(x, y);
      ctx.lineTo(x + vx * scale, y + vy * scale);
    }
  }
  ctx.stroke();
  ctx.restore();
}

function stepSimulation() {
  if (state.idleTime > IDLE_ATTRACT_MS) {
    applyIdleWind(state.lastFrame);
  }
  const damping = state.windMemory ? MEMORY_DAMPING : FIELD_DAMPING;
  applyDamping(field, damping);
  if (state.windMemory) {
    diffuseField(field, MEMORY_DIFFUSION);
  }
  applyForceFields(field, SIM_STEP);
  applyObstaclesToField(field, obstacles, 0.25);
  if (state.physicsMode === "Wind+Temperature") {
    advectScalar(temp, field, SIM_STEP, TEMP_DISSIPATION, obstacles);
    applyBuoyancy(field, temp, state.buoyancyStrength, SIM_STEP);
  }
  if (state.mode === "Particles") {
    stepParticles(particles, field, SIM_STEP, state.lastFrame / 1000, {
      ...getThemeConfig().particleOptions,
      obstacles,
    });
  } else {
    advectScalar(smoke, field, SIM_STEP, SMOKE_DISSIPATION, obstacles);
  }
}

function render(now) {
  const elapsedMs = now - state.lastFrame;
  state.lastFrame = now;
  state.idleTime += elapsedMs;

  state.accumulator += elapsedMs / 1000;
  while (state.accumulator >= SIM_STEP) {
    stepSimulation();
    state.accumulator -= SIM_STEP;
  }

  updateFps(now);
  drawBackground();
  if (state.mode === "Particles") {
    drawParticles(now / 1000);
  } else {
    drawSmoke();
  }
  drawTempOverlay();
  drawObstacleOverlay();
  drawScienceOverlay();
  drawFieldDebug();
  drawBrushRing();
  updateAudio(now);

  requestAnimationFrame(render);
}

function applyIdleWind(now) {
  const t = now / 1000;
  const baseX = state.width * 0.5;
  const baseY = state.height * 0.5;
  const orbitX = Math.sin(t * 0.35 + state.idleSeed) * state.width * 0.22;
  const orbitY = Math.cos(t * 0.4 + state.idleSeed * 0.7) * state.height * 0.18;
  const x = baseX + orbitX;
  const y = baseY + orbitY;
  const angle = t * 0.8 + state.idleSeed;
  const vx = Math.cos(angle) * IDLE_WIND_SPEED;
  const vy = Math.sin(angle) * IDLE_WIND_SPEED;
  addVelocity(field, x, y, vx, vy, IDLE_WIND_RADIUS, IDLE_SWIRL_STRENGTH);
  if (state.mode === "Smoke") {
    addScalar(smoke, x, y, IDLE_SMOKE_AMOUNT, IDLE_WIND_RADIUS * 0.7, obstacles);
  }
}

function injectWind(point, strength = 1) {
  let vx = point.vx;
  let vy = point.vy;
  if (state.brushMode === "Vortex") {
    const rotatedX = -vy;
    const rotatedY = vx;
    vx = rotatedX;
    vy = rotatedY;
  }
  const scaledVx = clamp(vx * 1000, -MAX_WIND_SPEED, MAX_WIND_SPEED);
  const scaledVy = clamp(vy * 1000, -MAX_WIND_SPEED, MAX_WIND_SPEED);
  addVelocity(field, point.x, point.y, scaledVx, scaledVy, state.brushRadius, strength);
}

function injectSmoke(point, amount = 1) {
  addScalar(smoke, point.x, point.y, amount, state.brushRadius * 0.9, obstacles);
}

function injectTemperature(point, amount) {
  addScalar(temp, point.x, point.y, amount, state.brushRadius * 0.9, obstacles);
}

function injectObstacle(point, add = true) {
  paintObstacle(obstacles, point.x, point.y, state.brushRadius * 0.9, add);
}

function resolveTempMode(point) {
  if (state.physicsMode !== "Wind+Temperature") {
    return 0;
  }
  if (point.altKey) {
    return -1;
  }
  if (point.longPress || point.shiftKey) {
    return 1;
  }
  return 0;
}

function applyBuoyancy(fieldToUpdate, tempField, strength, dt) {
  const { v } = fieldToUpdate;
  const tempData = tempField.data;
  const factor = strength * BUOYANCY_SCALE * dt;
  for (let i = 0; i < v.length; i += 1) {
    v[i] += tempData[i] * factor;
  }
}

function getThemeConfig() {
  return THEMES[state.theme] ?? THEMES.Classic;
}

function getGridConfig() {
  const cellSize = state.quality === "High" ? 20 : 28;
  const gridWidth = Math.max(24, Math.round(state.width / cellSize));
  const gridHeight = Math.max(18, Math.round(state.height / cellSize));
  return { gridWidth, gridHeight };
}

function getParticleCount() {
  const base = state.quality === "High" ? 22000 : 12000;
  const scale = getThemeConfig().particleScale ?? 1;
  return Math.max(6000, Math.round(base * scale));
}

function resizeSmokeBuffer(width, height) {
  smokeBuffer.canvas.width = width;
  smokeBuffer.canvas.height = height;
  smokeBuffer.imageData = smokeBuffer.ctx.createImageData(width, height);
}

function resizeTempBuffer(width, height) {
  tempBuffer.canvas.width = width;
  tempBuffer.canvas.height = height;
  tempBuffer.imageData = tempBuffer.ctx.createImageData(width, height);
}

function resizeObstacleBuffer(width, height) {
  obstacleBuffer.canvas.width = width;
  obstacleBuffer.canvas.height = height;
  obstacleBuffer.imageData = obstacleBuffer.ctx.createImageData(width, height);
}

function resizeScienceBuffer(width, height) {
  scienceBuffer.canvas.width = width;
  scienceBuffer.canvas.height = height;
  scienceBuffer.imageData = scienceBuffer.ctx.createImageData(width, height);
}

function setFpsMeter(enabled) {
  fpsState.enabled = enabled;
  if (!fpsMeter) {
    return;
  }
  fpsMeter.style.display = enabled ? "block" : "none";
  fpsMeter.setAttribute("aria-hidden", String(!enabled));
}

function updateFps(now) {
  fpsState.frameCount += 1;
  const elapsed = now - fpsState.lastSample;
  if (elapsed < FPS_SAMPLE_MS) {
    return;
  }
  const fps = (fpsState.frameCount * 1000) / elapsed;
  fpsState.fps = fps;
  fpsState.frameCount = 0;
  fpsState.lastSample = now;

  if (!fpsState.inLowPower && state.quality === "High") {
    if (fps < LOW_POWER_FPS) {
      fpsState.lowSamples += 1;
    } else {
      fpsState.lowSamples = 0;
    }
    if (fpsState.lowSamples >= LOW_POWER_SAMPLES) {
      fpsState.inLowPower = true;
      fpsState.highSamples = 0;
      applyQuality("Low", { auto: true });
    }
  } else if (fpsState.inLowPower && state.autoLowPower) {
    if (fps > HIGH_POWER_FPS) {
      fpsState.highSamples += 1;
    } else {
      fpsState.highSamples = 0;
    }
    if (fpsState.highSamples >= HIGH_POWER_SAMPLES) {
      fpsState.inLowPower = false;
      applyQuality("High", { auto: true });
    }
  } else {
    fpsState.highSamples = 0;
  }

  if (fpsState.enabled && fpsMeter) {
    const suffix = fpsState.inLowPower ? " · Low power" : "";
    fpsMeter.textContent = `FPS ${fps.toFixed(0)}${suffix}`;
  }
}

initGestures(canvas, {
  onStrokeStart: (point) => {
    handleUserGestureAudio();
    state.pointer.active = true;
    state.pointer.x = point.x;
    state.pointer.y = point.y;
    state.pointer.vx = point.vx;
    state.pointer.vy = point.vy;
    state.idleTime = 0;
    if (state.toolMode === "Obstacles") {
      injectObstacle(point, !state.eraseObstacles);
      return;
    }
    injectWind(point, 0.9);
    const tempMode = resolveTempMode(point);
    if (tempMode !== 0) {
      injectTemperature(point, TEMP_INJECTION * tempMode);
    }
    if (state.mode === "Smoke") {
      injectSmoke(point, 0.35);
    }
  },
  onStrokeMove: (point) => {
    handleUserGestureAudio();
    state.pointer.active = true;
    state.pointer.x = point.x;
    state.pointer.y = point.y;
    state.pointer.vx = point.vx;
    state.pointer.vy = point.vy;
    state.idleTime = 0;
    if (state.toolMode === "Obstacles") {
      injectObstacle(point, !state.eraseObstacles);
      return;
    }
    injectWind(point, 1);
    const tempMode = resolveTempMode(point);
    if (tempMode !== 0) {
      injectTemperature(point, TEMP_INJECTION * tempMode);
    }
    if (state.mode === "Smoke") {
      injectSmoke(point, 0.4);
    }
  },
  onStrokeEnd: () => {
    state.pointer.active = false;
  },
  onTap: (point) => {
    handleUserGestureAudio();
    state.pointer.active = true;
    state.pointer.x = point.x;
    state.pointer.y = point.y;
    state.pointer.vx = point.vx * 2;
    state.pointer.vy = point.vy * 2;
    if (state.toolMode === "Obstacles") {
      injectObstacle(point, !state.eraseObstacles);
      setTimeout(() => {
        state.pointer.active = false;
      }, 120);
      return;
    }
    const gustAngle = Math.random() * Math.PI * 2;
    const gust = {
      x: point.x,
      y: point.y,
      vx: Math.cos(gustAngle) * GUST_SPEED,
      vy: Math.sin(gustAngle) * GUST_SPEED,
    };
    addVelocity(field, gust.x, gust.y, gust.vx, gust.vy, state.brushRadius * 1.2, 1.3);
    if (state.mode === "Smoke") {
      injectSmoke(point, 0.7);
    }
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
    setTimeout(() => {
      state.pointer.active = false;
    }, 120);
  },
  onDoubleTap: (point) => {
    if (!state.proEnabled) {
      return;
    }
    addForceField("attractor", point);
    if (navigator.vibrate) {
      navigator.vibrate(8);
    }
  },
  onTripleTap: (point) => {
    if (!state.proEnabled) {
      return;
    }
    addForceField("repeller", point);
    if (navigator.vibrate) {
      navigator.vibrate([6, 20, 6]);
    }
  },
  onTwoFingerTap: (point) => {
    handleUserGestureAudio();
    if (state.physicsMode !== "Wind+Temperature") {
      return;
    }
    injectTemperature(point, -TEMP_INJECTION * TEMP_TAP_BOOST);
  },
  onTwoFingerLongPress: (point) => {
    if (!state.proEnabled) {
      return;
    }
    addForceField("dipole", point);
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  },
  onPinch: (delta) => {
    handleUserGestureAudio();
    state.brushRadius = clamp(state.brushRadius + delta * 0.2, 12, 160);
  },
  onWheel: (delta) => {
    handleUserGestureAudio();
    state.brushRadius = clamp(state.brushRadius + delta * -0.02, 12, 160);
  },
});

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function sampleFieldAt(fieldToSample, x, y, out) {
  const { width, height, worldWidth, worldHeight, u, v } = fieldToSample;
  const gx = (x / worldWidth) * (width - 1);
  const gy = (y / worldHeight) * (height - 1);
  const x0 = Math.floor(gx);
  const y0 = Math.floor(gy);
  const x1 = Math.min(width - 1, x0 + 1);
  const y1 = Math.min(height - 1, y0 + 1);
  const tx = gx - x0;
  const ty = gy - y0;
  const idx00 = y0 * width + x0;
  const idx10 = y0 * width + x1;
  const idx01 = y1 * width + x0;
  const idx11 = y1 * width + x1;
  const u0 = lerp(u[idx00], u[idx10], tx);
  const u1 = lerp(u[idx01], u[idx11], tx);
  const v0 = lerp(v[idx00], v[idx10], tx);
  const v1 = lerp(v[idx01], v[idx11], tx);
  out.vx = lerp(u0, u1, ty);
  out.vy = lerp(v0, v1, ty);
  return out;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function getOverlayConfig() {
  const lowPower = fpsState.inLowPower || state.quality === "Low";
  return {
    arrowCols: lowPower ? 16 : 22,
    arrowRows: lowPower ? 10 : 16,
    arrowScale: lowPower ? 0.018 : 0.022,
    arrowMinSpeed: lowPower ? 30 : 20,
    streamlineSpacing: lowPower ? 120 : 90,
    streamlineSteps: lowPower ? 12 : 18,
    streamlineStepSize: lowPower ? 0.012 : 0.016,
    streamlineMinSpeed: lowPower ? 18 : 12,
    vorticityMax: lowPower ? 900 : 700,
    vorticityAlpha: lowPower ? 110 : 140,
  };
}

function hashFloat(index) {
  let x = index + 1;
  x = (x ^ (x >>> 16)) * 0x7feb352d;
  x = (x ^ (x >>> 15)) * 0x846ca68b;
  x ^= x >>> 16;
  return (x >>> 0) / 4294967295;
}

window.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "f") {
    setFpsMeter(!fpsState.enabled);
  }
  if (event.key.toLowerCase() === "e") {
    state.eraseObstacles = true;
  }
});

window.addEventListener("keyup", (event) => {
  if (event.key.toLowerCase() === "e") {
    state.eraseObstacles = false;
  }
});

window.addEventListener("resize", () => {
  resizeCanvas();
  resetScene();
});

if (urlParams.has("fps")) {
  setFpsMeter(true);
}

let shareTimeout = 0;

async function handleShare() {
  if (!controls.setShareLabel) {
    return;
  }
  if (shareTimeout) {
    window.clearTimeout(shareTimeout);
    shareTimeout = 0;
  }
  const result = await shareLink();
  if (result === "canceled") {
    return;
  }
  const label = result === "shared" ? "Shared!" : result === "copied" ? "Copied!" : "Copy failed";
  controls.setShareLabel(label);
  shareTimeout = window.setTimeout(() => {
    controls.setShareLabel("Share");
  }, 1400);
}

async function shareLink() {
  const url = window.location.href;
  if (navigator.share) {
    try {
      await navigator.share({ title: document.title, url });
      return "shared";
    } catch (error) {
      if (error?.name === "AbortError") {
        return "canceled";
      }
    }
  }
  const copied = await copyToClipboard(url);
  return copied ? "copied" : "failed";
}

async function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      // Fallback to manual copy below.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);
  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch (error) {
    copied = false;
  }
  document.body.removeChild(textarea);
  return copied;
}

resizeCanvas();
resetScene();
requestAnimationFrame(render);

controls.setStatus("Mode: Particles", "Quality: High");
controls.setBrush(state.brushMode);
controls.setTool(state.toolMode);
controls.setField(false);
controls.setWindMemory(false);
controls.setPhysics("Wind");
controls.setTempOverlay(false);
controls.setObstacleOverlay(false);
controls.setBuoyancy(state.buoyancyStrength);
controls.setTheme(state.theme);
controls.setScienceOverlay(state.scienceOverlay);
controls.setSound(state.soundEnabled);
controls.setSoundVolume(state.soundVolume);
controls.setForceFields(state.forceFieldsEnabled);

function handleUserGestureAudio() {
  if (state.soundEnabled) {
    syncAudioState();
  }
}

function ensureAudioContext() {
  if (audioState.ctx) {
    return audioState.ctx;
  }
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    return null;
  }
  const ctx = new AudioContextClass();
  const masterGain = ctx.createGain();
  const toneGain = ctx.createGain();
  const noiseGain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 500;
  filter.Q.value = 0.7;

  const osc1 = ctx.createOscillator();
  osc1.type = "sine";
  osc1.frequency.value = 140;
  const osc2 = ctx.createOscillator();
  osc2.type = "triangle";
  osc2.frequency.value = 220;

  toneGain.gain.value = 0.28;
  noiseGain.gain.value = 0.08;
  masterGain.gain.value = 0;

  const noise = createNoiseSource(ctx);
  osc1.connect(toneGain);
  osc2.connect(toneGain);
  toneGain.connect(filter);
  noise.connect(noiseGain);
  noiseGain.connect(filter);
  filter.connect(masterGain);
  masterGain.connect(ctx.destination);

  osc1.start();
  osc2.start();
  noise.start();

  audioState.ctx = ctx;
  audioState.masterGain = masterGain;
  audioState.toneGain = toneGain;
  audioState.noiseGain = noiseGain;
  audioState.filter = filter;
  audioState.osc1 = osc1;
  audioState.osc2 = osc2;
  audioState.noise = noise;
  return ctx;
}

function createNoiseSource(ctx) {
  const bufferSize = ctx.sampleRate * 1.5;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  return source;
}

function syncAudioState() {
  if (!state.soundEnabled) {
    if (audioState.ctx) {
      audioState.masterGain?.gain.setTargetAtTime(0, audioState.ctx.currentTime, 0.2);
      audioState.ctx.suspend().catch(() => {});
    }
    return;
  }
  const ctx = ensureAudioContext();
  if (!ctx) {
    return;
  }
  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }
  updateAudioVolume();
}

function updateAudioVolume() {
  if (!audioState.ctx || !audioState.masterGain) {
    return;
  }
  const base = AUDIO_BASE_GAIN * state.soundVolume;
  const intensity = clamp(0.2 + audioState.speedLevel * 0.8, 0.1, 1);
  const target = state.soundEnabled ? base * intensity : 0;
  audioState.masterGain.gain.setTargetAtTime(target, audioState.ctx.currentTime, 0.15);
}

function updateAudio(now) {
  if (!state.soundEnabled || !audioState.ctx) {
    return;
  }
  const ctx = audioState.ctx;
  if (ctx.state !== "running") {
    return;
  }
  if (now - audioState.lastSample < AUDIO_SAMPLE_MS) {
    return;
  }
  audioState.lastSample = now;
  const stats = sampleFlowStats();
  audioState.speedLevel = stats.speed;
  audioState.vorticityLevel = stats.vorticity;
  const freq = AUDIO_MIN_FREQ + (AUDIO_MAX_FREQ - AUDIO_MIN_FREQ) * stats.vorticity;
  audioState.filter.frequency.setTargetAtTime(freq, ctx.currentTime, 0.2);
  audioState.osc1.frequency.setTargetAtTime(140 + stats.speed * 80, ctx.currentTime, 0.2);
  audioState.osc2.frequency.setTargetAtTime(220 + stats.speed * 140, ctx.currentTime, 0.2);
  updateAudioVolume();
}

function sampleFlowStats() {
  const { width, height, u, v } = field;
  if (width < 3 || height < 3) {
    return { speed: 0, vorticity: 0 };
  }
  const step = Math.max(2, Math.round(Math.max(width, height) / 26));
  let speedSum = 0;
  let vorticitySum = 0;
  let samples = 0;
  for (let iy = 1; iy < height - 1; iy += step) {
    const row = iy * width;
    for (let ix = 1; ix < width - 1; ix += step) {
      const index = row + ix;
      const vx = u[index];
      const vy = v[index];
      speedSum += Math.hypot(vx, vy);
      const dvx = u[index + width] - u[index - width];
      const dvy = v[index + 1] - v[index - 1];
      const curl = dvy - dvx;
      vorticitySum += Math.abs(curl);
      samples += 1;
    }
  }
  if (!samples) {
    return { speed: 0, vorticity: 0 };
  }
  const meanSpeed = speedSum / samples;
  const meanVorticity = vorticitySum / samples;
  const speedLevel = clamp(meanSpeed / MAX_WIND_SPEED, 0, 1);
  const vorticityLevel = clamp(meanVorticity / (MAX_WIND_SPEED * 0.4), 0, 1);
  return { speed: speedLevel, vorticity: vorticityLevel };
}
