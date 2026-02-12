import { COLS, ROWS_TOTAL, SCORE_TABLE } from './constants.js';

export class Board {
  constructor() {
    this.grid = this.createGrid();
  }

  createGrid() {
    return Array.from({ length: ROWS_TOTAL }, () => Array(COLS).fill(null));
  }

  reset() {
    this.grid = this.createGrid();
  }

  lock(piece) {
    const { matrix, x, y, type } = piece;
    matrix.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (!cell) return;
        const py = y + r;
        if (py >= 0) this.grid[py][x + c] = type;
      });
    });
  }

  clearLines(level) {
    const kept = this.grid.filter((row) => row.some((cell) => cell === null));
    const cleared = ROWS_TOTAL - kept.length;
    while (kept.length < ROWS_TOTAL) kept.unshift(Array(COLS).fill(null));
    this.grid = kept;
    return {
      lines: cleared,
      points: SCORE_TABLE[cleared] ? SCORE_TABLE[cleared] * level : 0
    };
  }
}
