import { RAINBOW } from '../utils/colors.js';
import { getPhaseProgress } from '../state.js';

const TOTAL_BANDS = 7;

function createLayer(width, height) {
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(width, height);
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function ensurePaintState(state, metrics) {
  const { width, height } = metrics;
  if (!state.paintRainbow || state.paintRainbow.width !== width || state.paintRainbow.height !== height) {
    state.paintRainbow = {
      width,
      height,
      layers: Array.from({ length: TOTAL_BANDS }, () => createLayer(width, height)),
      coverage: Array.from({ length: TOTAL_BANDS }, () => 0),
    };
  }
  return state.paintRainbow;
}

function phaseBrushTuning(state, progress) {
  const baseFlow = state.phase === 'inhale' ? 0.18 + 0.2 * progress : 0.12 + 0.1 * (1 - progress);
  const phaseSoftness = state.phase === 'exhale' ? 0.6 : state.phase === 'hold' ? 1 : 0.85;
  const jitter = state.reducedMotion ? 0.35 : 0.9 * phaseSoftness;
  const radiusScale = state.phase === 'inhale' ? 1 + 0.2 * progress : 1 - 0.12 * progress;
  return { baseFlow, jitter, radiusScale };
}

function paintBand(layer, bandIndex, paintState, layout, tuning, desiredIncrement) {
  const { centerX, centerY, arcRadius, bandWidth } = layout;
  const { baseFlow, jitter, radiusScale } = tuning;
  const ctx = layer.getContext('2d');
  const strokes = Math.max(1, Math.ceil(desiredIncrement * 40));
  const color = RAINBOW[bandIndex];
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = 'round';
  ctx.shadowColor = color;
  ctx.shadowBlur = bandWidth * 0.4;

  for (let i = 0; i < strokes; i += 1) {
    const angle = Math.PI + Math.random() * Math.PI;
    const radiusJitter = (Math.random() - 0.5) * bandWidth * jitter;
    const radius = arcRadius - bandIndex * bandWidth + radiusJitter;
    const arcSpan = (0.08 + Math.random() * 0.15) * radiusScale;
    const start = angle - arcSpan;
    const end = angle + arcSpan;
    const lineWidth = bandWidth * (0.65 + Math.random() * 0.35) * radiusScale;
    ctx.globalAlpha = 0.08 + Math.random() * baseFlow;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, start, end);
    ctx.stroke();

    const dotAngle = angle + (Math.random() - 0.5) * 0.2;
    const dotRadius = radius + (Math.random() - 0.5) * bandWidth * 0.5 * jitter;
    const dotX = centerX + Math.cos(dotAngle) * dotRadius;
    const dotY = centerY + Math.sin(dotAngle) * dotRadius;
    ctx.globalAlpha = 0.05 + Math.random() * baseFlow * 0.6;
    ctx.beginPath();
    ctx.arc(dotX, dotY, lineWidth * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export function renderPaintRainbow(ctx, state, metrics, dt) {
  const { width, height } = metrics;
  ctx.clearRect(0, 0, width, height);

  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#0f1c3f');
  gradient.addColorStop(1, '#06080f');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  const phaseProgress = getPhaseProgress(state);
  const completedCycles = Math.max(0, state.cycleCount - 1);
  const cycleProgress = Math.min((completedCycles + phaseProgress) / TOTAL_BANDS, 1);
  const cyclePosition = completedCycles + phaseProgress;

  const arcRadius = Math.min(width, height) * 0.4;
  const centerX = width / 2;
  const centerY = height * 0.72;
  const bandWidth = arcRadius / TOTAL_BANDS;

  const paintState = ensurePaintState(state, metrics);
  const tuning = phaseBrushTuning(state, phaseProgress);
  const layout = { centerX, centerY, arcRadius, bandWidth };
  const dtBoost = Math.min(1, dt * 60);

  for (let i = 0; i < TOTAL_BANDS; i += 1) {
    const targetCoverage = Math.min(1, Math.max(0, cyclePosition - i));
    const current = paintState.coverage[i] ?? 0;
    if (targetCoverage > current) {
      const increment = Math.min(0.08, (targetCoverage - current) * 0.25 * dtBoost);
      paintBand(paintState.layers[i], i, paintState, layout, tuning, increment);
      paintState.coverage[i] = Math.min(targetCoverage, current + increment);
    }
  }

  for (let i = 0; i < TOTAL_BANDS; i += 1) {
    ctx.globalAlpha = 0.5 + 0.5 * cycleProgress;
    ctx.drawImage(paintState.layers[i], 0, 0);
  }

  ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = `${Math.max(16, width * 0.02)}px sans-serif`;
  ctx.textAlign = 'center';
  const message = state.completed ? 'Rainbow complete' : 'Breathe to paint the rainbow';
  ctx.fillText(message, centerX, centerY - arcRadius - 20);
}
