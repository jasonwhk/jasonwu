export const RAINBOW = [
  '#ff6b6b',
  '#ff9f43',
  '#feca57',
  '#1dd1a1',
  '#54a0ff',
  '#5f27cd',
  '#c56cf0',
];

export function getRainbowColor(index) {
  return RAINBOW[index % RAINBOW.length];
}
