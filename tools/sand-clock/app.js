(() => {
  "use strict";

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  const BASE_W = 900;
  const BASE_H = 520;

  const dom = {
    canvas: /** @type {HTMLCanvasElement} */ (document.getElementById("glass")),
    durationInput: /** @type {HTMLInputElement} */ (document.getElementById("duration")),
    durationRange: /** @type {HTMLInputElement} */ (document.getElementById("durationRange")),
    startBtn: /** @type {HTMLButtonElement} */ (document.getElementById("startBtn")),
    pauseBtn: /** @type {HTMLButtonElement} */ (document.getElementById("pauseBtn")),
    resetBtn: /** @type {HTMLButtonElement} */ (document.getElementById("resetBtn")),
    durationLabel: /** @type {HTMLElement} */ (document.getElementById("durationLabel")),
    remainingLabel: /** @type {HTMLElement} */ (document.getElementById("remainingLabel")),
    statusLabel: /** @type {HTMLElement} */ (document.getElementById("statusLabel")),
  };

  if (!dom.canvas) {
    throw new Error("Missing #glass canvas");
  }

  const ctx = dom.canvas.getContext("2d", { alpha: true });
  if (!ctx) {
    throw new Error("2D canvas context unavailable");
  }

  const state = {
    durationSec: 60,
    running: false,
    finished: false,
    startPerf: 0,
    elapsedBefore: 0,
  };

  function setDuration(seconds) {
    const sec = clamp(Math.round(Number(seconds) || 0), 5, 900);
    const shouldReset = state.running || state.finished || state.elapsedBefore > 0;

    state.durationSec = sec;
    if (shouldReset) reset();
    syncDurationControls();
    updateLabels();
  }

  function start() {
    if (state.finished) reset();
    if (state.running) return;
    state.running = true;
    state.startPerf = performance.now();
    updateLabels();
  }

  function pause() {
    if (!state.running) return;
    state.elapsedBefore = getElapsedSeconds();
    state.running = false;
    updateLabels();
  }

  function reset() {
    state.running = false;
    state.finished = false;
    state.elapsedBefore = 0;
    state.startPerf = 0;
    updateLabels();
  }

  function getElapsedSeconds() {
    if (!state.running) return state.elapsedBefore;
    return state.elapsedBefore + (performance.now() - state.startPerf) / 1000;
  }

  function getProgress() {
    if (state.durationSec <= 0) return 0;
    return clamp(getElapsedSeconds() / state.durationSec, 0, 1);
  }

  function getStatusText() {
    if (state.finished) return "Done";
    if (state.running) return "Running";
    if (state.elapsedBefore > 0) return "Paused";
    return "Ready";
  }

  function formatMmSs(seconds) {
    const sec = Math.max(0, seconds);
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  function formatRemaining(seconds) {
    const sec = Math.max(0, seconds);
    const whole = Math.floor(sec);
    const tenths = Math.floor((sec - whole) * 10);
    const m = Math.floor(whole / 60);
    const s = whole % 60;
    return `${m}:${String(s).padStart(2, "0")}.${tenths}`;
  }

  function updateLabels() {
    const remaining = clamp(state.durationSec - getElapsedSeconds(), 0, state.durationSec);
    dom.durationLabel.textContent = formatMmSs(state.durationSec);
    dom.remainingLabel.textContent = formatRemaining(remaining);
    dom.statusLabel.textContent = getStatusText();
  }

  function syncDurationControls() {
    const v = String(state.durationSec);
    if (dom.durationInput.value !== v) dom.durationInput.value = v;
    if (dom.durationRange.value !== v) dom.durationRange.value = v;
  }

  function setupControls() {
    const onDurationChange = (value) => setDuration(value);
    dom.durationInput.addEventListener("change", (e) => onDurationChange(e.currentTarget.value));
    dom.durationInput.addEventListener("input", (e) => onDurationChange(e.currentTarget.value));
    dom.durationRange.addEventListener("input", (e) => onDurationChange(e.currentTarget.value));

    dom.startBtn.addEventListener("click", start);
    dom.pauseBtn.addEventListener("click", pause);
    dom.resetBtn.addEventListener("click", reset);

    window.addEventListener("keydown", (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        if (state.running) pause();
        else start();
        return;
      }
      if (e.key === "r" || e.key === "R") {
        reset();
      }
    });
  }

  function resizeCanvasToDevicePixels() {
    const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
    const targetW = Math.round(BASE_W * dpr);
    const targetH = Math.round(BASE_H * dpr);

    if (dom.canvas.width !== targetW) dom.canvas.width = targetW;
    if (dom.canvas.height !== targetH) dom.canvas.height = targetH;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function getGlassGeometry() {
    const cx = BASE_W / 2;
    const topY = 40;
    const bottomY = BASE_H - 40;
    const neckY = BASE_H / 2;

    return {
      cx,
      topY,
      bottomY,
      neckY,
      outerHalfWidth: 176,
      innerHalfWidth: 142,
      neckOuterHalf: 20,
      neckInnerHalf: 14,
      neckHalfHeight: 10,
      inset: 18,
    };
  }

  function outerGlassPath(g) {
    const p = new Path2D();
    const leftX = g.cx - g.outerHalfWidth;
    const rightX = g.cx + g.outerHalfWidth;
    const topArchY = g.topY + 22;
    const bottomArchY = g.bottomY - 22;

    p.moveTo(leftX, topArchY);
    p.quadraticCurveTo(g.cx, g.topY, rightX, topArchY);

    p.bezierCurveTo(rightX, g.topY + 70, g.cx + 98, g.neckY - 80, g.cx + g.neckOuterHalf, g.neckY - g.neckHalfHeight);
    p.lineTo(g.cx + g.neckOuterHalf, g.neckY + g.neckHalfHeight);
    p.bezierCurveTo(g.cx + 98, g.neckY + 80, rightX, g.bottomY - 70, rightX, bottomArchY);

    p.quadraticCurveTo(g.cx, g.bottomY, leftX, bottomArchY);

    p.bezierCurveTo(leftX, g.bottomY - 70, g.cx - 98, g.neckY + 80, g.cx - g.neckOuterHalf, g.neckY + g.neckHalfHeight);
    p.lineTo(g.cx - g.neckOuterHalf, g.neckY - g.neckHalfHeight);
    p.bezierCurveTo(g.cx - 98, g.neckY - 80, leftX, g.topY + 70, leftX, topArchY);
    p.closePath();
    return p;
  }

  function innerGlassPath(g) {
    const p = new Path2D();
    const leftX = g.cx - g.innerHalfWidth;
    const rightX = g.cx + g.innerHalfWidth;
    const topArchY = g.topY + 34;
    const bottomArchY = g.bottomY - 34;

    p.moveTo(leftX, topArchY);
    p.quadraticCurveTo(g.cx, g.topY + 12, rightX, topArchY);

    p.bezierCurveTo(rightX, g.topY + 78, g.cx + 84, g.neckY - 72, g.cx + g.neckInnerHalf, g.neckY - (g.neckHalfHeight - 1));
    p.lineTo(g.cx + g.neckInnerHalf, g.neckY + (g.neckHalfHeight - 1));
    p.bezierCurveTo(g.cx + 84, g.neckY + 72, rightX, g.bottomY - 78, rightX, bottomArchY);

    p.quadraticCurveTo(g.cx, g.bottomY - 12, leftX, bottomArchY);

    p.bezierCurveTo(leftX, g.bottomY - 78, g.cx - 84, g.neckY + 72, g.cx - g.neckInnerHalf, g.neckY + (g.neckHalfHeight - 1));
    p.lineTo(g.cx - g.neckInnerHalf, g.neckY - (g.neckHalfHeight - 1));
    p.bezierCurveTo(g.cx - 84, g.neckY - 72, leftX, g.topY + 78, leftX, topArchY);
    p.closePath();
    return p;
  }

  function topBulbClipPath(g) {
    const p = new Path2D();
    const leftX = g.cx - g.innerHalfWidth;
    const rightX = g.cx + g.innerHalfWidth;
    const topArchY = g.topY + 34;
    const neckTop = g.neckY - (g.neckHalfHeight - 1);

    p.moveTo(leftX, topArchY);
    p.quadraticCurveTo(g.cx, g.topY + 12, rightX, topArchY);
    p.bezierCurveTo(rightX, g.topY + 78, g.cx + 84, g.neckY - 72, g.cx + g.neckInnerHalf, neckTop);
    p.lineTo(g.cx - g.neckInnerHalf, neckTop);
    p.bezierCurveTo(g.cx - 84, g.neckY - 72, leftX, g.topY + 78, leftX, topArchY);
    p.closePath();
    return p;
  }

  function bottomBulbClipPath(g) {
    const p = new Path2D();
    const leftX = g.cx - g.innerHalfWidth;
    const rightX = g.cx + g.innerHalfWidth;
    const bottomArchY = g.bottomY - 34;
    const neckBottom = g.neckY + (g.neckHalfHeight - 1);

    p.moveTo(g.cx - g.neckInnerHalf, neckBottom);
    p.lineTo(g.cx + g.neckInnerHalf, neckBottom);
    p.bezierCurveTo(g.cx + 84, g.neckY + 72, rightX, g.bottomY - 78, rightX, bottomArchY);
    p.quadraticCurveTo(g.cx, g.bottomY - 12, leftX, bottomArchY);
    p.bezierCurveTo(leftX, g.bottomY - 78, g.cx - 84, g.neckY + 72, g.cx - g.neckInnerHalf, neckBottom);
    p.closePath();
    return p;
  }

  function drawSand(ctx2d, progress) {
    const g = getGlassGeometry();
    const topAmount = 1 - easeInOutCubic(progress);
    const bottomAmount = easeInOutCubic(progress);

    const topClip = topBulbClipPath(g);
    const bottomClip = bottomBulbClipPath(g);

    const sandGradient = ctx2d.createLinearGradient(0, g.topY, 0, g.bottomY);
    sandGradient.addColorStop(0, "#e6c476");
    sandGradient.addColorStop(0.55, "#d7ae5e");
    sandGradient.addColorStop(1, "#c6943f");

    const sandShadow = ctx2d.createLinearGradient(0, g.neckY - 60, 0, g.neckY + 140);
    sandShadow.addColorStop(0, "rgba(0,0,0,0)");
    sandShadow.addColorStop(1, "rgba(0,0,0,0.22)");

    const topSurfaceFullY = g.topY + 62;
    const topSurfaceEmptyY = g.neckY - 34;
    const topSurfaceY = lerp(topSurfaceEmptyY, topSurfaceFullY, topAmount);

    const bottomSurfaceEmptyY = g.bottomY - 54;
    const bottomSurfaceFullY = g.neckY + 34;
    const bottomSurfaceBaseY = lerp(bottomSurfaceEmptyY, bottomSurfaceFullY, bottomAmount);
    const moundHeight = 32 * (1 - Math.pow(bottomAmount, 0.6));
    const bottomPeakY = bottomSurfaceBaseY - moundHeight;

    // Top sand (decreasing): slightly concave as it empties.
    ctx2d.save();
    ctx2d.clip(topClip);
    ctx2d.fillStyle = sandGradient;
    const leftX = g.cx - g.innerHalfWidth + 10;
    const rightX = g.cx + g.innerHalfWidth - 10;
    const dip = 26 * (1 - topAmount);
    const topPath = new Path2D();
    topPath.moveTo(leftX, topSurfaceY);
    topPath.quadraticCurveTo(g.cx, topSurfaceY + dip, rightX, topSurfaceY);
    topPath.lineTo(rightX, g.neckY);
    topPath.lineTo(leftX, g.neckY);
    topPath.closePath();
    ctx2d.fill(topPath);
    ctx2d.fillStyle = sandShadow;
    ctx2d.fillRect(g.cx - g.innerHalfWidth, g.neckY - 40, g.innerHalfWidth * 2, 120);
    ctx2d.restore();

    // Bottom sand (increasing): mound that gradually flattens as it fills.
    ctx2d.save();
    ctx2d.clip(bottomClip);
    ctx2d.fillStyle = sandGradient;
    const bottomPath = new Path2D();
    bottomPath.moveTo(leftX, bottomSurfaceBaseY);
    bottomPath.quadraticCurveTo(g.cx, bottomPeakY, rightX, bottomSurfaceBaseY);
    bottomPath.lineTo(rightX, g.bottomY);
    bottomPath.lineTo(leftX, g.bottomY);
    bottomPath.closePath();
    ctx2d.fill(bottomPath);
    ctx2d.restore();

    // Falling stream while running (and not finished).
    if (state.running && !state.finished && progress < 1) {
      ctx2d.save();
      ctx2d.globalAlpha = 0.9;
      ctx2d.lineCap = "round";
      ctx2d.strokeStyle = "#e7c77a";
      ctx2d.lineWidth = 2;
      const streamTop = g.neckY - 10;
      const streamBottom = g.neckY + 110;
      ctx2d.beginPath();
      ctx2d.moveTo(g.cx, streamTop);
      ctx2d.lineTo(g.cx, streamBottom);
      ctx2d.stroke();

      // Tiny sparkle/particle at the landing point for life (kept subtle).
      ctx2d.globalAlpha = 0.35;
      ctx2d.fillStyle = "#fff0bf";
      ctx2d.beginPath();
      ctx2d.arc(g.cx, streamBottom + 3, 1.5, 0, Math.PI * 2);
      ctx2d.fill();
      ctx2d.restore();
    }
  }

  function drawGlass(ctx2d) {
    const g = getGlassGeometry();
    const outer = outerGlassPath(g);
    const inner = innerGlassPath(g);

    // Soft interior fill to suggest glass volume.
    ctx2d.save();
    ctx2d.globalCompositeOperation = "source-over";
    ctx2d.fillStyle = "rgba(255,255,255,0.05)";
    ctx2d.fill(outer);

    // Inner cavity tint.
    ctx2d.fillStyle = "rgba(0,0,0,0.16)";
    ctx2d.fill(inner);

    // Outer stroke with subtle gradient.
    const strokeGrad = ctx2d.createLinearGradient(0, g.topY, 0, g.bottomY);
    strokeGrad.addColorStop(0, "rgba(255,255,255,0.26)");
    strokeGrad.addColorStop(0.5, "rgba(255,255,255,0.18)");
    strokeGrad.addColorStop(1, "rgba(255,255,255,0.24)");
    ctx2d.strokeStyle = strokeGrad;
    ctx2d.lineWidth = 2;
    ctx2d.lineJoin = "round";
    ctx2d.stroke(outer);

    // Inner stroke.
    ctx2d.strokeStyle = "rgba(255,255,255,0.10)";
    ctx2d.lineWidth = 1;
    ctx2d.stroke(inner);

    // Highlights.
    ctx2d.globalAlpha = 0.7;
    ctx2d.lineWidth = 1.5;
    ctx2d.strokeStyle = "rgba(255,255,255,0.18)";
    ctx2d.beginPath();
    ctx2d.moveTo(g.cx - g.outerHalfWidth + 18, g.topY + 60);
    ctx2d.bezierCurveTo(g.cx - g.outerHalfWidth + 6, g.topY + 120, g.cx - 84, g.neckY - 66, g.cx - g.neckOuterHalf + 6, g.neckY - 8);
    ctx2d.stroke();

    ctx2d.globalAlpha = 0.35;
    ctx2d.strokeStyle = "rgba(255,255,255,0.14)";
    ctx2d.beginPath();
    ctx2d.moveTo(g.cx + g.outerHalfWidth - 18, g.topY + 66);
    ctx2d.bezierCurveTo(g.cx + g.outerHalfWidth - 6, g.topY + 120, g.cx + 84, g.neckY - 66, g.cx + g.neckOuterHalf - 6, g.neckY - 8);
    ctx2d.stroke();

    // Neck glint.
    ctx2d.globalAlpha = 0.6;
    ctx2d.strokeStyle = "rgba(255,255,255,0.12)";
    ctx2d.lineWidth = 2;
    ctx2d.beginPath();
    ctx2d.moveTo(g.cx - g.neckOuterHalf - 2, g.neckY);
    ctx2d.lineTo(g.cx + g.neckOuterHalf + 2, g.neckY);
    ctx2d.stroke();

    ctx2d.restore();
  }

  function render() {
    resizeCanvasToDevicePixels();

    const progress = getProgress();
    if (progress >= 1 && !state.finished) {
      state.finished = true;
      state.running = false;
      state.elapsedBefore = state.durationSec;
      updateLabels();
    } else if (state.running) {
      updateLabels();
    }

    ctx.clearRect(0, 0, BASE_W, BASE_H);

    // Subtle vignette behind the glass.
    const vignette = ctx.createRadialGradient(BASE_W / 2, BASE_H / 2, 40, BASE_W / 2, BASE_H / 2, 360);
    vignette.addColorStop(0, "rgba(255,255,255,0.03)");
    vignette.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, BASE_W, BASE_H);

    drawSand(ctx, progress);
    drawGlass(ctx);

    requestAnimationFrame(render);
  }

  setupControls();
  setDuration(dom.durationInput.value || "60");
  render();
})();

