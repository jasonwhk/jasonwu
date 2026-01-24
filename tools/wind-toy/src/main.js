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

const THEMES = {
  Classic: {
    label: "Classic",
    particleScale: 1,
    background: "rgba(5, 7, 13, 0.2)",
    particleOptions: { drag: 0.18, noise: 18, speedScale: 1, gravity: 0 },
    smokeTint: { r: 150, g: 190, b: 255, alpha: 180 },
  },
  Leaves: {
    label: "Autumn Leaves",
    particleScale: 0.85,
    background: "rgba(12, 9, 6, 0.22)",
    particleOptions: { drag: 0.22, noise: 22, speedScale: 0.9, gravity: 0 },
    smokeTint: { r: 210, g: 150, b: 120, alpha: 140 },
  },
  Snow: {
    label: "Snow",
    particleScale: 0.8,
    background: "rgba(7, 10, 16, 0.2)",
    particleOptions: { drag: 0.28, noise: 6, speedScale: 0.6, gravity: 48 },
    smokeTint: { r: 190, g: 210, b: 240, alpha: 130 },
  },
  Ink: {
    label: "Ink",
    particleScale: 0.9,
    background: "rgba(244, 240, 233, 0.26)",
    particleOptions: { drag: 0.16, noise: 12, speedScale: 0.95, gravity: 0 },
    smokeTint: { r: 30, g: 32, b: 40, alpha: 170 },
  },
  Fireflies: {
    label: "Fireflies",
    particleScale: 0.7,
    background: "rgba(4, 7, 12, 0.16)",
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
  eraseObstacles: false,
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

const fpsState = {
  enabled: false,
  lastSample: performance.now(),
  frameCount: 0,
  fps: 60,
  lowSamples: 0,
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
const fpsMeter = document.querySelector("#fps-meter");

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
  onToolToggle: (mode) => {
    state.toolMode = mode;
  },
  onObstacleOverlayToggle: (enabled) => {
    state.showObstacleOverlay = enabled;
  },
  onClearObstacles: () => {
    clearObstacles(obstacles);
  },
  onShare: () => {
    handleShare();
  },
  onBrushToggle: (mode) => {
    state.brushMode = mode;
  },
});

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
  resizeParticles(particles, {
    count: getParticleCount(),
    width: state.width,
    height: state.height,
  });
  const qualityLabel = auto ? `Quality: ${quality} (Auto)` : `Quality: ${quality}`;
  controls.setQuality(quality, qualityLabel);
}

function resizeCanvas() {
  const { innerWidth, innerHeight, devicePixelRatio } = window;
  state.dpr = Math.min(devicePixelRatio || 1, 2);
  state.width = innerWidth;
  state.height = innerHeight;
  canvas.width = Math.floor(innerWidth * state.dpr);
  canvas.height = Math.floor(innerHeight * state.dpr);
  canvas.style.width = `${innerWidth}px`;
  canvas.style.height = `${innerHeight}px`;
  ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);

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
  seedParticles(particles);
  state.idleTime = 0;
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
  ctx.fillStyle = theme.background;
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
  drawFieldDebug();
  drawBrushRing();

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
      applyQuality("Low", { auto: true });
    }
  }

  if (fpsState.enabled && fpsMeter) {
    const suffix = fpsState.inLowPower ? " · Low power" : "";
    fpsMeter.textContent = `FPS ${fps.toFixed(0)}${suffix}`;
  }
}

initGestures(canvas, {
  onStrokeStart: (point) => {
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
  onTwoFingerTap: (point) => {
    if (state.physicsMode !== "Wind+Temperature") {
      return;
    }
    injectTemperature(point, -TEMP_INJECTION * TEMP_TAP_BOOST);
  },
  onPinch: (delta) => {
    state.brushRadius = clamp(state.brushRadius + delta * 0.2, 12, 160);
  },
  onWheel: (delta) => {
    state.brushRadius = clamp(state.brushRadius + delta * -0.02, 12, 160);
  },
});

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
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

const urlParams = new URLSearchParams(window.location.search);
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
