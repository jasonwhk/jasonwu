export function moveAndCollide(player, level, dx, dy) {
  if (dx !== 0) {
    const nx = player.x + dx;
    if (!circleHitsWall(level, nx, player.y, player.radius)) {
      player.x = nx;
    } else {
      player.x = slideAxis(level, player.x, player.y, player.radius, dx, 0).x;
    }
  }

  if (dy !== 0) {
    const ny = player.y + dy;
    if (!circleHitsWall(level, player.x, ny, player.radius)) {
      player.y = ny;
    } else {
      player.y = slideAxis(level, player.x, player.y, player.radius, 0, dy).y;
    }
  }
}

function slideAxis(level, x, y, r, dx, dy) {
  if (dx !== 0) {
    const sign = Math.sign(dx);
    const probeX = x + dx;
    const minY = y - r;
    const maxY = y + r;
    const tx = Math.floor(probeX + sign * r);
    const ty0 = Math.floor(minY);
    const ty1 = Math.floor(maxY);
    for (let ty = ty0; ty <= ty1; ty++) {
      if (isWall(level, tx, ty)) {
        const clampX = sign > 0 ? tx - r : tx + 1 + r;
        return { x: clampX, y };
      }
    }
  }

  if (dy !== 0) {
    const sign = Math.sign(dy);
    const probeY = y + dy;
    const minX = x - r;
    const maxX = x + r;
    const ty = Math.floor(probeY + sign * r);
    const tx0 = Math.floor(minX);
    const tx1 = Math.floor(maxX);
    for (let tx = tx0; tx <= tx1; tx++) {
      if (isWall(level, tx, ty)) {
        const clampY = sign > 0 ? ty - r : ty + 1 + r;
        return { x, y: clampY };
      }
    }
  }

  return { x, y };
}

function circleHitsWall(level, x, y, r) {
  const minX = Math.floor(x - r);
  const maxX = Math.floor(x + r);
  const minY = Math.floor(y - r);
  const maxY = Math.floor(y + r);

  for (let ty = minY; ty <= maxY; ty++) {
    for (let tx = minX; tx <= maxX; tx++) {
      if (!isWall(level, tx, ty)) continue;

      const cx = clamp(x, tx, tx + 1);
      const cy = clamp(y, ty, ty + 1);
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy < r * r) return true;
    }
  }
  return false;
}

function isWall(level, tx, ty) {
  if (tx < 0 || ty < 0 || tx >= level.w || ty >= level.h) return true;
  return level.grid[ty][tx] > 0;
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

