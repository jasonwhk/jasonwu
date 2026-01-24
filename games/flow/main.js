const canvas = document.getElementById("flow-canvas");
const ctx = canvas.getContext("2d", { alpha: false });
const modePill = document.getElementById("modePill");
const modeList = document.getElementById("modeList");
const modeItems = Array.from(document.querySelectorAll(".mode-item"));
const hud = document.getElementById("hud");
const fpsLabel = document.getElementById("fps");
const countLabel = document.getElementById("count");

const MODES = ["FLOW", "GRAVITY", "ORBIT", "REPEL", "MAGNET", "FIREWORKS"];
const MODE_COLORS = {
  FLOW: "rgba(130, 180, 255, 0.8)",
  GRAVITY: "rgba(180, 140, 255, 0.85)",
  ORBIT: "rgba(120, 255, 220, 0.8)",
  REPEL: "rgba(255, 140, 160, 0.85)",
  MAGNET: "rgba(240, 200, 120, 0.85)",
  FIREWORKS: "rgba(255, 190, 120, 0.85)",
};

let width = 0;
let height = 0;
let dpr = Math.min(window.devicePixelRatio || 1, 2.5);
let reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let baseCount = reducedMotion ? 800 : window.matchMedia("(pointer: coarse)").matches ? 3000 : 6000;
let minCount = Math.max(400, Math.floor(baseCount * 0.35));
let particleCount = baseCount;

let positionsX = new Float32Array(particleCount);
let positionsY = new Float32Array(particleCount);
let velocitiesX = new Float32Array(particleCount);
let velocitiesY = new Float32Array(particleCount);
let heat = new Float32Array(particleCount);
let hueShift = new Float32Array(particleCount);

let activeMode = "FLOW";
let isPointerDown = false;
let pointerX = 0;
let pointerY = 0;
let pointerVX = 0;
let pointerVY = 0;
let lastPointerX = 0;
let lastPointerY = 0;
let lastPointerTime = performance.now();
let showHud = false;
let lastTapTime = 0;

const bursts = {
  max: 18,
  x: new Float32Array(18),
  y: new Float32Array(18),
  strength: new Float32Array(18),
  radius: new Float32Array(18),
  life: new Float32Array(18),
  active: new Uint8Array(18),
};
let lastBurstTime = 0;

const flowField = {
  freq: 0.0016,
  amplitude: 0.55,
};

const speedLimit = 3.2;
const damping = 0.985;

let frame = 0;
let lastFrameTime = performance.now();
let fps = 60;
let dtAccumulator = 0;
let dtSamples = 0;
let slowFrameTimer = 0;

function resizeCanvas() {
  width = window.innerWidth;
  height = window.innerHeight;
  dpr = Math.min(window.devicePixelRatio || 1, 2.5);
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function initParticles() {
  for (let i = 0; i < particleCount; i += 1) {
    positionsX[i] = Math.random() * width;
    positionsY[i] = Math.random() * height;
    velocitiesX[i] = (Math.random() - 0.5) * 0.6;
    velocitiesY[i] = (Math.random() - 0.5) * 0.6;
    heat[i] = 0;
    hueShift[i] = Math.random();
  }
}

function resizeParticles(newCount) {
  particleCount = newCount;
  positionsX = new Float32Array(particleCount);
  positionsY = new Float32Array(particleCount);
  velocitiesX = new Float32Array(particleCount);
  velocitiesY = new Float32Array(particleCount);
  heat = new Float32Array(particleCount);
  hueShift = new Float32Array(particleCount);
  initParticles();
}

function updatePointer(event) {
  const rect = canvas.getBoundingClientRect();
  pointerX = event.clientX - rect.left;
  pointerY = event.clientY - rect.top;
  const now = performance.now();
  const delta = Math.max(16, now - lastPointerTime);
  pointerVX = (pointerX - lastPointerX) / delta;
  pointerVY = (pointerY - lastPointerY) / delta;
  lastPointerX = pointerX;
  lastPointerY = pointerY;
  lastPointerTime = now;
}

function toggleHud() {
  showHud = !showHud;
  hud.classList.toggle("is-visible", showHud);
}

function toggleModeList(openState) {
  const shouldOpen = openState ?? !modeList.classList.contains("is-open");
  modeList.classList.toggle("is-open", shouldOpen);
  modeList.setAttribute("aria-hidden", (!shouldOpen).toString());
}

function setMode(mode) {
  activeMode = mode;
  modePill.textContent = mode === "GRAVITY" ? "GRAVITY WELL" : mode;
  modeItems.forEach((item) => {
    item.classList.toggle("is-active", item.dataset.mode === mode);
  });
  toggleModeList(false);
}

function cycleMode(direction) {
  const index = MODES.indexOf(activeMode);
  const nextIndex = (index + direction + MODES.length) % MODES.length;
  setMode(MODES[nextIndex]);
}

function triggerBurst(x, y, strength = 1) {
  for (let i = 0; i < bursts.max; i += 1) {
    if (!bursts.active[i]) {
      bursts.active[i] = 1;
      bursts.x[i] = x;
      bursts.y[i] = y;
      bursts.strength[i] = 320 * strength;
      bursts.radius[i] = 160 * strength;
      bursts.life[i] = 1;
      break;
    }
  }
}

function applyFlowField(time, ax, ay) {
  const nx = ax * flowField.freq;
  const ny = ay * flowField.freq;
  const angle =
    Math.sin(ny + time * 0.0004) +
    Math.cos(nx * 1.3 - time * 0.0003) +
    Math.sin((nx + ny) * 0.7);
  return {
    fx: Math.cos(angle) * flowField.amplitude,
    fy: Math.sin(angle) * flowField.amplitude,
  };
}

function applyModeForce(i, dx, dy, distSq, dist, time) {
  let fx = 0;
  let fy = 0;
  const safeDist = distSq + 120;

  switch (activeMode) {
    case "FLOW": {
      const gravity = 90 / safeDist;
      const swirl = 70 / safeDist;
      fx += dx * gravity + -dy * swirl;
      fy += dy * gravity + dx * swirl;
      break;
    }
    case "GRAVITY": {
      const gravity = 240 / safeDist;
      const swirl = 180 / safeDist;
      fx += dx * gravity + -dy * swirl;
      fy += dy * gravity + dx * swirl;
      break;
    }
    case "ORBIT": {
      const radius = 180;
      const falloff = Math.max(0, 1 - dist / radius);
      if (falloff > 0) {
        const strength = 220 * falloff;
        fx += -dy * strength * 0.02;
        fy += dx * strength * 0.02;
      }
      break;
    }
    case "REPEL": {
      const repel = 220 / safeDist;
      const swirl = 60 / safeDist;
      fx += -dx * repel + -dy * swirl;
      fy += -dy * repel + dx * swirl;
      break;
    }
    case "MAGNET": {
      const attraction = 160 / safeDist;
      const align = 0.12;
      const len = dist || 1;
      const tx = dx / len;
      const ty = dy / len;
      fx += tx * attraction;
      fy += ty * attraction;
      const vx = velocitiesX[i];
      const vy = velocitiesY[i];
      const alignFactor = (tx - vx) * align;
      const alignFactorY = (ty - vy) * align;
      fx += alignFactor + (Math.sin(time * 0.003 + i) - 0.5) * 0.02;
      fy += alignFactorY + (Math.cos(time * 0.0025 + i) - 0.5) * 0.02;
      break;
    }
    case "FIREWORKS": {
      break;
    }
    default:
      break;
  }

  return { fx, fy };
}

function applyBursts() {
  for (let b = 0; b < bursts.max; b += 1) {
    if (!bursts.active[b]) continue;
    bursts.life[b] -= 0.015;
    if (bursts.life[b] <= 0) {
      bursts.active[b] = 0;
      continue;
    }
    const bx = bursts.x[b];
    const by = bursts.y[b];
    const strength = bursts.strength[b] * bursts.life[b];
    const radius = bursts.radius[b];
    const radiusSq = radius * radius;
    for (let i = 0; i < particleCount; i += 1) {
      const dx = positionsX[i] - bx;
      const dy = positionsY[i] - by;
      const distSq = dx * dx + dy * dy;
      if (distSq < radiusSq) {
        const dist = Math.sqrt(distSq) || 1;
        const factor = (1 - dist / radius) * strength / (distSq + 50);
        velocitiesX[i] += (dx / dist) * factor;
        velocitiesY[i] += (dy / dist) * factor;
        heat[i] = Math.min(1, heat[i] + 0.25 * (1 - dist / radius));
      }
    }
  }
}

function step(time) {
  frame += 1;
  const now = performance.now();
  const dt = Math.min(32, now - lastFrameTime);
  lastFrameTime = now;
  dtAccumulator += dt;
  dtSamples += 1;

  if (dtAccumulator >= 1000) {
    fps = Math.round((dtSamples * 1000) / dtAccumulator);
    fpsLabel.textContent = `${fps} fps`;
    countLabel.textContent = `${particleCount} particles`;
    if (dtAccumulator / dtSamples > 20) {
      slowFrameTimer += dtAccumulator;
      if (slowFrameTimer > 1000 && particleCount > minCount) {
        const nextCount = Math.max(minCount, Math.floor(particleCount * 0.9));
        resizeParticles(nextCount);
        slowFrameTimer = 0;
      }
    } else {
      slowFrameTimer = 0;
    }
    dtAccumulator = 0;
    dtSamples = 0;
  }

  ctx.fillStyle = "rgba(5, 6, 11, 0.1)";
  ctx.fillRect(0, 0, width, height);

  const pointerActive = isPointerDown;
  const touchColor = MODE_COLORS[activeMode] || "rgba(140, 200, 255, 0.8)";

  for (let i = 0; i < particleCount; i += 1) {
    const x = positionsX[i];
    const y = positionsY[i];
    const flow = applyFlowField(time, x, y);

    let ax = flow.fx;
    let ay = flow.fy;

    if (pointerActive && activeMode !== "FIREWORKS") {
      const dx = pointerX - x;
      const dy = pointerY - y;
      const distSq = dx * dx + dy * dy;
      const dist = Math.sqrt(distSq) || 1;
      const force = applyModeForce(i, dx, dy, distSq, dist, time);
      ax += force.fx;
      ay += force.fy;
    }

    velocitiesX[i] = (velocitiesX[i] + ax * 0.016) * damping;
    velocitiesY[i] = (velocitiesY[i] + ay * 0.016) * damping;

    if (activeMode === "GRAVITY") {
      velocitiesX[i] = Math.max(-speedLimit, Math.min(speedLimit, velocitiesX[i]));
      velocitiesY[i] = Math.max(-speedLimit, Math.min(speedLimit, velocitiesY[i]));
    }

    positionsX[i] = x + velocitiesX[i];
    positionsY[i] = y + velocitiesY[i];

    if (positionsX[i] < -20) positionsX[i] = width + 20;
    if (positionsX[i] > width + 20) positionsX[i] = -20;
    if (positionsY[i] < -20) positionsY[i] = height + 20;
    if (positionsY[i] > height + 20) positionsY[i] = -20;

    heat[i] = Math.max(0, heat[i] - 0.01);

    const baseAlpha = 0.6 + hueShift[i] * 0.35;
    const heatGlow = heat[i];
    const hue = 210 + hueShift[i] * 40 + heatGlow * 60;
    ctx.fillStyle = `hsla(${hue}, 80%, ${60 + heatGlow * 20}%, ${baseAlpha})`;
    ctx.fillRect(positionsX[i], positionsY[i], 1.4, 1.4);
  }

  if (activeMode === "FIREWORKS") {
    applyBursts();
  }

  if (pointerActive) {
    ctx.beginPath();
    ctx.arc(pointerX, pointerY, 26, 0, Math.PI * 2);
    ctx.strokeStyle = touchColor;
    ctx.lineWidth = 2;
    ctx.shadowColor = touchColor;
    ctx.shadowBlur = 18;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  requestAnimationFrame(step);
}

canvas.addEventListener("pointerdown", (event) => {
  isPointerDown = true;
  updatePointer(event);
  const now = performance.now();
  if (now - lastTapTime < 280) {
    toggleHud();
  }
  lastTapTime = now;
  if (activeMode === "FIREWORKS") {
    triggerBurst(pointerX, pointerY, 1.1);
    lastBurstTime = now;
  }
});

canvas.addEventListener("pointermove", (event) => {
  if (!isPointerDown) return;
  updatePointer(event);
  if (activeMode === "FIREWORKS") {
    const now = performance.now();
    if (now - lastBurstTime > 300) {
      triggerBurst(pointerX, pointerY, 0.6);
      lastBurstTime = now;
    }
  }
});

canvas.addEventListener("pointerup", () => {
  isPointerDown = false;
});

canvas.addEventListener("pointercancel", () => {
  isPointerDown = false;
});

let pillStartX = 0;
let pillStartTime = 0;
let pillMoved = false;

modePill.addEventListener("pointerdown", (event) => {
  pillStartX = event.clientX;
  pillStartTime = performance.now();
  pillMoved = false;
});

modePill.addEventListener("pointermove", (event) => {
  if (!pillStartTime) return;
  const deltaX = event.clientX - pillStartX;
  if (Math.abs(deltaX) > 24) {
    pillMoved = true;
  }
});

modePill.addEventListener("pointerup", (event) => {
  const deltaX = event.clientX - pillStartX;
  const elapsed = performance.now() - pillStartTime;
  if (pillMoved && Math.abs(deltaX) > 30 && elapsed < 500) {
    cycleMode(deltaX > 0 ? -1 : 1);
  } else {
    toggleModeList();
  }
  pillStartTime = 0;
});

modePill.addEventListener("pointercancel", () => {
  pillStartTime = 0;
});

modeItems.forEach((item) => {
  item.addEventListener("click", () => {
    setMode(item.dataset.mode);
  });
});

window.addEventListener("resize", () => {
  resizeCanvas();
});

window.addEventListener("pointerup", () => {
  if (!modeList.contains(document.activeElement)) {
    toggleModeList(false);
  }
});

setMode(activeMode);
resizeCanvas();
initParticles();
ctx.fillStyle = "#05060b";
ctx.fillRect(0, 0, width, height);
requestAnimationFrame(step);
