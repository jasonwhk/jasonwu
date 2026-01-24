const TAP_MAX_TIME = 220;
const TAP_MAX_DISTANCE = 16;
const LONG_PRESS_MS = 420;
const LONG_PRESS_MOVE = 12;

export function initGestures(canvas, handlers) {
  const pointers = new Map();
  let pinchDistance = null;
  let twoFingerTap = null;

  function toCanvasPosition(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function registerPointer(event) {
    const pos = toCanvasPosition(event);
    pointers.set(event.pointerId, {
      id: event.pointerId,
      x: pos.x,
      y: pos.y,
      startX: pos.x,
      startY: pos.y,
      time: performance.now(),
      lastTime: performance.now(),
      longPress: false,
      longPressTimer: null,
    });
  }

  function updatePointer(event) {
    const pointer = pointers.get(event.pointerId);
    if (!pointer) {
      return null;
    }
    const now = performance.now();
    const pos = toCanvasPosition(event);
    const dt = Math.max(now - pointer.lastTime, 16);
    const vx = (pos.x - pointer.x) / dt;
    const vy = (pos.y - pointer.y) / dt;
    const moved = Math.hypot(pos.x - pointer.startX, pos.y - pointer.startY);
    if (!pointer.longPress && moved > LONG_PRESS_MOVE) {
      clearTimeout(pointer.longPressTimer);
      pointer.longPressTimer = null;
    }
    pointer.x = pos.x;
    pointer.y = pos.y;
    pointer.lastTime = now;
    return { x: pos.x, y: pos.y, vx, vy, dt, shiftKey: event.shiftKey, altKey: event.altKey, longPress: pointer.longPress };
  }

  function getPrimaryPointer() {
    if (pointers.size === 0) {
      return null;
    }
    return pointers.values().next().value;
  }

  function handlePointerDown(event) {
    event.preventDefault();
    canvas.setPointerCapture(event.pointerId);
    registerPointer(event);

    if (pointers.size === 1) {
      const pointer = getPrimaryPointer();
      pointer.longPressTimer = window.setTimeout(() => {
        pointer.longPress = true;
        handlers.onLongPressStart?.({ x: pointer.x, y: pointer.y });
      }, LONG_PRESS_MS);
      handlers.onStrokeStart?.({ x: pointer.x, y: pointer.y, vx: 0, vy: 0 });
    } else if (pointers.size === 2) {
      pinchDistance = getPinchDistance();
      const points = Array.from(pointers.values()).map((p) => ({
        x: p.x,
        y: p.y,
        startX: p.startX,
        startY: p.startY,
      }));
      twoFingerTap = {
        time: performance.now(),
        points,
        active: true,
      };
    }
  }

  function handlePointerMove(event) {
    event.preventDefault();
    const point = updatePointer(event);
    if (!point) {
      return;
    }

    if (pointers.size === 2) {
      if (twoFingerTap?.active) {
        const movedTooFar = Array.from(pointers.values()).some(
          (pointer) =>
            Math.hypot(pointer.x - pointer.startX, pointer.y - pointer.startY) > TAP_MAX_DISTANCE
        );
        if (movedTooFar) {
          twoFingerTap.active = false;
        } else {
          twoFingerTap.points = Array.from(pointers.values()).map((pointer) => ({
            x: pointer.x,
            y: pointer.y,
          }));
        }
      }
      const nextDistance = getPinchDistance();
      if (pinchDistance !== null && nextDistance !== null) {
        handlers.onPinch?.(nextDistance - pinchDistance);
      }
      pinchDistance = nextDistance;
      return;
    }

    handlers.onStrokeMove?.(point);
  }

  function handlePointerUp(event) {
    event.preventDefault();
    const pointer = pointers.get(event.pointerId);
    if (pointer) {
      clearTimeout(pointer.longPressTimer);
      pointer.longPressTimer = null;
      const elapsed = performance.now() - pointer.time;
      const distance = Math.hypot(pointer.x - pointer.startX, pointer.y - pointer.startY);
      if (elapsed < TAP_MAX_TIME && distance < TAP_MAX_DISTANCE) {
        handlers.onTap?.({ x: pointer.x, y: pointer.y, vx: 0, vy: 0 });
      }
    }
    pointers.delete(event.pointerId);

    if (pointers.size < 2) {
      pinchDistance = null;
    }
    if (pointers.size === 0) {
      if (twoFingerTap?.active) {
        const elapsed = performance.now() - twoFingerTap.time;
        if (elapsed < TAP_MAX_TIME) {
          const points = twoFingerTap.points;
          const x = points.reduce((sum, p) => sum + p.x, 0) / points.length;
          const y = points.reduce((sum, p) => sum + p.y, 0) / points.length;
          handlers.onTwoFingerTap?.({ x, y });
        }
      }
      twoFingerTap = null;
      handlers.onStrokeEnd?.();
    }
  }

  function handleWheel(event) {
    handlers.onWheel?.(event.deltaY);
  }

  function getPinchDistance() {
    if (pointers.size < 2) {
      return null;
    }
    const [first, second] = Array.from(pointers.values());
    return Math.hypot(first.x - second.x, first.y - second.y);
  }

  canvas.addEventListener("pointerdown", handlePointerDown, { passive: false });
  canvas.addEventListener("pointermove", handlePointerMove, { passive: false });
  canvas.addEventListener("pointerup", handlePointerUp, { passive: false });
  canvas.addEventListener("pointercancel", handlePointerUp, { passive: false });
  canvas.addEventListener("wheel", handleWheel, { passive: true });

  window.addEventListener(
    "touchmove",
    (event) => {
      if (pointers.size > 0) {
        event.preventDefault();
      }
    },
    { passive: false }
  );
}
