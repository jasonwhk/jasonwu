export function setupInput(game, canvas) {
  const keyHandler = (e) => {
    if (e.repeat) return;
    if (e.code === 'KeyP') {
      game.togglePause();
      return;
    }
    if (game.paused || game.over) return;

    switch (e.code) {
      case 'KeyA': game.move(-1); break;
      case 'KeyD': game.move(1); break;
      case 'ArrowDown': game.softDrop(); break;
      case 'ArrowLeft': game.rotate(-1); break;
      case 'ArrowRight': game.rotate(1); break;
      case 'KeyZ': game.rotate(-1); break;
      case 'Space': game.hardDrop(); break;
      case 'KeyC': game.hold(); break;
      default: return;
    }
    e.preventDefault();
  };

  window.addEventListener('keydown', keyHandler, { passive: false });

  let touchStart = null;
  let pressTimer = null;

  canvas.addEventListener('touchstart', (e) => {
    const touch = e.changedTouches[0];
    const rect = canvas.getBoundingClientRect();
    touchStart = { x: touch.clientX - rect.left, y: touch.clientY - rect.top, ts: performance.now() };
    pressTimer = setTimeout(() => game.hold(), 350);
  }, { passive: true });

  canvas.addEventListener('touchend', (e) => {
    if (!touchStart || game.paused || game.over) return;
    clearTimeout(pressTimer);
    const touch = e.changedTouches[0];
    const rect = canvas.getBoundingClientRect();
    const endX = touch.clientX - rect.left;
    const endY = touch.clientY - rect.top;
    const dx = endX - touchStart.x;
    const dy = endY - touchStart.y;
    const duration = performance.now() - touchStart.ts;

    if (dy > 40) game.hardDrop();
    else if (Math.abs(dx) > 24) game.move(dx < 0 ? -1 : 1);
    else if (duration < 300) game.rotate(1);

    touchStart = null;
  }, { passive: true });

  return () => window.removeEventListener('keydown', keyHandler);
}
