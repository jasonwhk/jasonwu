export function createScalarField({ worldWidth, worldHeight, gridWidth, gridHeight }) {
  const field = {
    width: 0,
    height: 0,
    worldWidth: 0,
    worldHeight: 0,
    cellWidth: 1,
    cellHeight: 1,
    data: null,
    next: null,
  };

  resizeScalarField(field, { worldWidth, worldHeight, gridWidth, gridHeight });
  return field;
}

export function resizeScalarField(field, { worldWidth, worldHeight, gridWidth, gridHeight }) {
  field.width = gridWidth;
  field.height = gridHeight;
  field.worldWidth = worldWidth;
  field.worldHeight = worldHeight;
  field.cellWidth = worldWidth / (gridWidth - 1);
  field.cellHeight = worldHeight / (gridHeight - 1);

  const size = gridWidth * gridHeight;
  if (!field.data || field.data.length !== size) {
    field.data = new Float32Array(size);
    field.next = new Float32Array(size);
  } else {
    field.data.fill(0);
    field.next.fill(0);
  }
}

export function clearScalarField(field) {
  field.data.fill(0);
  field.next.fill(0);
}

export function addScalar(field, x, y, amount, radius, obstacles = null) {
  const { width, height, worldWidth, worldHeight, data } = field;
  const solid = obstacles?.data;
  const gx = (x / worldWidth) * (width - 1);
  const gy = (y / worldHeight) * (height - 1);
  const rx = (radius / worldWidth) * (width - 1);
  const ry = (radius / worldHeight) * (height - 1);
  const r = Math.max(1, Math.max(rx, ry));
  const r2 = r * r;
  const sigma = r * 0.5;
  const sigma2 = sigma * sigma;

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
      if (solid && solid[index]) {
        continue;
      }
      data[index] += amount * weight;
    }
  }
}

export function advectScalar(field, velocityField, dt, dissipation = 0.985, obstacles = null) {
  const { width, height, worldWidth, worldHeight, data, next } = field;
  const { u, v } = velocityField;
  const solid = obstacles?.data;

  for (let iy = 0; iy < height; iy += 1) {
    const y = (iy / (height - 1)) * worldHeight;
    for (let ix = 0; ix < width; ix += 1) {
      const x = (ix / (width - 1)) * worldWidth;
      const index = iy * width + ix;
      if (solid && solid[index]) {
        next[index] = 0;
        continue;
      }
      const vx = u[index];
      const vy = v[index];
      const px = clamp(x - vx * dt, 0, worldWidth);
      const py = clamp(y - vy * dt, 0, worldHeight);
      next[index] = sampleScalar(field, px, py) * dissipation;
    }
  }

  field.data = next;
  field.next = data;
}

function sampleScalar(field, x, y) {
  const { width, height, worldWidth, worldHeight, data } = field;
  const gx = (x / worldWidth) * (width - 1);
  const gy = (y / worldHeight) * (height - 1);
  const x0 = Math.floor(gx);
  const y0 = Math.floor(gy);
  const x1 = Math.min(width - 1, x0 + 1);
  const y1 = Math.min(height - 1, y0 + 1);
  const tx = gx - x0;
  const ty = gy - y0;

  const idx00 = y0 * width + x0;
  const idx10 = y0 * width + x1;
  const idx01 = y1 * width + x0;
  const idx11 = y1 * width + x1;

  const v0 = lerp(data[idx00], data[idx10], tx);
  const v1 = lerp(data[idx01], data[idx11], tx);
  return lerp(v0, v1, ty);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}
