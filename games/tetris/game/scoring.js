import { BASE_DROP_MS } from './constants.js';

export function dropIntervalForLevel(level) {
  return Math.max(100, BASE_DROP_MS - (level - 1) * 70);
}

export function levelFromLines(lines) {
  return Math.floor(lines / 10) + 1;
}
