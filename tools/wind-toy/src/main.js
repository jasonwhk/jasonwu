import { initControls } from "./ui/controls.js";
import { initGestures } from "./ui/gestures.js";
import { addVelocity, applyDamping, clearField, createField, resizeField } from "./sim/field.js";

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
}

function resetScene() {
  ctx.fillStyle = "#05070d";
  ctx.fillRect(0, 0, state.width, state.height);
  clearField(field);
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
  ctx.fillStyle = "rgba(5, 7, 13, 0.35)";
  ctx.fillRect(0, 0, state.width, state.height);
}

function drawFieldVectors() {
  const { width, height, u, v } = field;
  const step = state.quality === "High" ? 2 : 3;
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineWidth = 1.5;
  for (let gy = 0; gy < height; gy += step) {
    const y = (gy / (height - 1)) * state.height;
    for (let gx = 0; gx < width; gx += step) {
      const index = gy * width + gx;
      const vx = u[index];
      const vy = v[index];
      const speed = Math.hypot(vx, vy);
      if (speed < 8) {
        continue;
      }
      const x = (gx / (width - 1)) * state.width;
      const length = clamp(speed * 0.02, 2, 18);
      const angle = Math.atan2(vy, vx);
      const alpha = clamp(speed / 800, 0.08, 0.65);
      ctx.strokeStyle = `rgba(120, 180, 255, ${alpha})`;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function stepSimulation() {
  applyDamping(field, FIELD_DAMPING);
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
  drawFieldVectors();
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
