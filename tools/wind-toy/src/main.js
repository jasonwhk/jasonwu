import { initControls } from "./ui/controls.js";
import { initGestures } from "./ui/gestures.js";
import { addVelocity, applyDamping, clearField, createField, resizeField } from "./sim/field.js";
import { createParticles, resizeParticles, seedParticles, stepParticles } from "./sim/particles.js";

const canvas = document.querySelector("#wind-canvas");
const ctx = canvas.getContext("2d", { alpha: false });

const SIM_STEP = 1 / 60;
const FIELD_DAMPING = 0.96;
const MAX_WIND_SPEED = 1600;
const GUST_SPEED = 1200;

const state = {
  width: 0,
  height: 0,
  dpr: 1,
  brushRadius: 42,
  mode: "Particles",
  quality: "High",
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
};

const field = createField({
  worldWidth: 1,
  worldHeight: 1,
  gridWidth: 24,
  gridHeight: 24,
});
const particles = createParticles();

const controls = initControls({
  onReset: () => resetScene(),
  onModeToggle: (mode) => {
    state.mode = mode;
  },
  onQualityToggle: (quality) => {
    state.quality = quality;
    const gridConfig = getGridConfig();
    resizeField(field, {
      worldWidth: state.width,
      worldHeight: state.height,
      gridWidth: gridConfig.gridWidth,
      gridHeight: gridConfig.gridHeight,
    });
    resizeParticles(particles, {
      count: getParticleCount(),
      width: state.width,
      height: state.height,
    });
  },
});

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
  ctx.fillStyle = "rgba(5, 7, 13, 0.2)";
  ctx.fillRect(0, 0, state.width, state.height);
}

function drawParticles() {
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

function stepSimulation() {
  applyDamping(field, FIELD_DAMPING);
  stepParticles(particles, field, SIM_STEP, state.lastFrame / 1000);
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

  drawBackground();
  drawParticles();
  drawBrushRing();

  requestAnimationFrame(render);
}

function injectWind(point, strength = 1) {
  const vx = clamp(point.vx * 1000, -MAX_WIND_SPEED, MAX_WIND_SPEED);
  const vy = clamp(point.vy * 1000, -MAX_WIND_SPEED, MAX_WIND_SPEED);
  addVelocity(field, point.x, point.y, vx, vy, state.brushRadius, strength);
}

function getGridConfig() {
  const cellSize = state.quality === "High" ? 20 : 28;
  const gridWidth = Math.max(24, Math.round(state.width / cellSize));
  const gridHeight = Math.max(18, Math.round(state.height / cellSize));
  return { gridWidth, gridHeight };
}

function getParticleCount() {
  return state.quality === "High" ? 22000 : 12000;
}

initGestures(canvas, {
  onStrokeStart: (point) => {
    state.pointer.active = true;
    state.pointer.x = point.x;
    state.pointer.y = point.y;
    state.pointer.vx = point.vx;
    state.pointer.vy = point.vy;
    state.idleTime = 0;
    injectWind(point, 0.9);
  },
  onStrokeMove: (point) => {
    state.pointer.active = true;
    state.pointer.x = point.x;
    state.pointer.y = point.y;
    state.pointer.vx = point.vx;
    state.pointer.vy = point.vy;
    state.idleTime = 0;
    injectWind(point, 1);
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
    const gustAngle = Math.random() * Math.PI * 2;
    const gust = {
      x: point.x,
      y: point.y,
      vx: Math.cos(gustAngle) * GUST_SPEED,
      vy: Math.sin(gustAngle) * GUST_SPEED,
    };
    addVelocity(field, gust.x, gust.y, gust.vx, gust.vy, state.brushRadius * 1.2, 1.3);
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
    setTimeout(() => {
      state.pointer.active = false;
    }, 120);
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

window.addEventListener("resize", () => {
  resizeCanvas();
  resetScene();
});

resizeCanvas();
resetScene();
requestAnimationFrame(render);

controls.setStatus("Mode: Particles", "Quality: High");
