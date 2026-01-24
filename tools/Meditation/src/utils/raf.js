export function createLoop(callback) {
  let last = performance.now();
  let frameId;

  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    callback(dt);
    frameId = requestAnimationFrame(tick);
  }

  return {
    start() {
      last = performance.now();
      frameId = requestAnimationFrame(tick);
    },
    stop() {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
    },
  };
}
