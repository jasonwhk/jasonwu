const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const restartBtn = document.getElementById('restart');

const W = canvas.width;
const H = canvas.height;
const GRAVITY = 0.38;
const LIFT = -7.2;
const FORWARD_SPEED = 2.6;
const HOOP_SPACING = 220;
const HOOP_WIDTH = 70;
const HOOP_THICKNESS = 16;
const SHIP_RADIUS = 14;

const bestKey = 'hoop-flight-best';
let best = Number(localStorage.getItem(bestKey) || 0);
bestEl.textContent = String(best);

let ship;
let hoops;
let score;
let over;

function reset() {
  ship = { x: W * 0.28, y: H * 0.5, vy: 0 };
  hoops = [];
  score = 0;
  over = false;
  scoreEl.textContent = '0';

  for (let i = 0; i < 4; i += 1) {
    addHoop(W + 180 + i * HOOP_SPACING);
  }
}

function addHoop(x) {
  const gapY = 140 + Math.random() * (H - 280);
  const gapSize = 150 + Math.random() * 40;
  hoops.push({
    x,
    gapY,
    gapSize,
    passed: false,
  });
}

function flap() {
  if (over) {
    reset();
    return;
  }
  ship.vy = LIFT;
}

function circleVsRect(cx, cy, r, rx, ry, rw, rh) {
  const nearestX = Math.max(rx, Math.min(cx, rx + rw));
  const nearestY = Math.max(ry, Math.min(cy, ry + rh));
  const dx = cx - nearestX;
  const dy = cy - nearestY;
  return dx * dx + dy * dy < r * r;
}

function update() {
  if (over) return;

  ship.vy += GRAVITY;
  ship.y += ship.vy;

  if (ship.y - SHIP_RADIUS < 0 || ship.y + SHIP_RADIUS > H) {
    over = true;
  }

  for (const hoop of hoops) {
    hoop.x -= FORWARD_SPEED;

    const left = hoop.x - HOOP_WIDTH / 2;
    const topOuter = hoop.gapY - hoop.gapSize / 2 - HOOP_THICKNESS;
    const bottomOuter = hoop.gapY + hoop.gapSize / 2;

    const hitsTop = circleVsRect(
      ship.x,
      ship.y,
      SHIP_RADIUS,
      left,
      topOuter,
      HOOP_WIDTH,
      HOOP_THICKNESS,
    );
    const hitsBottom = circleVsRect(
      ship.x,
      ship.y,
      SHIP_RADIUS,
      left,
      bottomOuter,
      HOOP_WIDTH,
      HOOP_THICKNESS,
    );

    if (hitsTop || hitsBottom) {
      over = true;
    }

    if (!hoop.passed && hoop.x + HOOP_WIDTH / 2 < ship.x) {
      hoop.passed = true;
      score += 1;
      scoreEl.textContent = String(score);
      if (score > best) {
        best = score;
        localStorage.setItem(bestKey, String(best));
        bestEl.textContent = String(best);
      }
    }
  }

  if (hoops.length && hoops[0].x < -100) {
    hoops.shift();
    const lastX = hoops[hoops.length - 1].x;
    addHoop(lastX + HOOP_SPACING);
  }
}

function drawBackground() {
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#1a2c55');
  grad.addColorStop(1, '#0b1224');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  for (let i = 0; i < 35; i += 1) {
    const x = (i * 113) % W;
    const y = (i * 211) % H;
    ctx.fillRect(x, y, 2, 2);
  }
}

function drawShip() {
  ctx.save();
  ctx.translate(ship.x, ship.y);
  ctx.rotate(Math.max(-0.6, Math.min(0.6, ship.vy * 0.08)));

  ctx.fillStyle = '#8cf0ff';
  ctx.beginPath();
  ctx.arc(0, 0, SHIP_RADIUS, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(4, -4, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawHoops() {
  for (const hoop of hoops) {
    const x = hoop.x;

    ctx.strokeStyle = '#f7c24a';
    ctx.lineWidth = HOOP_THICKNESS;
    ctx.beginPath();
    ctx.arc(x, hoop.gapY, hoop.gapSize / 2 + 8, 0.15 * Math.PI, 1.85 * Math.PI);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, hoop.gapY, hoop.gapSize / 2 + 8, 0.2 * Math.PI, 1.8 * Math.PI);
    ctx.stroke();
  }
}

function drawOverlay() {
  if (!over) return;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.font = 'bold 38px sans-serif';
  ctx.fillText('Crashed!', W / 2, H * 0.42);
  ctx.font = '20px sans-serif';
  ctx.fillText('Tap / Space to restart', W / 2, H * 0.49);
}

function draw() {
  drawBackground();
  drawHoops();
  drawShip();
  drawOverlay();
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener('keydown', (event) => {
  if (event.code === 'Space') {
    event.preventDefault();
    flap();
  }
});

canvas.addEventListener('pointerdown', flap);
restartBtn.addEventListener('click', reset);

reset();
loop();
