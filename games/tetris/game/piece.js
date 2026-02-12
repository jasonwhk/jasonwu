import { COLS, HIDDEN_ROWS, PIECES, KICKS } from './constants.js';
import { overlaps } from './collision.js';

export class Piece {
  constructor(type) {
    this.type = type;
    this.rotation = 0;
    this.x = 3;
    this.y = -HIDDEN_ROWS;
  }

  get matrix() {
    return PIECES[this.type][this.rotation];
  }

  clone() {
    const p = new Piece(this.type);
    p.rotation = this.rotation;
    p.x = this.x;
    p.y = this.y;
    return p;
  }

  move(dx, dy) {
    this.x += dx;
    this.y += dy;
  }

  rotate(board, dir = 1) {
    if (this.type === 'O') return true;
    const old = this.rotation;
    const next = (old + dir + 4) % 4;
    const key = `${old}>${next}`;
    const kicks = this.type === 'I' ? KICKS.I_KICKS[key] : KICKS.JLSTZ_KICKS[key];
    const nextMatrix = PIECES[this.type][next];

    for (const [dx, dy] of kicks) {
      const nx = this.x + dx;
      const ny = this.y - dy;
      if (!overlaps(board.grid, nextMatrix, nx, ny)) {
        this.x = nx;
        this.y = ny;
        this.rotation = next;
        return true;
      }
    }
    return false;
  }

  hardDropDistance(board) {
    let dist = 0;
    while (!overlaps(board.grid, this.matrix, this.x, this.y + dist + 1)) dist += 1;
    return dist;
  }

  resetSpawn() {
    this.rotation = 0;
    this.x = Math.floor(COLS / 2) - 2;
    this.y = -HIDDEN_ROWS;
  }
}
