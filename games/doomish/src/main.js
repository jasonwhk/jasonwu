import { createInput } from "./engine/input.js";
import { loadSpriteTextures, loadWallTextures } from "./engine/assets.js";
import { castRayDDA, createRenderer } from "./engine/renderer.js";
import { moveAndCollide } from "./engine/physics.js";
import { LevelManager } from "./game/levels.js";

const canvas = document.getElementById("game");
const hud = document.getElementById("hud");
const overlay = document.getElementById("overlay");
const playButton = document.getElementById("play");
const resumeButton = document.getElementById("resume");
const restartButton = document.getElementById("restart");
const nextButton = document.getElementById("next");
const quitButton = document.getElementById("quit");
const titleEl = document.getElementById("title");
const descEl = document.getElementById("desc");
const screenFlash = document.getElementById("screenFlash");
const damageFlash = document.getElementById("damageFlash");
const hitIndicator = document.getElementById("hitIndicator");

const levelManager = new LevelManager({
  levelUrls: ["../levels/level01.json", "../levels/level02.json", "../levels/level03.json"].map((p) =>
    new URL(p, import.meta.url).toString(),
  ),
});

const GAME_STATE = {
  LOADING: "loading",
  MENU: "menu",
  PLAYING: "playing",
  PAUSED: "paused",
  LEVEL_COMPLETE: "levelComplete",
  GAME_OVER: "gameOver",
};

let gameState = GAME_STATE.LOADING;

let level = null;
const player = {
  x: 1.5,
  y: 1.5,
  a: 0,
  radius: 0.22,
  maxHealth: 100,
  health: 100,
  ammo: 24,
  currentWeapon: "pistol",
  fireRate: 4,
  fireCooldown: 0,
};

const RES_SCALES = [1, 0.75, 0.5];
let resScaleIndex = 0;

const renderer = createRenderer(canvas, { resolutionScale: RES_SCALES[resScaleIndex] });
const input = createInput(canvas, {
  onPointerLockChange: (locked) => {
    if (locked) {
      if (gameState === GAME_STATE.MENU || gameState === GAME_STATE.PAUSED) setGameState(GAME_STATE.PLAYING);
    } else {
      if (gameState === GAME_STATE.PLAYING) setGameState(GAME_STATE.PAUSED);
    }
  },
});

loadWallTextures(import.meta.url, {
  1: "../assets/textures/brick.png",
  2: "../assets/textures/metal.png",
  3: "../assets/textures/hazard.png",
})
  .then((textures) => renderer.setWallTextures(textures))
  .catch((err) => console.warn("[doomish] texture load failed:", err));

loadSpriteTextures(import.meta.url, {
  pickup_health: "../assets/sprites/pickup_health.png",
  pickup_ammo: "../assets/sprites/pickup_ammo.png",
  enemy_dummy: "../assets/sprites/enemy_dummy.png",
  exit: "../assets/sprites/exit.svg",
})
  .then((textures) => renderer.setSpriteTextures(textures))
  .catch((err) => console.warn("[doomish] sprite load failed:", err));

playButton?.addEventListener("click", async () => {
  await startNewGame({ requestPointerLock: true });
});
resumeButton?.addEventListener("click", async () => {
  await resumeGame();
});
restartButton?.addEventListener("click", async () => {
  await restartFromOverlay();
});
nextButton?.addEventListener("click", async () => {
  await nextFromOverlay();
});
quitButton?.addEventListener("click", () => {
  quitToMenu();
});

function resize() {
  renderer.resize();
}
window.addEventListener("resize", resize);
resize();

const SIM_DT = 1 / 120;
let last = performance.now();
let acc = 0;

let minimap = true;
let debug = false;
let fpsSmooth = 60;

let muzzleFlashT = 0;
let hitFlashT = 0;
let damageFlashT = 0;

function tick(now) {
  const realDt = Math.min(0.05, (now - last) / 1000);
  last = now;
  acc += realDt;

  input.beginFrame();
  if (gameState === GAME_STATE.PLAYING) player.a = normalizeAngle(player.a + input.consumeMouseDeltaX() * 0.0022);

  if (input.consumePressed("KeyM") && gameState === GAME_STATE.PLAYING) minimap = !minimap;
  if (input.consumePressed("F3")) debug = !debug;
  if (input.consumePressed("KeyV")) {
    resScaleIndex = (resScaleIndex + 1) % RES_SCALES.length;
    renderer.setResolutionScale(RES_SCALES[resScaleIndex]);
    renderer.resize();
  }

  if (input.consumePressed("KeyR") && gameState !== GAME_STATE.LOADING) {
    if (gameState === GAME_STATE.PLAYING) {
      void restartLevelInPlace();
    } else {
      void restartFromOverlay();
    }
  }

  if (input.consumePressed("KeyP") && gameState !== GAME_STATE.LOADING) {
    if (gameState === GAME_STATE.PLAYING) pauseGame();
    else if (gameState === GAME_STATE.PAUSED) void resumeGame();
  }
  if (input.consumePressed("Escape") && gameState !== GAME_STATE.LOADING) {
    if (gameState === GAME_STATE.PLAYING) pauseGame();
    else if (gameState === GAME_STATE.PAUSED) void resumeGame();
  }

  if (input.consumePressed("KeyN") && gameState === GAME_STATE.LEVEL_COMPLETE) {
    void nextFromOverlay({ requestPointerLock: true });
  }

  muzzleFlashT = Math.max(0, muzzleFlashT - realDt);
  hitFlashT = Math.max(0, hitFlashT - realDt);
  damageFlashT = Math.max(0, damageFlashT - realDt);
  if (screenFlash) screenFlash.style.opacity = (muzzleFlashT > 0 ? (muzzleFlashT / 0.06) * 0.9 : 0).toFixed(3);
  if (damageFlash) damageFlash.style.opacity = (damageFlashT > 0 ? (damageFlashT / 0.22) * 0.85 : 0).toFixed(3);
  if (hitIndicator) hitIndicator.style.opacity = (hitFlashT > 0 ? (hitFlashT / 0.12) * 0.95 : 0).toFixed(3);

  while (acc >= SIM_DT) {
    const intent = input.getIntent();
    const turnSpeed = 2.5;
    if (gameState === GAME_STATE.PLAYING) player.a = normalizeAngle(player.a + intent.turn * turnSpeed * SIM_DT);

    if (gameState === GAME_STATE.PLAYING) {
      const moveSpeed = 3.2 * (intent.sprint ? 1.55 : 1.0);
      const strafeSpeed = 3.0 * (intent.sprint ? 1.55 : 1.0);
      const forward = intent.move;
      const strafe = intent.strafe;
      const len = Math.hypot(forward, strafe);
      const f = len > 1e-6 ? forward / Math.max(1, len) : 0;
      const s = len > 1e-6 ? strafe / Math.max(1, len) : 0;

      const ca = Math.cos(player.a);
      const sa = Math.sin(player.a);
      const vx = ca * f * moveSpeed + -sa * s * strafeSpeed;
      const vy = sa * f * moveSpeed + ca * s * strafeSpeed;

      moveAndCollide(player, level, vx * SIM_DT, vy * SIM_DT);
      collectPickups(player, level);
      if (checkExitTrigger(player, level)) {
        completeLevel();
        acc -= SIM_DT;
        continue;
      }

      updateEnemies(level, player, SIM_DT, {
        onPlayerDamaged: () => {
          damageFlashT = 0.22;
        },
        onPlayerDied: () => {
          damageFlashT = 0.35;
        },
      });

      player.fireCooldown = Math.max(0, player.fireCooldown - SIM_DT);
      if (intent.fire && player.fireCooldown <= 1e-6) {
        const shot = fireWeapon(player, level);
        if (shot.fired) {
          player.fireCooldown = 1 / Math.max(1e-6, player.fireRate);
          muzzleFlashT = 0.06;
          if (shot.hit) hitFlashT = 0.12;
        }
      }
    }

    acc -= SIM_DT;
  }

  fpsSmooth = fpsSmooth * 0.92 + (1 / Math.max(1e-6, realDt)) * 0.08;

  if (level) {
    renderer.render(level, player, {
    minimap,
    });
  }

  if (debug) {
    hud.textContent =
      `WASD move | Mouse look | LMB fire | F/Ctrl fire | M minimap | V res | R restart | P/Esc pause | N next\n` +
      `fps ${fpsSmooth.toFixed(0)} | res ${Math.round(renderer.getResolutionScale() * 100)}% | ` +
      `pos ${player.x.toFixed(2)},${player.y.toFixed(2)} | a ${(player.a * (180 / Math.PI)).toFixed(0)}°\n` +
      `${level?.name ?? "?"} (${(levelManager.getCurrentIndex() + 1) | 0}/${levelManager.getLevelCount()}) | ` +
      `weapon ${player.currentWeapon} | health ${player.health}/${player.maxHealth} | ammo ${player.ammo} | entities ${(level?.entities?.length ?? 0) | 0}`;
  } else {
    hud.textContent =
      `${level?.name ?? "?"} (${(levelManager.getCurrentIndex() + 1) | 0}/${levelManager.getLevelCount()}) | ` +
      `weapon ${player.currentWeapon} | health ${player.health}/${player.maxHealth} | ammo ${player.ammo}\n` +
      `WASD move | Mouse look | LMB fire | F/Ctrl fire | M minimap | V res | R restart | P/Esc pause | ${fpsSmooth.toFixed(0)} fps`;
  }
  requestAnimationFrame(tick);
}

function normalizeAngle(a) {
  const twoPi = Math.PI * 2;
  a %= twoPi;
  if (a < 0) a += twoPi;
  return a;
}

function collectPickups(player, level) {
  const entities = level.entities;
  if (!Array.isArray(entities) || entities.length === 0) return;

  const pr = player.radius;
  for (let i = entities.length - 1; i >= 0; i--) {
    const e = entities[i];
    if (!e || typeof e.x !== "number" || typeof e.y !== "number") continue;
    if (e.type !== "pickup_health" && e.type !== "pickup_ammo") continue;

    const er = typeof e.radius === "number" ? e.radius : 0.28;
    const dx = e.x - player.x;
    const dy = e.y - player.y;
    if (dx * dx + dy * dy > (pr + er) * (pr + er)) continue;

    if (e.type === "pickup_health") {
      player.health = Math.min(player.maxHealth, player.health + 25);
    } else if (e.type === "pickup_ammo") {
      player.ammo = Math.min(999, player.ammo + 12);
    }

    entities.splice(i, 1);
  }
}

function fireWeapon(player, level) {
  if (player.currentWeapon !== "pistol") return { fired: false, hit: false };
  if (player.ammo <= 0) return { fired: false, hit: false };

  player.ammo -= 1;
  const pistolDamage = 15;

  const rdx = Math.cos(player.a);
  const rdy = Math.sin(player.a);
  const wall = castRayDDA(level, player.x, player.y, rdx, rdy);
  const wallDist = wall ? wall.dist : Infinity;

  const hit = applyHitscanDamage(level, player.x, player.y, rdx, rdy, wallDist, pistolDamage);
  return { fired: true, hit };
}

function applyHitscanDamage(level, ox, oy, rdx, rdy, maxDist, damage) {
  const entities = level.entities;
  if (!Array.isArray(entities) || entities.length === 0) return false;

  let bestIndex = -1;
  let bestDist = Infinity;

  for (let i = 0; i < entities.length; i++) {
    const e = entities[i];
    if (!e || e.type !== "enemy_dummy") continue;
    const hp = typeof e.health === "number" ? e.health : 0;
    if (hp <= 0) continue;

    const r = typeof e.radius === "number" ? e.radius : 0.34;
    const dx = e.x - ox;
    const dy = e.y - oy;

    const t = dx * rdx + dy * rdy;
    if (t <= 0 || t >= maxDist) continue;

    const distSq = dx * dx + dy * dy;
    const closestSq = distSq - t * t;
    const rSq = r * r;
    if (closestSq > rSq) continue;

    const thc = Math.sqrt(Math.max(0, rSq - closestSq));
    const hitDist = t - thc;
    if (hitDist <= 0 || hitDist >= maxDist) continue;

    if (hitDist < bestDist) {
      bestDist = hitDist;
      bestIndex = i;
    }
  }

  if (bestIndex < 0) return false;

  const target = entities[bestIndex];
  target.health = (target.health | 0) - (damage | 0);
  if (target.health <= 0) {
    entities.splice(bestIndex, 1);
  }
  return true;
}

let loadSeq = 0;

async function startNewGame({ requestPointerLock } = {}) {
  const seq = ++loadSeq;
  setGameState(GAME_STATE.LOADING);
  try {
    level = await levelManager.loadLevel(0);
    if (seq !== loadSeq) return;
    resetPlayerForLevel(level, { resetStats: true });
    setGameState(GAME_STATE.MENU);
    if (requestPointerLock) await input.requestPointerLock();
  } catch (err) {
    console.warn("[doomish] failed to start game:", err);
    setGameState(GAME_STATE.MENU);
  }
}

async function restartLevelInPlace() {
  const seq = ++loadSeq;
  try {
    const newLevel = await levelManager.restartLevel();
    if (seq !== loadSeq) return;
    level = newLevel;
    resetPlayerForLevel(level, { resetStats: true });
  } catch (err) {
    console.warn("[doomish] restart failed:", err);
  }
}

async function restartFromOverlay({ requestPointerLock = true } = {}) {
  const seq = ++loadSeq;
  setGameState(GAME_STATE.LOADING);
  try {
    level = await levelManager.restartLevel();
    if (seq !== loadSeq) return;
    resetPlayerForLevel(level, { resetStats: true });
    setGameState(GAME_STATE.MENU);
    if (requestPointerLock) await input.requestPointerLock();
  } catch (err) {
    console.warn("[doomish] restart failed:", err);
    setGameState(GAME_STATE.MENU);
  }
}

async function nextFromOverlay({ requestPointerLock = true } = {}) {
  const seq = ++loadSeq;
  setGameState(GAME_STATE.LOADING);
  try {
    level = await levelManager.nextLevel();
    if (seq !== loadSeq) return;
    resetPlayerForLevel(level, { resetStats: true });
    setGameState(GAME_STATE.MENU);
    if (requestPointerLock) await input.requestPointerLock();
  } catch (err) {
    console.warn("[doomish] next level failed:", err);
    setGameState(GAME_STATE.MENU);
  }
}

function resetPlayerForLevel(level, { resetStats } = {}) {
  player.x = level.spawn.x;
  player.y = level.spawn.y;
  player.a = level.spawn.a;
  player.fireCooldown = 0;

  if (resetStats) {
    player.maxHealth = 100;
    player.health = player.maxHealth;
    player.ammo = 24;
    player.currentWeapon = "pistol";
    player.fireRate = 4;
  }
}

function pauseGame() {
  if (gameState !== GAME_STATE.PLAYING) return;
  setGameState(GAME_STATE.PAUSED);
  input.reset();
  try {
    document.exitPointerLock?.();
  } catch {
    // ignore
  }
}

async function resumeGame() {
  if (gameState !== GAME_STATE.PAUSED) return;
  await input.requestPointerLock();
}

function completeLevel() {
  if (gameState !== GAME_STATE.PLAYING) return;
  setGameState(GAME_STATE.LEVEL_COMPLETE);
  input.reset();
  try {
    document.exitPointerLock?.();
  } catch {
    // ignore
  }
}

function quitToMenu() {
  input.reset();
  try {
    document.exitPointerLock?.();
  } catch {
    // ignore
  }
  void startNewGame({ requestPointerLock: false });
}

function setGameState(next) {
  gameState = next;
  renderOverlay();
}

function renderOverlay() {
  if (!overlay) return;
  overlay.style.display = gameState === GAME_STATE.PLAYING ? "none" : "grid";

  const levelLabel = level
    ? `${level.name} (${(levelManager.getCurrentIndex() + 1) | 0}/${levelManager.getLevelCount()})`
    : "";

  if (gameState === GAME_STATE.LOADING) {
    if (titleEl) titleEl.textContent = "Loading…";
    if (descEl) descEl.textContent = "Loading level data…";
    if (playButton) playButton.style.display = "none";
    if (resumeButton) resumeButton.style.display = "none";
    if (restartButton) restartButton.style.display = "none";
    if (nextButton) nextButton.style.display = "none";
    if (quitButton) quitButton.style.display = "none";
    return;
  }

  if (gameState === GAME_STATE.MENU) {
    if (titleEl) titleEl.textContent = "Doomish";
    if (descEl) {
      descEl.innerHTML = `Start at <b>${levelLabel || "Level 1"}</b>.<br/>
        Controls: <code>WASD</code> move, <code>←/→</code> or <code>Q/E</code> turn, mouse look (pointer lock),
        <code>LMB</code> fire, <code>F</code>/<code>Ctrl</code> fire (no pointer lock),
        <code>R</code> restart, <code>P</code>/<code>Esc</code> pause, <code>M</code> minimap, <code>V</code> resolution.`;
    }
    if (playButton) playButton.style.display = "inline-block";
    if (resumeButton) resumeButton.style.display = "none";
    if (restartButton) restartButton.style.display = "none";
    if (nextButton) nextButton.style.display = "none";
    if (quitButton) quitButton.style.display = "none";
    return;
  }

  if (gameState === GAME_STATE.PAUSED) {
    if (titleEl) titleEl.textContent = "Paused";
    if (descEl) {
      descEl.innerHTML = `${levelLabel ? `<b>${levelLabel}</b><br/>` : ""}Press <code>P</code> / <code>Esc</code> to resume.`;
    }
    if (playButton) playButton.style.display = "none";
    if (resumeButton) resumeButton.style.display = "inline-block";
    if (restartButton) restartButton.style.display = "inline-block";
    if (nextButton) nextButton.style.display = "none";
    if (quitButton) quitButton.style.display = "inline-block";
    return;
  }

  if (gameState === GAME_STATE.LEVEL_COMPLETE) {
    if (titleEl) titleEl.textContent = "Level Complete";
    if (descEl) {
      descEl.innerHTML = `${levelLabel ? `<b>${levelLabel}</b><br/>` : ""}Press <code>N</code> to continue or <code>R</code> to replay.`;
    }
    if (playButton) playButton.style.display = "none";
    if (resumeButton) resumeButton.style.display = "none";
    if (restartButton) restartButton.style.display = "inline-block";
    if (nextButton) nextButton.style.display = "inline-block";
    if (quitButton) quitButton.style.display = "inline-block";
    return;
  }

  if (gameState === GAME_STATE.GAME_OVER) {
    if (titleEl) titleEl.textContent = "Game Over";
    if (descEl) {
      descEl.innerHTML = `You died on ${levelLabel || "this level"}. Press <code>R</code> to restart or quit to menu.`;
    }
    if (playButton) playButton.style.display = "none";
    if (resumeButton) resumeButton.style.display = "none";
    if (restartButton) restartButton.style.display = "inline-block";
    if (nextButton) nextButton.style.display = "none";
    if (quitButton) quitButton.style.display = "inline-block";
    return;
  }
}

function updateEnemies(level, player, dt, { onPlayerDamaged, onPlayerDied } = {}) {
  const entities = level.entities;
  if (!Array.isArray(entities) || entities.length === 0) return;

  const alertRadius = 6.0;
  const attackRange = 0.85;
  const chaseSpeed = 1.2;
  const memoryTime = 2.5;
  const alertPause = 0.25;

  for (const e of entities) {
    if (!e || e.type !== "enemy_dummy") continue;
    if ((e.health | 0) <= 0) continue;
    if (typeof e.x !== "number" || typeof e.y !== "number") continue;

    e.radius = typeof e.radius === "number" ? e.radius : 0.34;
    e.aiState = e.aiState || "IDLE";
    e.aiStateT = typeof e.aiStateT === "number" ? e.aiStateT : 0;
    e.aiMemory = typeof e.aiMemory === "number" ? e.aiMemory : 0;
    e.attackCooldown = typeof e.attackCooldown === "number" ? e.attackCooldown : 0;
    e.attackDamage = typeof e.attackDamage === "number" ? e.attackDamage : 8;
    e.attackInterval = typeof e.attackInterval === "number" ? e.attackInterval : 0.8;

    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const dist = Math.hypot(dx, dy);
    const inProximity = dist < alertRadius;
    const hasLos = dist > 1e-6 ? hasLineOfSight(level, e.x, e.y, player.x, player.y, dist) : true;
    const aware = inProximity || hasLos;

    if (aware) e.aiMemory = memoryTime;
    else e.aiMemory = Math.max(0, e.aiMemory - dt);

    e.aiStateT += dt;
    e.attackCooldown = Math.max(0, e.attackCooldown - dt);

    if (e.aiState === "IDLE") {
      if (aware) {
        e.aiState = "ALERT";
        e.aiStateT = 0;
      }
      continue;
    }

    if (e.aiState === "ALERT") {
      if (!aware && e.aiMemory <= 1e-6) {
        e.aiState = "IDLE";
        e.aiStateT = 0;
        continue;
      }
      if (e.aiStateT >= alertPause) {
        e.aiState = "CHASE";
        e.aiStateT = 0;
      }
      continue;
    }

    if (e.aiState === "CHASE") {
      if (dist < attackRange) {
        e.aiState = "ATTACK";
        e.aiStateT = 0;
        continue;
      }

      if (!aware && e.aiMemory <= 1e-6) {
        e.aiState = "IDLE";
        e.aiStateT = 0;
        continue;
      }

      if (dist > 1e-6) {
        const inv = 1 / dist;
        const vx = (dx * inv) * chaseSpeed;
        const vy = (dy * inv) * chaseSpeed;
        const moved = tryMoveEnemy(level, e, vx * dt, vy * dt);
        if (!moved) {
          const movedAlt1 = tryMoveEnemy(level, e, (-vy) * dt, vx * dt);
          if (!movedAlt1) tryMoveEnemy(level, e, vy * dt, (-vx) * dt);
        }
      }
      continue;
    }

    if (e.aiState === "ATTACK") {
      if (dist > attackRange * 1.2) {
        e.aiState = "CHASE";
        e.aiStateT = 0;
        continue;
      }

      if (e.attackCooldown <= 1e-6) {
        e.attackCooldown = Math.max(0.1, e.attackInterval);
        applyPlayerDamage(player, e.attackDamage | 0, { onPlayerDamaged, onPlayerDied });
      }
      continue;
    }
  }
}

function hasLineOfSight(level, ox, oy, tx, ty, distToTarget) {
  const dx = tx - ox;
  const dy = ty - oy;
  const inv = 1 / Math.max(1e-6, distToTarget);
  const rdx = dx * inv;
  const rdy = dy * inv;
  const wall = castRayDDA(level, ox, oy, rdx, rdy);
  const wallDist = wall ? wall.dist : Infinity;
  return wallDist + 0.02 >= distToTarget;
}

function tryMoveEnemy(level, enemy, dx, dy) {
  const ox = enemy.x;
  const oy = enemy.y;
  moveAndCollide(enemy, level, dx, dy);
  const moved = Math.hypot(enemy.x - ox, enemy.y - oy) > 1e-5;
  return moved;
}

function applyPlayerDamage(player, damage, { onPlayerDamaged, onPlayerDied } = {}) {
  if (gameState !== GAME_STATE.PLAYING) return;
  if (!(damage > 0)) return;
  const prev = player.health | 0;
  player.health = Math.max(0, (prev - (damage | 0)) | 0);
  if (player.health < prev) onPlayerDamaged?.();
  if (player.health <= 0) {
    setGameState(GAME_STATE.GAME_OVER);
    onPlayerDied?.();
    input.reset();
    try {
      document.exitPointerLock?.();
    } catch {
      // ignore
    }
  }
}

function checkExitTrigger(player, level) {
  const entities = level?.entities;
  if (!Array.isArray(entities) || entities.length === 0) return false;

  const pr = player.radius;
  for (const e of entities) {
    if (!e || e.type !== "exit") continue;
    const er = typeof e.radius === "number" ? e.radius : 0.45;
    const dx = e.x - player.x;
    const dy = e.y - player.y;
    if (dx * dx + dy * dy <= (pr + er) * (pr + er)) return true;
  }
  return false;
}

async function init() {
  setGameState(GAME_STATE.LOADING);
  try {
    level = await levelManager.loadLevel(0);
    resetPlayerForLevel(level, { resetStats: true });
    setGameState(GAME_STATE.MENU);
  } catch (err) {
    console.warn("[doomish] level init failed:", err);
    setGameState(GAME_STATE.MENU);
  }
  requestAnimationFrame(tick);
}

init();
