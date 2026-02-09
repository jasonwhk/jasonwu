const PHONEME_FALLBACK = [
  { id: 's', type: 'phoneme', letter: 's', prompt: '/s/', imageKey: 'sun' },
  { id: 'a', type: 'phoneme', letter: 'a', prompt: '/a/', imageKey: 'apple' },
  { id: 't', type: 'phoneme', letter: 't', prompt: '/t/', imageKey: 'turtle' },
  { id: 'p', type: 'phoneme', letter: 'p', prompt: '/p/', imageKey: 'pear' },
  { id: 'i', type: 'phoneme', letter: 'i', prompt: '/i/', imageKey: 'igloo' },
  { id: 'n', type: 'phoneme', letter: 'n', prompt: '/n/', imageKey: 'nest' },
  { id: 'c', type: 'phoneme', letter: 'c', prompt: '/k/', imageKey: 'cat' },
  { id: 'k', type: 'phoneme', letter: 'k', prompt: '/k/', imageKey: 'kite' },
  { id: 'e', type: 'phoneme', letter: 'e', prompt: '/e/', imageKey: 'egg' },
  { id: 'h', type: 'phoneme', letter: 'h', prompt: '/h/', imageKey: 'hat' },
  { id: 'r', type: 'phoneme', letter: 'r', prompt: '/r/', imageKey: 'rain' },
  { id: 'm', type: 'phoneme', letter: 'm', prompt: '/m/', imageKey: 'moon' },
  { id: 'd', type: 'phoneme', letter: 'd', prompt: '/d/', imageKey: 'dog' },
  { id: 'g', type: 'phoneme', letter: 'g', prompt: '/g/', imageKey: 'gift' },
  { id: 'o', type: 'phoneme', letter: 'o', prompt: '/o/', imageKey: 'octopus' },
];

const WORD_FALLBACK = [
  { id: 'sat', type: 'word', word: 'sat', imageKey: 'sun', phonemes: ['s', 'a', 't'] },
  { id: 'cat', type: 'word', word: 'cat', imageKey: 'cat', phonemes: ['c', 'a', 't'] },
  { id: 'pin', type: 'word', word: 'pin', imageKey: 'pin', phonemes: ['p', 'i', 'n'] },
  { id: 'tap', type: 'word', word: 'tap', imageKey: 'tap', phonemes: ['t', 'a', 'p'] },
  { id: 'nap', type: 'word', word: 'nap', imageKey: 'nest', phonemes: ['n', 'a', 'p'] },
];

let cache = { phonemes: PHONEME_FALLBACK, words: WORD_FALLBACK };

export async function loadCardData() {
  try {
    const [phonemeRes, wordRes] = await Promise.all([
      fetch('./cards/phonemes.json'),
      fetch('./cards/words.json'),
    ]);
    if (phonemeRes.ok && wordRes.ok) {
      const [phonemes, words] = await Promise.all([
        phonemeRes.json(),
        wordRes.json(),
      ]);
      cache = { phonemes, words };
    }
  } catch (error) {
    console.warn('Using fallback card data.', error);
  }
  return cache;
}

loadCardData.getCached = () => cache;

export const iconDrawers = {
  sun: (ctx, x, y, w, h) => {
    ctx.fillStyle = '#f9d96c';
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2, w / 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f4b14b';
    ctx.lineWidth = 12;
    for (let i = 0; i < 8; i += 1) {
      const angle = (Math.PI * 2 * i) / 8;
      ctx.beginPath();
      ctx.moveTo(x + w / 2 + Math.cos(angle) * 120, y + h / 2 + Math.sin(angle) * 120);
      ctx.lineTo(x + w / 2 + Math.cos(angle) * 170, y + h / 2 + Math.sin(angle) * 170);
      ctx.stroke();
    }
  },
  apple: (ctx, x, y, w, h) => {
    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2 + 20, w / 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#5b8c5a';
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y + h / 2 - 140);
    ctx.quadraticCurveTo(x + w / 2 + 40, y + h / 2 - 200, x + w / 2 + 100, y + h / 2 - 160);
    ctx.quadraticCurveTo(x + w / 2 + 40, y + h / 2 - 160, x + w / 2, y + h / 2 - 140);
    ctx.fill();
  },
  turtle: (ctx, x, y, w, h) => {
    ctx.fillStyle = '#88c999';
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2, w / 3, h / 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#5fa877';
    ctx.beginPath();
    ctx.arc(x + w / 2 + w / 3, y + h / 2, w / 8, 0, Math.PI * 2);
    ctx.fill();
  },
  pear: (ctx, x, y, w, h) => {
    ctx.fillStyle = '#ffd86b';
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2 + 20, w / 3, h / 2.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7bbf6a';
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2 - 120, 30, 0, Math.PI * 2);
    ctx.fill();
  },
  igloo: (ctx, x, y, w, h) => {
    ctx.fillStyle = '#9ad2f7';
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2 + 60, w / 3, Math.PI, 0);
    ctx.lineTo(x + w / 2 + w / 3, y + h / 2 + 60);
    ctx.closePath();
    ctx.fill();
  },
  nest: (ctx, x, y, w, h) => {
    ctx.strokeStyle = '#c69c6d';
    ctx.lineWidth = 16;
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2 + 40, w / 3, h / 5, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#f9d3a6';
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2 + 10, 40, 0, Math.PI * 2);
    ctx.fill();
  },
  cat: (ctx, x, y, w, h) => {
    ctx.fillStyle = '#f8c58d';
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2, w / 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f2a65a';
    ctx.beginPath();
    ctx.moveTo(x + w / 2 - 100, y + h / 2 - 140);
    ctx.lineTo(x + w / 2 - 40, y + h / 2 - 40);
    ctx.lineTo(x + w / 2 - 160, y + h / 2 - 40);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + w / 2 + 100, y + h / 2 - 140);
    ctx.lineTo(x + w / 2 + 40, y + h / 2 - 40);
    ctx.lineTo(x + w / 2 + 160, y + h / 2 - 40);
    ctx.closePath();
    ctx.fill();
  },
  kite: (ctx, x, y, w, h) => {
    ctx.fillStyle = '#ff9bb3';
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y + h / 2 - 160);
    ctx.lineTo(x + w / 2 + 140, y + h / 2);
    ctx.lineTo(x + w / 2, y + h / 2 + 160);
    ctx.lineTo(x + w / 2 - 140, y + h / 2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#f78da0';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y + h / 2 + 160);
    ctx.lineTo(x + w / 2 + 120, y + h / 2 + 260);
    ctx.stroke();
  },
  egg: (ctx, x, y, w, h) => {
    ctx.fillStyle = '#fff4c2';
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2, w / 3.4, h / 2.6, 0, 0, Math.PI * 2);
    ctx.fill();
  },
  hat: (ctx, x, y, w, h) => {
    ctx.fillStyle = '#8c6ff4';
    ctx.beginPath();
    ctx.rect(x + w / 2 - 140, y + h / 2 - 40, 280, 120);
    ctx.fill();
    ctx.fillRect(x + w / 2 - 200, y + h / 2 + 60, 400, 40);
  },
  rain: (ctx, x, y, w, h) => {
    ctx.fillStyle = '#9ac7f7';
    ctx.beginPath();
    ctx.arc(x + w / 2 - 60, y + h / 2 - 40, 90, Math.PI, 0);
    ctx.arc(x + w / 2 + 60, y + h / 2 - 40, 90, Math.PI, 0);
    ctx.fill();
    ctx.strokeStyle = '#5ba0e3';
    ctx.lineWidth = 10;
    for (let i = -80; i <= 80; i += 40) {
      ctx.beginPath();
      ctx.moveTo(x + w / 2 + i, y + h / 2 + 20);
      ctx.lineTo(x + w / 2 + i, y + h / 2 + 140);
      ctx.stroke();
    }
  },
  moon: (ctx, x, y, w, h) => {
    ctx.fillStyle = '#f7e6a1';
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2, w / 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f1d77a';
    ctx.beginPath();
    ctx.arc(x + w / 2 + 60, y + h / 2 - 40, w / 4, 0, Math.PI * 2);
    ctx.fill();
  },
  dog: (ctx, x, y, w, h) => {
    ctx.fillStyle = '#b28b67';
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2, w / 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8f6c4f';
    ctx.beginPath();
    ctx.arc(x + w / 2 - 130, y + h / 2 + 20, w / 6, 0, Math.PI * 2);
    ctx.arc(x + w / 2 + 130, y + h / 2 + 20, w / 6, 0, Math.PI * 2);
    ctx.fill();
  },
  gift: (ctx, x, y, w, h) => {
    ctx.fillStyle = '#ff8fa3';
    ctx.fillRect(x + w / 2 - 140, y + h / 2 - 140, 280, 280);
    ctx.fillStyle = '#f76c82';
    ctx.fillRect(x + w / 2 - 20, y + h / 2 - 140, 40, 280);
    ctx.fillStyle = '#f9c4d2';
    ctx.fillRect(x + w / 2 - 140, y + h / 2 - 20, 280, 40);
  },
  octopus: (ctx, x, y, w, h) => {
    ctx.fillStyle = '#9bd0ff';
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2 - 40, w / 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#7bb5ef';
    ctx.lineWidth = 14;
    for (let i = -120; i <= 120; i += 60) {
      ctx.beginPath();
      ctx.moveTo(x + w / 2 + i, y + h / 2 + 40);
      ctx.lineTo(x + w / 2 + i, y + h / 2 + 180);
      ctx.stroke();
    }
  },
  pin: (ctx, x, y, w, h) => {
    ctx.fillStyle = '#ffb4a2';
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2, w / 6, h / 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#7b6cff';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y + h / 2 + 120);
    ctx.lineTo(x + w / 2, y + h / 2 + 240);
    ctx.stroke();
  },
  tap: (ctx, x, y, w, h) => {
    ctx.fillStyle = '#89c4f4';
    ctx.fillRect(x + w / 2 - 120, y + h / 2 - 80, 240, 160);
    ctx.fillStyle = '#6da9dd';
    ctx.fillRect(x + w / 2 - 50, y + h / 2 - 140, 100, 60);
  },
};
