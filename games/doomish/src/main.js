import { createInput } from "./engine/input.js";
import { loadWallTextures } from "./engine/assets.js";
import { createRenderer } from "./engine/renderer.js";
import { moveAndCollide } from "./engine/physics.js";
import { createLevel1 } from "./game/level.js";

const canvas = document.getElementById("game");
const hud = document.getElementById("hud");
const overlay = document.getElementById("overlay");
const playButton = document.getElementById("play");

const level = createLevel1();
const player = {
  x: level.spawn.x,
  y: level.spawn.y,
  a: level.spawn.a,
  radius: 0.22,
};

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

playButton.addEventListener("click", async () => {
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

function tick(now) {
  const realDt = Math.min(0.05, (now - last) / 1000);
  last = now;
  acc += realDt;

  input.beginFrame();
  player.a = normalizeAngle(player.a + input.consumeMouseDeltaX() * 0.0022);
  if (input.consumePressed("KeyM")) minimap = !minimap;
  if (input.consumePressed("F3")) debug = !debug;
  if (input.consumePressed("KeyR")) {
    resScaleIndex = (resScaleIndex + 1) % RES_SCALES.length;
    renderer.setResolutionScale(RES_SCALES[resScaleIndex]);
    renderer.resize();
  }

  while (acc >= SIM_DT) {
    const intent = input.getIntent();
    const turnSpeed = 2.5;
    player.a = normalizeAngle(player.a + intent.turn * turnSpeed * SIM_DT);

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

    acc -= SIM_DT;
  }

  fpsSmooth = fpsSmooth * 0.92 + (1 / Math.max(1e-6, realDt)) * 0.08;

  renderer.render(level, player, {
    minimap,
  });

  if (debug) {
    hud.textContent =
      `WASD move | Mouse look | M minimap | R res | F3 debug | Esc unlock\n` +
      `fps ${fpsSmooth.toFixed(0)} | res ${Math.round(renderer.getResolutionScale() * 100)}% | ` +
      `pos ${player.x.toFixed(2)},${player.y.toFixed(2)} | a ${(player.a * (180 / Math.PI)).toFixed(0)}°`;
  } else {
    hud.textContent = `WASD move | Mouse look | M minimap | R res | F3 debug | Esc unlock | ${fpsSmooth.toFixed(
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
