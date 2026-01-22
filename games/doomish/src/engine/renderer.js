export function createRenderer(canvas, { resolutionScale = 1 } = {}) {
  const ctx = canvas.getContext("2d", { alpha: false });

  const state = {
    w: 0,
    h: 0,
    resolutionScale: clamp(resolutionScale, 0.25, 1),
    fov: Math.PI / 3,
    wallTextures: {},
    spriteTextures: {},
    nearPlane: 0.06,
    zBuffer: new Float32Array(0),
  };

  function resize() {
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const cssW = Math.max(1, Math.floor(canvas.clientWidth));
    const cssH = Math.max(1, Math.floor(canvas.clientHeight));
    canvas.width = Math.max(1, Math.floor(cssW * dpr * state.resolutionScale));
    canvas.height = Math.max(1, Math.floor(cssH * dpr * state.resolutionScale));

    state.w = canvas.width;
    state.h = canvas.height;
    state.zBuffer = new Float32Array(state.w);

    ctx.imageSmoothingEnabled = false;
  }

  function setWallTextures(wallTextures) {
    state.wallTextures = wallTextures || {};
  }

  function setSpriteTextures(spriteTextures) {
    state.spriteTextures = spriteTextures || {};
  }

  function setResolutionScale(scale) {
    state.resolutionScale = clamp(scale, 0.25, 1);
  }

  function getResolutionScale() {
    return state.resolutionScale;
  }

  function render(level, player, { minimap } = {}) {
    const w = state.w | 0;
    const h = state.h | 0;
    if (w <= 0 || h <= 0) return;

    const halfH = (h / 2) | 0;
    ctx.fillStyle = "#11141a";
    ctx.fillRect(0, 0, w, halfH);
    ctx.fillStyle = "#08090b";
    ctx.fillRect(0, halfH, w, h - halfH);

    const fov = state.fov;
    const planeDist = w / (2 * Math.tan(fov / 2));

    const ca = Math.cos(player.a);
    const sa = Math.sin(player.a);
    const nearPlane = state.nearPlane;
    const zBuffer = state.zBuffer.length === w ? state.zBuffer : (state.zBuffer = new Float32Array(w));

    for (let x = 0; x < w; x++) {
      const cameraX = (2 * (x + 0.5)) / w - 1;
      const rayAngle = player.a + Math.atan(cameraX * Math.tan(fov / 2));
      const ra = normalizeAngle(rayAngle);
      const rdx = Math.cos(ra);
      const rdy = Math.sin(ra);

      const hit = castRayDDA(level, player.x, player.y, rdx, rdy);
      if (!hit) {
        zBuffer[x] = Infinity;
        continue;
      }

      const perpDist = hit.dist * (rdx * ca + rdy * sa);
      const dist = Math.max(nearPlane, perpDist);
      zBuffer[x] = dist;

      const lineHeight = planeDist / dist;
      const startY = Math.floor(halfH - lineHeight / 2);
      const wallHeight = Math.ceil(lineHeight);

      const shade = shadeForDist(dist) * (hit.side === 1 ? 0.88 : 1);
      const tex = state.wallTextures[hit.tile | 0];
      if (tex && tex.width > 0 && tex.height > 0) {
        const texX = computeTextureX(tex.width, hit, player.x, player.y, rdx, rdy);
        ctx.drawImage(tex, texX, 0, 1, tex.height, x, startY, 1, wallHeight);
        if (shade < 0.999) {
          ctx.fillStyle = `rgba(0,0,0,${(1 - shade).toFixed(4)})`;
          ctx.fillRect(x, startY, 1, wallHeight);
        }
      } else {
        const base = wallColor(hit.tile);
        ctx.fillStyle = shadeColor(base, shade);
        ctx.fillRect(x, startY, 1, wallHeight);
      }
    }

    drawSprites(ctx, state, level, player, { planeDist, halfH, w, h, ca, sa, nearPlane, zBuffer });

    if (minimap) drawMinimap(ctx, level, player, level.entities, w, h);

    drawCrosshair(ctx, w, h);
  }

  return { resize, render, setWallTextures, setSpriteTextures, setResolutionScale, getResolutionScale };
}

function castRayDDA(level, ox, oy, rdx, rdy) {
  let mapX = Math.floor(ox);
  let mapY = Math.floor(oy);

  const deltaDistX = rdx === 0 ? 1e30 : Math.abs(1 / rdx);
  const deltaDistY = rdy === 0 ? 1e30 : Math.abs(1 / rdy);

  let stepX = 0;
  let stepY = 0;
  let sideDistX = 0;
  let sideDistY = 0;

  if (rdx < 0) {
    stepX = -1;
    sideDistX = (ox - mapX) * deltaDistX;
  } else {
    stepX = 1;
    sideDistX = (mapX + 1.0 - ox) * deltaDistX;
  }

  if (rdy < 0) {
    stepY = -1;
    sideDistY = (oy - mapY) * deltaDistY;
  } else {
    stepY = 1;
    sideDistY = (mapY + 1.0 - oy) * deltaDistY;
  }

  const maxSteps = 1024;
  for (let i = 0; i < maxSteps; i++) {
    let side = 0;
    if (sideDistX < sideDistY) {
      sideDistX += deltaDistX;
      mapX += stepX;
      side = 0;
    } else {
      sideDistY += deltaDistY;
      mapY += stepY;
      side = 1;
    }

    const tile = sampleTile(level, mapX, mapY);
    if (tile > 0) {
      const dist = side === 0 ? sideDistX - deltaDistX : sideDistY - deltaDistY;
      return { dist, tile, mapX, mapY, side };
    }
  }
  return null;
}

function sampleTile(level, tx, ty) {
  if (tx < 0 || ty < 0 || tx >= level.w || ty >= level.h) return 1;
  return level.grid[ty][tx] | 0;
}

function computeTextureX(texW, hit, ox, oy, rdx, rdy) {
  let wallX = 0;
  if (hit.side === 0) {
    const hitY = oy + hit.dist * rdy;
    wallX = hitY - Math.floor(hitY);
    if (rdx > 0) wallX = 1 - wallX;
  } else {
    const hitX = ox + hit.dist * rdx;
    wallX = hitX - Math.floor(hitX);
    if (rdy < 0) wallX = 1 - wallX;
  }
  return clamp(Math.floor(wallX * texW), 0, texW - 1);
}

function shadeForDist(dist) {
  const fogStart = 1.5;
  const fogEnd = 14;
  const t = (dist - fogStart) / (fogEnd - fogStart);
  const k = 1 - clamp01(t);
  return 0.2 + 0.8 * k;
}

function wallColor(tile) {
  switch (tile | 0) {
    case 2:
      return [80, 140, 255];
    case 3:
      return [240, 120, 90];
    default:
      return [190, 190, 190];
  }
}

function shadeColor([r, g, b], s) {
  const rr = Math.max(0, Math.min(255, (r * s) | 0));
  const gg = Math.max(0, Math.min(255, (g * s) | 0));
  const bb = Math.max(0, Math.min(255, (b * s) | 0));
  return `rgb(${rr},${gg},${bb})`;
}

function drawCrosshair(ctx, w, h) {
  const cx = (w / 2) | 0;
  const cy = (h / 2) | 0;
  ctx.strokeStyle = "rgba(255,255,255,0.72)";
  ctx.lineWidth = 1;
  ctx.lineCap = "square";
  ctx.beginPath();
  ctx.moveTo(cx - 9, cy);
  ctx.lineTo(cx - 3, cy);
  ctx.moveTo(cx + 3, cy);
  ctx.lineTo(cx + 9, cy);
  ctx.moveTo(cx, cy - 9);
  ctx.lineTo(cx, cy - 3);
  ctx.moveTo(cx, cy + 3);
  ctx.lineTo(cx, cy + 9);
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.fillRect(cx, cy, 1, 1);
}

function drawMinimap(ctx, level, player, entities, w, h) {
  const pad = 10;
  const size = Math.min(220, Math.floor(Math.min(w, h) * 0.32));
  const tile = Math.max(6, Math.floor(size / Math.max(level.w, level.h)));
  const mapW = level.w * tile;
  const mapH = level.h * tile;

  const x0 = pad;
  const y0 = h - pad - mapH;

  ctx.save();
  ctx.globalAlpha = 0.92;
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(x0 - 6, y0 - 6, mapW + 12, mapH + 12);

  for (let y = 0; y < level.h; y++) {
    for (let x = 0; x < level.w; x++) {
      const v = level.grid[y][x];
      if (v > 0) {
        const c = wallColor(v);
        ctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`;
        ctx.fillRect(x0 + x * tile, y0 + y * tile, tile, tile);
      } else {
        ctx.fillStyle = "rgba(255,255,255,0.06)";
        ctx.fillRect(x0 + x * tile, y0 + y * tile, tile, tile);
      }
    }
  }

  const px = x0 + player.x * tile;
  const py = y0 + player.y * tile;
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.beginPath();
  ctx.arc(px, py, Math.max(2, player.radius * tile), 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(255,255,255,0.95)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.lineTo(px + Math.cos(player.a) * tile * 0.85, py + Math.sin(player.a) * tile * 0.85);
  ctx.stroke();

  if (Array.isArray(entities)) {
    for (const e of entities) {
      const ex = x0 + e.x * tile;
      const ey = y0 + e.y * tile;
      ctx.fillStyle = e.type === "enemy_dummy" ? "rgba(255,80,200,0.95)" : "rgba(80,255,160,0.95)";
      ctx.beginPath();
      ctx.arc(ex, ey, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

function drawSprites(ctx, state, level, player, { planeDist, halfH, w, h, ca, sa, nearPlane, zBuffer }) {
  const entities = level.entities;
  if (!Array.isArray(entities) || entities.length === 0) return;

  const fov = state.fov;
  const tanHalfFov = Math.tan(fov / 2);

  const visible = [];
  for (let i = 0; i < entities.length; i++) {
    const e = entities[i];
    const tex = state.spriteTextures?.[e.type];
    if (!tex || tex.width <= 0 || tex.height <= 0) continue;

    const dx = e.x - player.x;
    const dy = e.y - player.y;

    const depth = dx * ca + dy * sa;
    if (depth <= nearPlane) continue;

    const side = -dx * sa + dy * ca;
    const cameraX = side / depth;
    if (cameraX < -tanHalfFov * 1.25 || cameraX > tanHalfFov * 1.25) continue;

    const screenX = (w / 2 + (cameraX / tanHalfFov) * (w / 2)) | 0;

    const spriteH = planeDist / depth;
    const spriteW = spriteH * (tex.width / tex.height);
    const drawH = Math.min(h * 2, Math.max(1, spriteH | 0));
    const drawW = Math.min(w * 2, Math.max(1, spriteW | 0));

    const startX = (screenX - drawW / 2) | 0;
    const endX = (screenX + drawW / 2) | 0;
    const startY = (halfH - drawH / 2) | 0;

    visible.push({ depth, tex, startX, endX, startY, drawH, drawW });
  }

  if (visible.length === 0) return;
  visible.sort((a, b) => b.depth - a.depth);

  for (const s of visible) {
    const { depth, tex, startX, endX, startY, drawH, drawW } = s;
    const clampedStartX = Math.max(0, startX);
    const clampedEndX = Math.min(w - 1, endX);
    if (clampedStartX > clampedEndX) continue;

    for (let x = clampedStartX; x <= clampedEndX; x++) {
      if (!(depth < zBuffer[x])) continue;
      const u = (x - startX) / Math.max(1e-6, endX - startX);
      const sx = clamp(Math.floor(u * tex.width), 0, tex.width - 1);
      ctx.drawImage(tex, sx, 0, 1, tex.height, x, startY, 1, drawH);
    }
  }
}

function clamp01(t) {
  return Math.max(0, Math.min(1, t));
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function normalizeAngle(a) {
  const twoPi = Math.PI * 2;
  a %= twoPi;
  if (a < 0) a += twoPi;
  return a;
}
