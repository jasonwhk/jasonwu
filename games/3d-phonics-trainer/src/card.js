import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { iconDrawers } from './data.js';

export function createCardTextures(card, mode) {
  const frontCanvas = buildCanvas();
  const frontCtx = frontCanvas.getContext('2d');
  drawCardFront(frontCtx, card, mode);

  const backCanvas = buildCanvas();
  const backCtx = backCanvas.getContext('2d');
  drawCardBack(backCtx, card, mode);

  const frontTexture = new THREE.CanvasTexture(frontCanvas);
  const backTexture = new THREE.CanvasTexture(backCanvas);
  frontTexture.needsUpdate = true;
  backTexture.needsUpdate = true;
  return { front: frontTexture, back: backTexture };
}

function buildCanvas() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1536;
  return canvas;
}

function drawCardFront(ctx, card, mode) {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  ctx.fillStyle = '#6c63ff';
  ctx.beginPath();
  ctx.arc(820, 260, 150, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = 'bold 200px Nunito, sans-serif';
  ctx.fillStyle = '#1f1d2b';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const mainText = mode === 'phoneme' ? card.letter : '_'.repeat(card.word.length);
  ctx.fillText(mainText.toUpperCase(), ctx.canvas.width / 2, 420);

  const drawIcon = iconDrawers[card.imageKey];
  if (drawIcon) {
    drawIcon(ctx, 280, 720, 460, 460);
  }
}

function drawCardBack(ctx, card, mode) {
  ctx.fillStyle = '#f9f7ff';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  ctx.font = 'bold 90px Nunito, sans-serif';
  ctx.fillStyle = '#1f1d2b';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Answer:', ctx.canvas.width / 2, 420);

  ctx.font = 'bold 180px Nunito, sans-serif';
  const answer = mode === 'phoneme' ? card.prompt : card.word;
  ctx.fillText(answer.toUpperCase(), ctx.canvas.width / 2, 620);

  ctx.fillStyle = '#6c63ff';
  drawRoundedRect(ctx, ctx.canvas.width / 2 - 160, 980, 320, 140, 60);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 60px Nunito, sans-serif';
  ctx.fillText('Listen', ctx.canvas.width / 2, 1050);
}

function drawRoundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
