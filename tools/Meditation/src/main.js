import { createLoop } from './utils/raf.js';
import { fitCanvas } from './utils/fitCanvas.js';
import { createState, advanceBreath, MODES, PRESETS, resetSession } from './state.js';
import { renderRainbowBreathing } from './modes/rainbowBreathing.js';
import { renderPaintRainbow } from './modes/paintRainbow.js';
import { setupHud } from './ui/hud.js';

const canvas = document.getElementById('scene');
const ctx = canvas.getContext('2d');
const startOverlay = document.getElementById('startOverlay');
const modeToggle = document.getElementById('modeToggle');
const pauseToggle = document.getElementById('pauseToggle');
const motionToggle = document.getElementById('motionToggle');
const hud = document.getElementById('hud');
const presetButtons = Array.from(document.querySelectorAll('[data-preset]'));

const state = createState();
const hudManager = setupHud(hud);
let metrics = fitCanvas(canvas);

function updateIcons() {
  modeToggle.querySelector('.icon').textContent =
    state.mode === MODES.RAINBOW_BREATHING ? '🌬️' : '🌈';
  pauseToggle.querySelector('.icon').textContent = state.paused ? '▶️' : '⏸';
  motionToggle.querySelector('.icon').textContent = state.reducedMotion ? '🚫' : '🌀';
}

function updatePresetButtons() {
  presetButtons.forEach((button) => {
    button.classList.toggle('is-active', button.dataset.preset === state.preset);
  });
}

function render(dt) {
  if (state.mode === MODES.RAINBOW_BREATHING) {
    renderRainbowBreathing(ctx, state, metrics, dt);
  } else {
    renderPaintRainbow(ctx, state, metrics, dt);
  }
}

const loop = createLoop((dt) => {
  advanceBreath(state, dt);
  render(dt);
});

function start() {
  state.started = true;
  resetSession(state);
  startOverlay.classList.add('is-hidden');
  hudManager.showHud();
  loop.start();
}

startOverlay.addEventListener('click', () => {
  if (!state.started) {
    start();
  }
});

window.addEventListener('resize', () => {
  metrics = fitCanvas(canvas);
});

canvas.addEventListener('pointerdown', () => {
  hudManager.showHud();
});

modeToggle.addEventListener('click', () => {
  state.mode =
    state.mode === MODES.RAINBOW_BREATHING ? MODES.PAINT_RAINBOW : MODES.RAINBOW_BREATHING;
  resetSession(state);
  hudManager.showHud();
  updateIcons();
});

pauseToggle.addEventListener('click', () => {
  if (state.completed) {
    resetSession(state);
  } else {
    state.paused = !state.paused;
  }
  hudManager.showHud();
  updateIcons();
});

motionToggle.addEventListener('click', () => {
  state.reducedMotion = !state.reducedMotion;
  hudManager.showHud();
  updateIcons();
});

presetButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const preset = button.dataset.preset;
    if (!preset || preset === state.preset) {
      return;
    }
    state.preset = preset;
    if (state.started) {
      resetSession(state);
    }
    hudManager.showHud();
    updatePresetButtons();
    updateIcons();
  });
});

window.addEventListener('keydown', (event) => {
  if (event.key === ' ') {
    event.preventDefault();
    state.paused = !state.paused;
    updateIcons();
  }
});

hudManager.showHud();
updateIcons();
updatePresetButtons();
render();
