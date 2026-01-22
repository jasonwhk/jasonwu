function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function toLevelSpawn(raw) {
  const spawn = raw?.spawn ?? raw?.playerSpawn ?? raw?.player ?? null;
  assert(spawn && typeof spawn === "object", "[doomish] level spawn missing");

  const x = spawn.x;
  const y = spawn.y;
  const a = typeof spawn.a === "number" ? spawn.a : spawn.angle;
  assert(typeof x === "number" && typeof y === "number", "[doomish] spawn.x/spawn.y must be numbers");
  assert(typeof a === "number", "[doomish] spawn angle must be a number");

  return { x, y, a };
}

function normalizeGrid(raw) {
  const grid = raw?.grid;
  assert(Array.isArray(grid) && grid.length > 0, "[doomish] level grid missing/empty");

  const h = grid.length | 0;
  const w = Array.isArray(grid[0]) ? grid[0].length | 0 : 0;
  assert(w > 0, "[doomish] level grid row 0 missing/empty");

  const out = new Array(h);
  for (let y = 0; y < h; y++) {
    const row = grid[y];
    assert(Array.isArray(row) && row.length === w, `[doomish] level grid row ${y} width mismatch`);
    const r = new Array(w);
    for (let x = 0; x < w; x++) r[x] = row[x] | 0;
    out[y] = r;
  }

  return { grid: out, w, h };
}

function normalizeEntities(raw) {
  const entities = raw?.entities;
  if (!Array.isArray(entities) || entities.length === 0) return [];
  return entities.map((e) => ({ ...(e || {}) }));
}

function normalizeLevel(raw, fallbackName) {
  const { grid, w, h } = normalizeGrid(raw);
  const spawn = toLevelSpawn(raw);
  const name = typeof raw?.name === "string" && raw.name.trim() ? raw.name : fallbackName;
  const entities = normalizeEntities(raw);

  return { name, grid, w, h, spawn, entities };
}

function cloneLevel(level) {
  return {
    name: level.name,
    w: level.w,
    h: level.h,
    spawn: { ...level.spawn },
    grid: level.grid.map((r) => r.slice()),
    entities: level.entities.map((e) => ({ ...e })),
  };
}

async function fetchJson(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`[doomish] failed to load level: ${res.status} ${res.statusText}`);
  return res.json();
}

export class LevelManager {
  constructor({ levelUrls } = {}) {
    assert(Array.isArray(levelUrls) && levelUrls.length > 0, "[doomish] LevelManager requires levelUrls");
    this.levelUrls = levelUrls.slice();
    this.cache = new Map(); // url -> normalizedLevel
    this.currentIndex = 0;
  }

  getLevelCount() {
    return this.levelUrls.length;
  }

  getCurrentIndex() {
    return this.currentIndex | 0;
  }

  async loadLevel(indexOrName) {
    let index = 0;
    if (typeof indexOrName === "number") {
      index = indexOrName | 0;
    } else if (typeof indexOrName === "string") {
      const target = indexOrName.trim().toLowerCase();
      index = this.levelUrls.findIndex((u) => u.toLowerCase().includes(target));
      if (index < 0) index = 0;
    }

    if (index < 0) index = 0;
    if (index >= this.levelUrls.length) index = this.levelUrls.length - 1;

    const url = this.levelUrls[index];
    let normalized = this.cache.get(url);
    if (!normalized) {
      const raw = await fetchJson(url);
      normalized = normalizeLevel(raw, `Level ${index + 1}`);
      this.cache.set(url, normalized);
    }

    this.currentIndex = index;
    return cloneLevel(normalized);
  }

  async restartLevel() {
    return this.loadLevel(this.currentIndex);
  }

  async nextLevel() {
    const next = (this.currentIndex + 1) % this.levelUrls.length;
    return this.loadLevel(next);
  }
}

