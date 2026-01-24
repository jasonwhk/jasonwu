export function createObstacleField({ worldWidth, worldHeight, gridWidth, gridHeight }) {
  const obstacles = {
    width: 0,
    height: 0,
    worldWidth: 0,
    worldHeight: 0,
    cellWidth: 1,
    cellHeight: 1,
    data: null,
  };

  resizeObstacleField(obstacles, { worldWidth, worldHeight, gridWidth, gridHeight });
  return obstacles;
}

export function resizeObstacleField(obstacles, { worldWidth, worldHeight, gridWidth, gridHeight }) {
  obstacles.width = gridWidth;
  obstacles.height = gridHeight;
  obstacles.worldWidth = worldWidth;
  obstacles.worldHeight = worldHeight;
  obstacles.cellWidth = worldWidth / (gridWidth - 1);
  obstacles.cellHeight = worldHeight / (gridHeight - 1);

  const size = gridWidth * gridHeight;
  if (!obstacles.data || obstacles.data.length !== size) {
    obstacles.data = new Uint8Array(size);
  } else {
    obstacles.data.fill(0);
  }
}

export function clearObstacles(obstacles) {
  obstacles.data.fill(0);
}

export function paintObstacle(obstacles, x, y, radius, add = true) {
  const { width, height, worldWidth, worldHeight, data } = obstacles;
  const gx = (x / worldWidth) * (width - 1);
  const gy = (y / worldHeight) * (height - 1);
  const rx = (radius / worldWidth) * (width - 1);
  const ry = (radius / worldHeight) * (height - 1);
  const r = Math.max(1, Math.max(rx, ry));
  const r2 = r * r;

  const minX = Math.max(0, Math.floor(gx - r));
  const maxX = Math.min(width - 1, Math.ceil(gx + r));
  const minY = Math.max(0, Math.floor(gy - r));
  const maxY = Math.min(height - 1, Math.ceil(gy + r));

  const value = add ? 1 : 0;

  for (let iy = minY; iy <= maxY; iy += 1) {
    const dy = iy - gy;
    for (let ix = minX; ix <= maxX; ix += 1) {
      const dx = ix - gx;
      const dist2 = dx * dx + dy * dy;
      if (dist2 > r2) {
        continue;
      }
      data[iy * width + ix] = value;
    }
  }
}

export function isSolidAt(obstacles, x, y) {
  const { width, height, worldWidth, worldHeight, data } = obstacles;
  if (!data || width <= 1 || height <= 1) {
    return false;
  }
  const gx = clamp(Math.round((x / worldWidth) * (width - 1)), 0, width - 1);
  const gy = clamp(Math.round((y / worldHeight) * (height - 1)), 0, height - 1);
  return data[gy * width + gx] === 1;
}

export function applyObstaclesToField(field, obstacles, boundaryDamping = 0.25) {
  if (!obstacles?.data || obstacles.data.length !== field.u.length) {
    return;
  }
  const { width, height, u, v } = field;
  const solid = obstacles.data;
  const damp = clamp(boundaryDamping, 0, 1);

  for (let y = 0; y < height; y += 1) {
    const rowOffset = y * width;
    for (let x = 0; x < width; x += 1) {
      const index = rowOffset + x;
      if (solid[index]) {
        u[index] = 0;
        v[index] = 0;
        continue;
      }
      const hasLeft = x > 0 && solid[index - 1];
      const hasRight = x < width - 1 && solid[index + 1];
      const hasUp = y > 0 && solid[index - width];
      const hasDown = y < height - 1 && solid[index + width];
      if (hasLeft || hasRight) {
        u[index] *= damp;
      }
      if (hasUp || hasDown) {
        v[index] *= damp;
      }
    }
  }
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
