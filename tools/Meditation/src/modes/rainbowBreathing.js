import { easeInOutSine } from '../utils/easing.js';
import { getRainbowColor } from '../utils/colors.js';
import { getPhaseProgress } from '../state.js';

export function renderRainbowBreathing(ctx, state, metrics) {
  const { width, height } = metrics;
  const centerX = width / 2;
  const centerY = height / 2;
  const progress = getPhaseProgress(state);

  const background = ctx.createRadialGradient(
    centerX,
    centerY,
    width * 0.1,
    centerX,
    centerY,
    width * 0.6,
  );
  background.addColorStop(0, '#1a2150');
  background.addColorStop(1, '#080b18');
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);

  const eased = easeInOutSine(state.phase === 'exhale' ? 1 - progress : progress);
  const size = (Math.min(width, height) * 0.15) + eased * (Math.min(width, height) * 0.12);

  ctx.save();
  ctx.fillStyle = getRainbowColor(state.cycleCount);
  ctx.shadowColor = 'rgba(255, 255, 255, 0.4)';
  ctx.shadowBlur = 40;
  ctx.beginPath();
  ctx.arc(centerX, centerY, size, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = `${Math.max(16, width * 0.02)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(state.phase.toUpperCase(), centerX, centerY + size + 30);
}
