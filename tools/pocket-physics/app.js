import { SensorController } from './sensors.js';
import { TouchInput } from './input.js';
import { PhysicsLab } from './physics.js';
import { createWebGPURenderer } from './renderer-webgpu.js';
import { CanvasRenderer } from './renderer-canvas.js';
import { MODE_HELP } from './modes.js';
import { loadSettings, saveSettings } from './storage.js';

const canvas = document.getElementById('labCanvas');
const ui = {
  start: document.getElementById('startBtn'), screen: document.getElementById('startScreen'), startMeta: document.getElementById('startMeta'),
  renderer: document.getElementById('rendererBadge'), sensor: document.getElementById('sensorBadge'), mode: document.getElementById('modeSelect'), quality: document.getElementById('qualitySelect'),
  modeInfo: document.getElementById('modeInfo'), reset: document.getElementById('resetBtn'), calibrate: document.getElementById('calibrateBtn'), perf: document.getElementById('perfOverlay'), perfBtn: document.getElementById('perfToggle')
};

const settings = loadSettings();
const sensor = new SensorController();
sensor.setCalibration(settings.calibration);
const lab = new PhysicsLab();
const input = new TouchInput(canvas);
let renderer = null, running = false, last = 0, rafId = 0, fps = 60;
let didStart = false;
const QUALITY_COUNT = { low: 120, medium: 240, high: 420, ultra: 720 };

async function initRenderer() {
  if (renderer) return renderer;
  try {
    const webgpu = await createWebGPURenderer(canvas);
    renderer = webgpu || new CanvasRenderer(canvas);
    ui.renderer.textContent = webgpu ? 'Renderer: WebGPU + Canvas FX' : 'Renderer: Canvas fallback';
  } catch (err) {
    console.warn('Renderer init failed, forcing Canvas fallback', err);
    renderer = new CanvasRenderer(canvas);
    ui.renderer.textContent = 'Renderer: Canvas fallback';
  }
  return renderer;
}

function resize() {
  if (!renderer) return;
  renderer.resize(window.innerWidth, window.innerHeight, Math.min(devicePixelRatio || 1, 2));
}

function reset() {
  lab.centerScore = 0;
  lab.reset(canvas.clientWidth || window.innerWidth, canvas.clientHeight || window.innerHeight, QUALITY_COUNT[settings.quality] || 320);
  lab.setMode(settings.mode);
}

function loop(ts) {
  if (!running || !renderer) return;
  const dt = (ts - last) / 1000 || 0.016;
  last = ts;
  lab.step(dt, canvas.clientWidth || window.innerWidth, canvas.clientHeight || window.innerHeight, sensor.gravity);
  renderer.render(lab);
  fps = fps * 0.9 + (1 / Math.max(dt, 0.001)) * 0.1;
  if (fps < 42 && settings.quality !== 'low') {
    settings.quality = 'low';
    ui.quality.value = 'low';
    saveSettings(settings);
  }
  ui.perf.textContent = `FPS ${fps.toFixed(1)}\n${ui.renderer.textContent}\nParticles ${lab.p.length}\nMode ${settings.mode}\nSensor ${sensor.status}\nBest ${lab.best.toFixed(2)}s`;
  rafId = requestAnimationFrame(loop);
}

function setMode(m) {
  settings.mode = m;
  lab.setMode(m);
  ui.modeInfo.textContent = MODE_HELP[m];
  saveSettings({ ...settings, bestStability: lab.best });
}

input.onTap = (x, y) => lab.add(x, y, settings.mode === 'field' ? 8 : 16);
input.onField = (x, y, strength) => {
  if (settings.mode === 'field' || settings.mode === 'chaos') {
    lab.applyField(x, y, strength);
  } else {
    sensor.gravity.x = (x / (canvas.clientWidth || window.innerWidth) - 0.5) * 2;
    sensor.gravity.y = (y / (canvas.clientHeight || window.innerHeight) - 0.5) * 2;
  }
};
sensor.onShake(() => lab.shake());

ui.startMeta.textContent = navigator.gpu ? 'WebGPU detected: high-fidelity path enabled.' : 'No WebGPU: polished Canvas fallback will run.';
ui.mode.value = settings.mode;
ui.quality.value = settings.quality;
ui.perf.classList.toggle('hidden', !settings.overlay);
setMode(settings.mode);

ui.mode.addEventListener('change', (e) => { setMode(e.target.value); saveSettings(settings); });
ui.quality.addEventListener('change', (e) => { settings.quality = e.target.value; reset(); saveSettings(settings); });
ui.reset.addEventListener('click', reset);
ui.calibrate.addEventListener('click', () => {
  settings.calibration = { x: sensor.gravity.x, y: sensor.gravity.y };
  sensor.setCalibration(settings.calibration);
  saveSettings(settings);
});
ui.perfBtn.addEventListener('click', () => {
  settings.overlay = !settings.overlay;
  ui.perf.classList.toggle('hidden', !settings.overlay);
  saveSettings(settings);
});

ui.start.addEventListener('click', async () => {
  if (didStart) return;
  didStart = true;
  ui.start.disabled = true;
  ui.start.textContent = 'Starting…';

  await initRenderer();
  resize();
  reset();

  try {
    const ok = await sensor.request();
    ui.sensor.textContent = `Sensors: ${sensor.status}`;
    if (!ok) ui.modeInfo.textContent = 'Sensor access unavailable: using touch/mouse gravity control.';
  } catch (err) {
    console.warn('Sensor init failed', err);
    ui.sensor.textContent = 'Sensors: error (using touch fallback)';
    ui.modeInfo.textContent = 'Sensor error: using touch/mouse gravity control.';
  }

  ui.screen.classList.remove('visible');
  running = true;
  last = performance.now();
  loop(last);
});

window.addEventListener('resize', resize);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    running = false;
    cancelAnimationFrame(rafId);
  } else if (!ui.screen.classList.contains('visible') && renderer) {
    running = true;
    last = performance.now();
    loop(last);
  }
});
window.addEventListener('keydown', (e) => {
  if (['1', '2', '3', '4'].includes(e.key)) {
    const idx = Number(e.key) - 1;
    const m = ['sandbox', 'stability', 'field', 'chaos'][idx];
    ui.mode.value = m;
    setMode(m);
  }
  if (e.key === 'r') reset();
});
