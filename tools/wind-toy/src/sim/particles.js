export function createParticles() {
  return {
    count: 0,
    width: 0,
    height: 0,
    x: null,
    y: null,
    px: null,
    py: null,
  };
}

export function resizeParticles(particles, { count, width, height }) {
  particles.count = count;
  particles.width = width;
  particles.height = height;

  if (!particles.x || particles.x.length !== count) {
    particles.x = new Float32Array(count);
    particles.y = new Float32Array(count);
    particles.px = new Float32Array(count);
    particles.py = new Float32Array(count);
  }

  seedParticles(particles);
}

export function seedParticles(particles) {
  const { count, width, height, x, y, px, py } = particles;
  for (let i = 0; i < count; i += 1) {
    const nx = Math.random() * width;
    const ny = Math.random() * height;
    x[i] = nx;
    y[i] = ny;
    px[i] = nx;
    py[i] = ny;
  }
}

export function stepParticles(particles, field, dt, time, options = {}) {
  const { count, width, height, x, y, px, py } = particles;
  const { drag = 0.18, noise = 18 } = options;
  const dragFactor = Math.max(0, 1 - drag * dt);
  const noisePhase = time * 0.6;

  for (let i = 0; i < count; i += 1) {
    const cx = x[i];
    const cy = y[i];

    const { vx, vy } = sampleField(field, cx, cy);
    const jitterX = Math.sin(cy * 0.01 + noisePhase) * noise;
    const jitterY = Math.cos(cx * 0.01 + noisePhase) * noise;
    const nextVx = (vx + jitterX) * dragFactor;
    const nextVy = (vy + jitterY) * dragFactor;

    const nx = cx + nextVx * dt;
    const ny = cy + nextVy * dt;

    px[i] = cx;
    py[i] = cy;

    x[i] = wrap(nx, width);
    y[i] = wrap(ny, height);
  }
}

function sampleField(field, x, y) {
  const { width, height, worldWidth, worldHeight, u, v } = field;
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

  const u0 = lerp(u[idx00], u[idx10], tx);
  const u1 = lerp(u[idx01], u[idx11], tx);
  const v0 = lerp(v[idx00], v[idx10], tx);
  const v1 = lerp(v[idx01], v[idx11], tx);

  return {
    vx: lerp(u0, u1, ty),
    vy: lerp(v0, v1, ty),
  };
}

function wrap(value, max) {
  if (value < 0) {
    return value + max;
  }
  if (value > max) {
    return value - max;
  }
  return value;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}
