export function createField({ worldWidth, worldHeight, gridWidth, gridHeight }) {
  const field = {
    width: 0,
    height: 0,
    worldWidth: 0,
    worldHeight: 0,
    cellWidth: 1,
    cellHeight: 1,
    u: null,
    v: null,
  };

  resizeField(field, { worldWidth, worldHeight, gridWidth, gridHeight });
  return field;
}

export function resizeField(field, { worldWidth, worldHeight, gridWidth, gridHeight }) {
  field.width = gridWidth;
  field.height = gridHeight;
  field.worldWidth = worldWidth;
  field.worldHeight = worldHeight;
  field.cellWidth = worldWidth / (gridWidth - 1);
  field.cellHeight = worldHeight / (gridHeight - 1);

  const nextSize = gridWidth * gridHeight;
  if (!field.u || field.u.length !== nextSize) {
    field.u = new Float32Array(nextSize);
    field.v = new Float32Array(nextSize);
  } else {
    field.u.fill(0);
    field.v.fill(0);
  }
}

export function clearField(field) {
  field.u.fill(0);
  field.v.fill(0);
}

export function applyDamping(field, damping) {
  const { u, v } = field;
  for (let i = 0; i < u.length; i += 1) {
    u[i] *= damping;
    v[i] *= damping;
  }
}

export function addVelocity(field, x, y, vx, vy, radius, strength = 1) {
  const { width, height, worldWidth, worldHeight, u, v } = field;
  const gx = (x / worldWidth) * (width - 1);
  const gy = (y / worldHeight) * (height - 1);
  const rx = (radius / worldWidth) * (width - 1);
  const ry = (radius / worldHeight) * (height - 1);
  const r = Math.max(1, Math.max(rx, ry));
  const r2 = r * r;
  const sigma = r * 0.55;
  const sigma2 = sigma * sigma;
  const vxScaled = vx * strength;
  const vyScaled = vy * strength;

  const minX = Math.max(0, Math.floor(gx - r));
  const maxX = Math.min(width - 1, Math.ceil(gx + r));
  const minY = Math.max(0, Math.floor(gy - r));
  const maxY = Math.min(height - 1, Math.ceil(gy + r));

  for (let iy = minY; iy <= maxY; iy += 1) {
    const dy = iy - gy;
    for (let ix = minX; ix <= maxX; ix += 1) {
      const dx = ix - gx;
      const dist2 = dx * dx + dy * dy;
      if (dist2 > r2) {
        continue;
      }
      const weight = Math.exp(-dist2 / (2 * sigma2));
      const index = iy * width + ix;
      u[index] += vxScaled * weight;
      v[index] += vyScaled * weight;
    }
  }
}
