export function overlaps(board, matrix, x, y) {
  for (let row = 0; row < matrix.length; row += 1) {
    for (let col = 0; col < matrix[row].length; col += 1) {
      if (!matrix[row][col]) continue;
      const boardX = x + col;
      const boardY = y + row;
      if (boardX < 0 || boardX >= board[0].length || boardY >= board.length) return true;
      if (boardY >= 0 && board[boardY][boardX]) return true;
    }
  }
  return false;
}
