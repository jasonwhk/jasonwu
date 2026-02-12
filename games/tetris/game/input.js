function bindHoldable(button, onPress, onRepeat = null, initialDelay = 140, repeatEvery = 70) {
  if (!button) return () => {};

  let timeoutId = null;
  let intervalId = null;

  const clearTimers = () => {
    if (timeoutId) clearTimeout(timeoutId);
    if (intervalId) clearInterval(intervalId);
    timeoutId = null;
    intervalId = null;
  };

  const start = (event) => {
    event.preventDefault();
    onPress();
    if (!onRepeat) return;
    timeoutId = setTimeout(() => {
      intervalId = setInterval(onRepeat, repeatEvery);
    }, initialDelay);
  };

  const stop = () => clearTimers();

  button.addEventListener('pointerdown', start);
  button.addEventListener('pointerup', stop);
  button.addEventListener('pointerleave', stop);
  button.addEventListener('pointercancel', stop);

  return () => {
    clearTimers();
    button.removeEventListener('pointerdown', start);
    button.removeEventListener('pointerup', stop);
    button.removeEventListener('pointerleave', stop);
    button.removeEventListener('pointercancel', stop);
  };
}

function setupMobileButtons(game) {
  const controls = [
    bindHoldable(
      document.getElementById('touch-left'),
      () => !game.paused && !game.over && game.move(-1),
      () => !game.paused && !game.over && game.move(-1)
    ),
    bindHoldable(
      document.getElementById('touch-right'),
      () => !game.paused && !game.over && game.move(1),
      () => !game.paused && !game.over && game.move(1)
    ),
    bindHoldable(document.getElementById('touch-rotate-left'), () => !game.paused && !game.over && game.rotate(-1)),
    bindHoldable(document.getElementById('touch-rotate-right'), () => !game.paused && !game.over && game.rotate(1)),
    bindHoldable(
      document.getElementById('touch-soft-drop'),
      () => !game.paused && !game.over && game.softDrop(),
      () => !game.paused && !game.over && game.softDrop(),
      90,
      45
    ),
    bindHoldable(document.getElementById('touch-hard-drop'), () => !game.paused && !game.over && game.hardDrop()),
    bindHoldable(document.getElementById('touch-hold'), () => !game.paused && !game.over && game.hold()),
    bindHoldable(document.getElementById('touch-pause'), () => game.togglePause())
  ];

  return () => controls.forEach((unbind) => unbind());
}

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

  const unbindMobileButtons = setupMobileButtons(game);

  return () => {
    window.removeEventListener('keydown', keyHandler);
    unbindMobileButtons();
  };
}
