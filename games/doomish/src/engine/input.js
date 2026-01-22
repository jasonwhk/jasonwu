const PREVENT_SCROLL_KEYS = new Set([
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Space",
]);

export function createInput(canvas, { onPointerLockChange } = {}) {
  const down = new Set();
  const pressedPending = new Set();
  let pressedFrame = new Set();

  let mouseDx = 0;
  let mouseDy = 0;

  function isPointerLocked() {
    return document.pointerLockElement === canvas;
  }

  function handleKeyDown(e) {
    if (PREVENT_SCROLL_KEYS.has(e.code) && (isPointerLocked() || document.activeElement === canvas)) {
      e.preventDefault();
    }
    if (!down.has(e.code)) pressedPending.add(e.code);
    down.add(e.code);
  }

  function handleKeyUp(e) {
    if (PREVENT_SCROLL_KEYS.has(e.code) && (isPointerLocked() || document.activeElement === canvas)) {
      e.preventDefault();
    }
    down.delete(e.code);
  }

  function handleMouseMove(e) {
    if (!isPointerLocked()) return;
    mouseDx += e.movementX || 0;
    mouseDy += e.movementY || 0;
  }

  function handlePointerLockChange() {
    onPointerLockChange?.(isPointerLocked());
  }

  function handleBlur() {
    down.clear();
    pressedPending.clear();
    pressedFrame = new Set();
    mouseDx = 0;
    mouseDy = 0;
  }

  window.addEventListener("keydown", handleKeyDown, { passive: false });
  window.addEventListener("keyup", handleKeyUp, { passive: false });
  window.addEventListener("mousemove", handleMouseMove);
  window.addEventListener("blur", handleBlur);
  document.addEventListener("pointerlockchange", handlePointerLockChange);

  canvas.tabIndex = 0;

  async function requestPointerLock() {
    canvas.focus({ preventScroll: true });
    try {
      await canvas.requestPointerLock();
    } catch {
      // Some browsers throw if not in a user gesture; caller ensures click.
    }
  }

  function beginFrame() {
    pressedFrame = pressedPending;
    pressedPending.clear();
  }

  function consumePressed(code) {
    if (!pressedFrame.has(code)) return false;
    pressedFrame.delete(code);
    return true;
  }

  function consumeMouseDeltaX() {
    const dx = mouseDx;
    mouseDx = 0;
    return dx;
  }

  function consumeMouseDeltaY() {
    const dy = mouseDy;
    mouseDy = 0;
    return dy;
  }

  function isDown(code) {
    return down.has(code);
  }

  function getIntent() {
    const forward = (isDown("KeyW") ? 1 : 0) + (isDown("KeyS") ? -1 : 0);
    const strafe = (isDown("KeyD") ? 1 : 0) + (isDown("KeyA") ? -1 : 0);
    const turn =
      (isDown("ArrowRight") || isDown("KeyE") ? 1 : 0) + (isDown("ArrowLeft") || isDown("KeyQ") ? -1 : 0);
    const sprint = isDown("ShiftLeft") || isDown("ShiftRight");

    return {
      move: forward,
      strafe,
      turn,
      sprint,
      use: isDown("Space"),
      fire: isDown("Mouse0"),
    };
  }

  return {
    beginFrame,
    consumePressed,
    consumeMouseDeltaX,
    consumeMouseDeltaY,
    getIntent,
    isPointerLocked,
    isDown,
    requestPointerLock,
  };
}
