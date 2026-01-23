const VIEWPORT_ID = 'viewport';
const STATUS_ID = 'status';
const PLACEHOLDER_ID = 'placeholder';

function clampDevicePixelRatio(dpr) {
  if (!Number.isFinite(dpr) || dpr <= 0) return 1;
  return Math.min(2, Math.max(1, dpr));
}

function setStatus(text) {
  const statusEl = document.getElementById(STATUS_ID);
  if (statusEl) statusEl.textContent = text;
}

function createCanvas(viewportEl) {
  const canvas = document.createElement('canvas');
  canvas.className = 'ss-canvas';
  canvas.setAttribute('aria-label', 'Solar System canvas placeholder');
  viewportEl.appendChild(canvas);
  return canvas;
}

function resizeCanvasToDisplaySize(canvas) {
  const rect = canvas.getBoundingClientRect();
  const dpr = clampDevicePixelRatio(window.devicePixelRatio);
  const nextWidth = Math.max(1, Math.floor(rect.width * dpr));
  const nextHeight = Math.max(1, Math.floor(rect.height * dpr));
  if (canvas.width === nextWidth && canvas.height === nextHeight) return false;
  canvas.width = nextWidth;
  canvas.height = nextHeight;
  return true;
}

function drawPlaceholder(canvas) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const { width, height } = canvas;
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#05060a');
  gradient.addColorStop(1, '#0b1020');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.font = `${Math.max(12, Math.floor(Math.min(width, height) * 0.03))}px system-ui, -apple-system, Segoe UI, Roboto, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Solar System 3D orbit map (coming next milestones)', width / 2, height / 2);
}

function init() {
  const viewportEl = document.getElementById(VIEWPORT_ID);
  if (!viewportEl) {
    setStatus('Error: missing viewport');
    return;
  }

  const placeholderEl = document.getElementById(PLACEHOLDER_ID);
  if (placeholderEl) placeholderEl.remove();

  const canvas = createCanvas(viewportEl);
  if (typeof ResizeObserver !== 'undefined') {
    const ro = new ResizeObserver(() => {
      if (resizeCanvasToDisplaySize(canvas)) drawPlaceholder(canvas);
    });
    ro.observe(viewportEl);
  } else {
    window.addEventListener('resize', () => {
      if (resizeCanvasToDisplaySize(canvas)) drawPlaceholder(canvas);
    });
  }

  resizeCanvasToDisplaySize(canvas);
  drawPlaceholder(canvas);
  setStatus('Ready');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
