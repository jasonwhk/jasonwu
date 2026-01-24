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

export function resizeParticles(particles, { count, width, height, reseed = true }) {
  const prevCount = particles.count;
  const prevX = particles.x;
  const prevY = particles.y;
  const prevPx = particles.px;
  const prevPy = particles.py;
  particles.count = count;
  particles.width = width;
  particles.height = height;

  if (!particles.x || particles.x.length !== count) {
    particles.x = new Float32Array(count);
    particles.y = new Float32Array(count);
    particles.px = new Float32Array(count);
    particles.py = new Float32Array(count);

    if (!reseed && prevX && prevY && prevPx && prevPy) {
      const copyCount = Math.min(prevCount, count);
      particles.x.set(prevX.subarray(0, copyCount));
      particles.y.set(prevY.subarray(0, copyCount));
      particles.px.set(prevPx.subarray(0, copyCount));
      particles.py.set(prevPy.subarray(0, copyCount));
      if (count > copyCount) {
        seedRange(particles, copyCount);
      }
      return;
    }
  }

  if (reseed) {
    seedParticles(particles);
  }
}

export function seedParticles(particles) {
  seedRange(particles, 0);
}

function seedRange(particles, startIndex) {
  const { count, width, height, x, y, px, py } = particles;
  for (let i = startIndex; i < count; i += 1) {
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
  const { drag = 0.18, noise = 18, gravity = 0, speedScale = 1, obstacles = null } = options;
  const solid = obstacles?.data;
  const solidWidth = obstacles?.width ?? 0;
  const solidHeight = obstacles?.height ?? 0;
  const dragFactor = Math.max(0, 1 - drag * dt);
  const noisePhase = time * 0.6;

  for (let i = 0; i < count; i += 1) {
    const cx = x[i];
    const cy = y[i];

    if (solid && isSolidAt(solid, solidWidth, solidHeight, field, cx, cy)) {
      const nx = Math.random() * width;
      const ny = Math.random() * height;
      x[i] = nx;
      y[i] = ny;
      px[i] = nx;
      py[i] = ny;
      continue;
    }

    const { vx, vy } = sampleField(field, cx, cy);
    const jitterX = Math.sin(cy * 0.01 + noisePhase) * noise;
    const jitterY = Math.cos(cx * 0.01 + noisePhase) * noise;
    const nextVx = (vx + jitterX) * dragFactor * speedScale;
    const nextVy = (vy + jitterY) * dragFactor * speedScale + gravity * dt;

    const nx = cx + nextVx * dt;
    const ny = cy + nextVy * dt;

    const wrappedX = wrap(nx, width);
    const wrappedY = wrap(ny, height);
    const wrapped = wrappedX !== nx || wrappedY !== ny;

    px[i] = wrapped ? wrappedX : cx;
    py[i] = wrapped ? wrappedY : cy;

    x[i] = wrappedX;
    y[i] = wrappedY;
  }
}

function isSolidAt(solid, solidWidth, solidHeight, field, x, y) {
  if (!solid || solidWidth <= 1 || solidHeight <= 1) {
    return false;
  }
  const gx = Math.round((x / field.worldWidth) * (solidWidth - 1));
  const gy = Math.round((y / field.worldHeight) * (solidHeight - 1));
  const ix = clamp(gx, 0, solidWidth - 1);
  const iy = clamp(gy, 0, solidHeight - 1);
  return solid[iy * solidWidth + ix] === 1;
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

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}
