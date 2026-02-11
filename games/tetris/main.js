import { Bag } from './game/bag.js';
import { Board } from './game/board.js';
import { overlaps } from './game/collision.js';
import { COLS, HIDDEN_ROWS, PIECE_COLORS, ROWS_VISIBLE } from './game/constants.js';
import { setupInput } from './game/input.js';
import { Piece } from './game/piece.js';
import { dropIntervalForLevel, levelFromLines } from './game/scoring.js';

const CELL = 30;
const THEME_KEY = 'tetris-theme';
const HIGH_SCORE_KEY = 'tetris-high-score';

class Game {
  constructor() {
    this.canvas = document.getElementById('game');
    this.ctx = this.canvas.getContext('2d');
    this.holdCanvas = document.getElementById('hold');
    this.holdCtx = this.holdCanvas.getContext('2d');
    this.nextCanvas = document.getElementById('next');
    this.nextCtx = this.nextCanvas.getContext('2d');
    this.overlay = document.getElementById('overlay');
    this.overlayTitle = document.getElementById('overlay-title');

    this.scoreEl = document.getElementById('score');
    this.levelEl = document.getElementById('level');
    this.linesEl = document.getElementById('lines');
    this.highScoreEl = document.getElementById('high-score');

    this.board = new Board();
    this.bag = new Bag();
    this.theme = localStorage.getItem(THEME_KEY) || 'classic';
    localStorage.setItem(THEME_KEY, this.theme);

    this.highScore = Number(localStorage.getItem(HIGH_SCORE_KEY) || 0);
    this.dropCounter = 0;
    this.lastTime = 0;
    this.flashRows = [];
    this.flashTimer = 0;

    this.restart();
    this.unbind = setupInput(this, this.canvas);
    document.getElementById('restart-btn').addEventListener('click', () => this.restart());
    requestAnimationFrame((time) => this.loop(time));
  }

  restart() {
    this.board.reset();
    this.bag = new Bag();
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.paused = false;
    this.over = false;
    this.holdType = null;
    this.canHold = true;
    this.current = this.spawn(this.bag.next());
    this.dropCounter = 0;
    this.overlay.classList.add('hidden');
    this.renderHUD();
  }

  spawn(type) {
    const piece = new Piece(type);
    piece.resetSpawn();
    if (overlaps(this.board.grid, piece.matrix, piece.x, piece.y)) {
      this.gameOver();
    }
    return piece;
  }

  move(dir) {
    if (!overlaps(this.board.grid, this.current.matrix, this.current.x + dir, this.current.y)) {
      this.current.move(dir, 0);
    }
  }

  rotate(dir) {
    this.current.rotate(this.board, dir);
  }

  softDrop() {
    if (this.stepDown()) this.score += 1;
    this.renderHUD();
  }

  hardDrop() {
    const dist = this.current.hardDropDistance(this.board);
    this.current.move(0, dist);
    this.score += dist * 2;
    this.lockCurrent();
    this.renderHUD();
  }

  hold() {
    if (!this.canHold) return;
    const currentType = this.current.type;
    if (!this.holdType) {
      this.holdType = currentType;
      this.current = this.spawn(this.bag.next());
    } else {
      this.current = this.spawn(this.holdType);
      this.holdType = currentType;
    }
    this.canHold = false;
  }

  togglePause() {
    if (this.over) return;
    this.paused = !this.paused;
    if (this.paused) {
      this.overlayTitle.textContent = 'Paused';
      this.overlay.classList.remove('hidden');
    } else {
      this.overlay.classList.add('hidden');
      this.overlayTitle.textContent = 'Game Over';
    }
  }

  stepDown() {
    if (!overlaps(this.board.grid, this.current.matrix, this.current.x, this.current.y + 1)) {
      this.current.move(0, 1);
      return true;
    }
    this.lockCurrent();
    return false;
  }

  lockCurrent() {
    this.board.lock(this.current);
    this.canHold = true;

    const fullRows = [];
    this.board.grid.forEach((row, idx) => {
      if (row.every((cell) => cell !== null)) fullRows.push(idx);
    });

    if (fullRows.length) {
      this.flashRows = fullRows;
      this.flashTimer = 100;
      const { lines, points } = this.board.clearLines(this.level);
      this.lines += lines;
      this.score += points;
      this.level = levelFromLines(this.lines);
    }

    this.current = this.spawn(this.bag.next());
    this.renderHUD();
  }

  gameOver() {
    this.over = true;
    this.overlayTitle.textContent = 'Game Over';
    this.overlay.classList.remove('hidden');
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem(HIGH_SCORE_KEY, String(this.highScore));
    }
    this.renderHUD();
  }

  renderHUD() {
    this.scoreEl.textContent = String(this.score);
    this.levelEl.textContent = String(this.level);
    this.linesEl.textContent = String(this.lines);
    this.highScoreEl.textContent = String(this.highScore);
  }

  loop(now) {
    const dt = now - this.lastTime;
    this.lastTime = now;

    if (!this.paused && !this.over) {
      this.dropCounter += dt;
      const interval = dropIntervalForLevel(this.level);
      if (this.dropCounter >= interval) {
        this.stepDown();
        this.dropCounter = 0;
      }
    }

    if (this.flashTimer > 0) this.flashTimer -= dt;

    this.draw();
    requestAnimationFrame((time) => this.loop(time));
  }

  drawCell(ctx, x, y, color, size = CELL) {
    ctx.fillStyle = color;
    ctx.fillRect(x * size, y * size, size, size);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.strokeRect(x * size + 0.5, y * size + 0.5, size - 1, size - 1);
  }

  drawPiece(ctx, piece, colorOverride = null) {
    piece.matrix.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (!cell) return;
        const y = piece.y + r - HIDDEN_ROWS;
        if (y < 0) return;
        this.drawCell(ctx, piece.x + c, y, colorOverride || PIECE_COLORS[piece.type]);
      });
    });
  }

  drawMini(ctx, type, offsetY = 0, size = 24) {
    if (!type) return;
    const temp = new Piece(type);
    temp.resetSpawn();
    const matrix = temp.matrix;
    const width = matrix[0].length;
    const xStart = Math.floor((ctx.canvas.width / size - width) / 2);
    matrix.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell) {
          ctx.fillStyle = PIECE_COLORS[type];
          ctx.fillRect((xStart + c) * size, offsetY + r * size, size - 2, size - 2);
        }
      });
    });
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.shadowBlur = 8;
    this.ctx.shadowColor = 'rgba(255,255,255,0.2)';

    for (let y = HIDDEN_ROWS; y < this.board.grid.length; y += 1) {
      for (let x = 0; x < COLS; x += 1) {
        const type = this.board.grid[y][x];
        if (type) {
          const isFlashing = this.flashTimer > 0 && this.flashRows.includes(y);
          this.drawCell(this.ctx, x, y - HIDDEN_ROWS, isFlashing ? '#fff' : PIECE_COLORS[type]);
        } else {
          this.ctx.strokeStyle = 'rgba(255,255,255,0.05)';
          this.ctx.strokeRect(x * CELL + 0.5, (y - HIDDEN_ROWS) * CELL + 0.5, CELL - 1, CELL - 1);
        }
      }
    }

    const ghost = this.current.clone();
    ghost.move(0, ghost.hardDropDistance(this.board));
    this.drawPiece(this.ctx, ghost, PIECE_COLORS.ghost);
    this.drawPiece(this.ctx, this.current);

    this.holdCtx.clearRect(0, 0, this.holdCanvas.width, this.holdCanvas.height);
    this.nextCtx.clearRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);

    this.drawMini(this.holdCtx, this.holdType, 24);
    this.bag.peek(3).forEach((type, idx) => this.drawMini(this.nextCtx, type, idx * 95 + 8, 24));
  }
}

new Game();
