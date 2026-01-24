import { RAINBOW } from '../utils/colors.js';
import { getPhaseProgress } from '../state.js';

const TOTAL_BANDS = 7;

export function renderPaintRainbow(ctx, state, metrics) {
  const { width, height } = metrics;
  ctx.clearRect(0, 0, width, height);

  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#0f1c3f');
  gradient.addColorStop(1, '#06080f');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  const cycleProgress = Math.min(state.cycleCount / TOTAL_BANDS, 1);
  const phaseProgress = getPhaseProgress(state);
  const fillBands = Math.min(TOTAL_BANDS, Math.floor(state.cycleCount + phaseProgress));

  const arcRadius = Math.min(width, height) * 0.4;
  const centerX = width / 2;
  const centerY = height * 0.72;
  const bandWidth = arcRadius / 7;

  for (let i = 0; i < TOTAL_BANDS; i += 1) {
    if (i >= fillBands) {
      break;
    }
    const radius = arcRadius - i * bandWidth;
    ctx.strokeStyle = RAINBOW[i];
    ctx.lineWidth = bandWidth * 0.85;
    ctx.lineCap = 'round';
    ctx.globalAlpha = 0.55 + 0.45 * cycleProgress;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, Math.PI, Math.PI * 2);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = `${Math.max(16, width * 0.02)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('Breathe to paint the rainbow', centerX, centerY - arcRadius - 20);
}
