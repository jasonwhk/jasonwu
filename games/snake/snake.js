const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const overlay = document.getElementById("overlay");
const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const statusEl = document.getElementById("status");
const speedLabel = document.getElementById("speed-label");
const startBtn = document.getElementById("start-btn");
const pauseBtn = document.getElementById("pause-btn");
const restartBtn = document.getElementById("restart-btn");
const speedSelect = document.getElementById("speed-select");
const canvasShell = document.getElementById("canvas-shell");

const GRID_SIZE = 20;
const SPEED_PRESETS = {
  slow: { label: "Slow", interval: 190 },
  normal: { label: "Normal", interval: 130 },
  fast: { label: "Fast", interval: 90 }
};

let dpr = window.devicePixelRatio || 1;
let cellSize = 20;
let boardSize = GRID_SIZE * cellSize;
let bestScore = Number.parseInt(localStorage.getItem("snake-best") || "0", 10);
let speedKey = localStorage.getItem("snake-speed") || "normal";
if (!SPEED_PRESETS[speedKey]) {
  speedKey = "normal";
}

const state = {
  status: "idle",
  snake: [],
  direction: { x: 1, y: 0 },
  pendingDirection: null,
  food: null,
  score: 0,
  lastTime: 0,
  accumulator: 0
};

const swipeState = {
  active: false,
  startX: 0,
  startY: 0
};

function resizeCanvas() {
  const padding = 24;
  const available = Math.min(window.innerWidth - padding, 520);
  cellSize = Math.floor(available / GRID_SIZE);
  boardSize = cellSize * GRID_SIZE;
  dpr = window.devicePixelRatio || 1;

  canvas.style.width = `${boardSize}px`;
  canvas.style.height = `${boardSize}px`;
  canvas.width = boardSize * dpr;
  canvas.height = boardSize * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  render();
}

function getInitialSnake() {
  const startX = Math.floor(GRID_SIZE / 2) - 1;
  const startY = Math.floor(GRID_SIZE / 2);
  return [
    { x: startX, y: startY },
    { x: startX - 1, y: startY },
    { x: startX - 2, y: startY }
  ];
}

function setStatus(text) {
  statusEl.textContent = text;
}

function updateHUD() {
  scoreEl.textContent = state.score;
  bestEl.textContent = bestScore;
  speedLabel.textContent = SPEED_PRESETS[speedKey].label;
}

function updateOverlay(message) {
  overlay.textContent = message || "";
}

function resetGame() {
  state.snake = getInitialSnake();
  state.direction = { x: 1, y: 0 };
  state.pendingDirection = null;
  state.food = null;
  state.score = 0;
  state.accumulator = 0;
  updateHUD();
  spawnFood();
  render();
}

function startGame({ fresh = false } = {}) {
  if (fresh) {
    resetGame();
  }
  state.status = "running";
  setStatus("Running");
  updateOverlay("");
  pauseBtn.textContent = "Pause";
}

function pauseGame() {
  if (state.status !== "running") {
    return;
  }
  state.status = "paused";
  setStatus("Paused");
  updateOverlay("Paused");
  pauseBtn.textContent = "Resume";
}

function resumeGame() {
  if (state.status !== "paused") {
    return;
  }
  state.status = "running";
  setStatus("Running");
  updateOverlay("");
  pauseBtn.textContent = "Pause";
}

function endGame(message) {
  state.status = message === "You win!" ? "win" : "gameover";
  setStatus(state.status === "win" ? "You Win" : "Game Over");
  updateOverlay(message);
  pauseBtn.textContent = "Pause";
}

function setBestScore() {
  if (state.score > bestScore) {
    bestScore = state.score;
    localStorage.setItem("snake-best", String(bestScore));
  }
}

function spawnFood() {
  const emptyCells = [];
  for (let y = 0; y < GRID_SIZE; y += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      const occupied = state.snake.some((segment) => segment.x === x && segment.y === y);
      if (!occupied) {
        emptyCells.push({ x, y });
      }
    }
  }

  if (emptyCells.length === 0) {
    endGame("You win!");
    return;
  }

  const choice = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  state.food = choice;
}

function requestDirection(next) {
  if (state.status === "gameover" || state.status === "win") {
    return;
  }

  const current = state.pendingDirection || state.direction;
  const isReverse = current.x + next.x === 0 && current.y + next.y === 0;
  if (isReverse) {
    return;
  }

  if (state.pendingDirection) {
    return;
  }

  state.pendingDirection = next;
}

function step() {
  if (state.pendingDirection) {
    state.direction = state.pendingDirection;
    state.pendingDirection = null;
  }

  const head = state.snake[0];
  const newHead = { x: head.x + state.direction.x, y: head.y + state.direction.y };

  if (
    newHead.x < 0 ||
    newHead.x >= GRID_SIZE ||
    newHead.y < 0 ||
    newHead.y >= GRID_SIZE
  ) {
    endGame("Wall hit!");
    return;
  }

  const willGrow = state.food && newHead.x === state.food.x && newHead.y === state.food.y;
  const bodyToCheck = state.snake.slice(0, state.snake.length - (willGrow ? 0 : 1));
  if (bodyToCheck.some((segment) => segment.x === newHead.x && segment.y === newHead.y)) {
    endGame("Self collision!");
    return;
  }

  state.snake.unshift(newHead);
  if (!willGrow) {
    state.snake.pop();
  }

  if (willGrow) {
    state.score += 1;
    setBestScore();
    updateHUD();
    spawnFood();
  }

  render();
}

function loop(timestamp) {
  if (!state.lastTime) {
    state.lastTime = timestamp;
  }

  const delta = timestamp - state.lastTime;
  state.lastTime = timestamp;

  if (state.status === "running") {
    state.accumulator += delta;
    const interval = SPEED_PRESETS[speedKey].interval;

    while (state.accumulator >= interval) {
      step();
      state.accumulator -= interval;
      if (state.status !== "running") {
        state.accumulator = 0;
        break;
      }
    }
  }

  requestAnimationFrame(loop);
}

function drawRoundedRect(x, y, size, radius) {
  const r = Math.min(radius, size / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + size, y, x + size, y + size, r);
  ctx.arcTo(x + size, y + size, x, y + size, r);
  ctx.arcTo(x, y + size, x, y, r);
  ctx.arcTo(x, y, x + size, y, r);
  ctx.closePath();
  ctx.fill();
}

function renderGrid() {
  ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= GRID_SIZE; i += 1) {
    const pos = i * cellSize + 0.5;
    ctx.beginPath();
    ctx.moveTo(pos, 0);
    ctx.lineTo(pos, boardSize);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, pos);
    ctx.lineTo(boardSize, pos);
    ctx.stroke();
  }
}

function render() {
  ctx.clearRect(0, 0, boardSize, boardSize);
  ctx.fillStyle = "#0d1220";
  ctx.fillRect(0, 0, boardSize, boardSize);
  renderGrid();

  if (state.food) {
    ctx.fillStyle = "#ff9d4d";
    const centerX = state.food.x * cellSize + cellSize / 2;
    const centerY = state.food.y * cellSize + cellSize / 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, cellSize * 0.32, 0, Math.PI * 2);
    ctx.fill();
  }

  state.snake.forEach((segment, index) => {
    const x = segment.x * cellSize;
    const y = segment.y * cellSize;
    ctx.fillStyle = index === 0 ? "#6cf0c2" : "#3ddfa0";
    drawRoundedRect(x + 2, y + 2, cellSize - 4, 6);
  });
}

function setSpeed(nextSpeed) {
  speedKey = nextSpeed;
  localStorage.setItem("snake-speed", speedKey);
  updateHUD();
}

function handleKeydown(event) {
  const key = event.key.toLowerCase();
  const arrowKeys = ["arrowup", "arrowdown", "arrowleft", "arrowright", " "];
  if ((state.status === "running" || state.status === "paused") && arrowKeys.includes(key)) {
    event.preventDefault();
  }

  switch (key) {
    case "arrowup":
    case "w":
      requestDirection({ x: 0, y: -1 });
      break;
    case "arrowdown":
    case "s":
      requestDirection({ x: 0, y: 1 });
      break;
    case "arrowleft":
    case "a":
      requestDirection({ x: -1, y: 0 });
      break;
    case "arrowright":
    case "d":
      requestDirection({ x: 1, y: 0 });
      break;
    case " ":
      if (state.status === "running") {
        pauseGame();
      } else if (state.status === "paused") {
        resumeGame();
      }
      break;
    case "r":
      resetGame();
      startGame();
      break;
    default:
      break;
  }
}

function handlePointerDown(event) {
  event.preventDefault();
}

function handlePadPress(event) {
  event.preventDefault();
  const dir = event.currentTarget.dataset.dir;
  if (!dir) {
    return;
  }
  if (dir === "up") {
    requestDirection({ x: 0, y: -1 });
  } else if (dir === "down") {
    requestDirection({ x: 0, y: 1 });
  } else if (dir === "left") {
    requestDirection({ x: -1, y: 0 });
  } else if (dir === "right") {
    requestDirection({ x: 1, y: 0 });
  }
}

function handleSwipeStart(event) {
  event.preventDefault();
  swipeState.active = true;
  swipeState.startX = event.clientX;
  swipeState.startY = event.clientY;
}

function handleSwipeEnd(event) {
  if (!swipeState.active) {
    return;
  }
  swipeState.active = false;
  const deltaX = event.clientX - swipeState.startX;
  const deltaY = event.clientY - swipeState.startY;
  const distance = Math.hypot(deltaX, deltaY);
  if (distance < 30) {
    return;
  }

  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    requestDirection({ x: deltaX > 0 ? 1 : -1, y: 0 });
  } else {
    requestDirection({ x: 0, y: deltaY > 0 ? 1 : -1 });
  }
}

function handleSwipeMove(event) {
  if (swipeState.active) {
    event.preventDefault();
  }
}

startBtn.addEventListener("click", () => {
  if (state.status === "paused") {
    resumeGame();
    return;
  }
  startGame({ fresh: state.status !== "running" });
});

pauseBtn.addEventListener("click", () => {
  if (state.status === "running") {
    pauseGame();
  } else if (state.status === "paused") {
    resumeGame();
  }
});

restartBtn.addEventListener("click", () => {
  resetGame();
  startGame();
});

speedSelect.addEventListener("change", (event) => {
  setSpeed(event.target.value);
});

speedSelect.value = speedKey;

canvasShell.addEventListener("pointerdown", handleSwipeStart);
canvasShell.addEventListener("pointermove", handleSwipeMove);
canvasShell.addEventListener("pointerup", handleSwipeEnd);
canvasShell.addEventListener("pointercancel", () => {
  swipeState.active = false;
});

canvasShell.addEventListener("touchstart", handlePointerDown, { passive: false });

document.querySelectorAll(".pad").forEach((button) => {
  button.addEventListener("pointerdown", handlePadPress);
  button.addEventListener("touchstart", handlePadPress, { passive: false });
});

document.addEventListener("keydown", handleKeydown);
window.addEventListener("resize", resizeCanvas);

updateHUD();
resetGame();
setStatus("Idle");
updateOverlay("Press Start or tap a direction");
resizeCanvas();
requestAnimationFrame(loop);
