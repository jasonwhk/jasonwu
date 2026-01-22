import { createInput } from "./engine/input.js";
import { loadSpriteTextures, loadWallTextures } from "./engine/assets.js";
import { castRayDDA, createRenderer } from "./engine/renderer.js";
import { moveAndCollide } from "./engine/physics.js";
import { createLevel1 } from "./game/level.js";

const canvas = document.getElementById("game");
const hud = document.getElementById("hud");
const overlay = document.getElementById("overlay");
const playButton = document.getElementById("play");
const restartButton = document.getElementById("restart");
const titleEl = document.getElementById("title");
const descEl = document.getElementById("desc");
const screenFlash = document.getElementById("screenFlash");
const damageFlash = document.getElementById("damageFlash");
const hitIndicator = document.getElementById("hitIndicator");

let level = createLevel1();
const player = {
  x: level.spawn.x,
  y: level.spawn.y,
  a: level.spawn.a,
  radius: 0.22,
  maxHealth: 100,
  health: 100,
  ammo: 24,
  currentWeapon: "pistol",
  fireRate: 4,
  fireCooldown: 0,
};

let gameOver = false;

const RES_SCALES = [1, 0.75, 0.5];
let resScaleIndex = 0;

const renderer = createRenderer(canvas, { resolutionScale: RES_SCALES[resScaleIndex] });
const input = createInput(canvas, {
  onPointerLockChange: (locked) => {
    overlay.style.display = locked ? "none" : "grid";
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
})
  .then((textures) => renderer.setSpriteTextures(textures))
  .catch((err) => console.warn("[doomish] sprite load failed:", err));

playButton.addEventListener("click", async () => {
  if (gameOver) restartLevel({ requestPointerLock: false });
  await input.requestPointerLock();
});
restartButton?.addEventListener("click", async () => {
  restartLevel({ requestPointerLock: false });
  await input.requestPointerLock();
});
canvas.addEventListener("click", async () => {
  if (!input.isPointerLocked()) await input.requestPointerLock();
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
  player.a = normalizeAngle(player.a + input.consumeMouseDeltaX() * 0.0022);
  if (input.consumePressed("KeyM")) minimap = !minimap;
  if (input.consumePressed("F3")) debug = !debug;
  if (input.consumePressed("KeyV")) {
    resScaleIndex = (resScaleIndex + 1) % RES_SCALES.length;
    renderer.setResolutionScale(RES_SCALES[resScaleIndex]);
    renderer.resize();
  }
  if (input.consumePressed("KeyR")) {
    restartLevel({ requestPointerLock: input.isPointerLocked() });
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
    player.a = normalizeAngle(player.a + intent.turn * turnSpeed * SIM_DT);

    if (!gameOver) {
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

  renderer.render(level, player, {
    minimap,
  });

  if (debug) {
    hud.textContent =
      `WASD move | Mouse look | LMB fire | F/Ctrl fire | M minimap | V res | R restart | F3 debug | Esc unlock\n` +
      `fps ${fpsSmooth.toFixed(0)} | res ${Math.round(renderer.getResolutionScale() * 100)}% | ` +
      `pos ${player.x.toFixed(2)},${player.y.toFixed(2)} | a ${(player.a * (180 / Math.PI)).toFixed(0)}°\n` +
      `weapon ${player.currentWeapon} | health ${player.health}/${player.maxHealth} | ammo ${player.ammo} | entities ${(level.entities?.length ?? 0) | 0}`;
  } else {
    hud.textContent =
      `weapon ${player.currentWeapon} | health ${player.health}/${player.maxHealth} | ammo ${player.ammo}\n` +
      `WASD move | Mouse look | LMB fire | F/Ctrl fire | M minimap | V res | R restart | F3 debug | Esc unlock | ${fpsSmooth.toFixed(
        0,
      )} fps`;
  }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

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

function restartLevel({ requestPointerLock } = {}) {
  level = createLevel1();
  player.x = level.spawn.x;
  player.y = level.spawn.y;
  player.a = level.spawn.a;
  player.maxHealth = 100;
  player.health = player.maxHealth;
  player.ammo = 24;
  player.fireCooldown = 0;
  gameOver = false;

  setOverlayGameOver(false);

  if (requestPointerLock) {
    // Best-effort; may fail without a user gesture.
    input.requestPointerLock();
  }
}

function setOverlayGameOver(isGameOver) {
  if (restartButton) restartButton.style.display = isGameOver ? "inline-block" : "none";
  if (titleEl) titleEl.textContent = isGameOver ? "Game Over" : "Doomish — Milestone 5";
  if (descEl) {
    descEl.innerHTML = isGameOver
      ? `You died. Press <code>R</code> or use <b>Restart Level</b>.`
      : `Controls: <code>WASD</code> move, <code>←/→</code> or <code>Q/E</code> turn, mouse look (pointer lock),
            <code>LMB</code> fire, <code>F</code>/<code>Ctrl</code> fire (no pointer lock), <code>M</code> minimap,
            <code>V</code> resolution, <code>R</code> restart, <code>F3</code> debug, <code>Esc</code> unlock.`;
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
  if (gameOver) return;
  if (!(damage > 0)) return;
  const prev = player.health | 0;
  player.health = Math.max(0, (prev - (damage | 0)) | 0);
  if (player.health < prev) onPlayerDamaged?.();
  if (player.health <= 0) {
    gameOver = true;
    onPlayerDied?.();
    setOverlayGameOver(true);
    try {
      document.exitPointerLock?.();
    } catch {
      // ignore
    }
  }
}
