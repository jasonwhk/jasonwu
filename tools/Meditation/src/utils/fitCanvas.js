export function fitCanvas(canvas) {
  const ratio = window.devicePixelRatio || 1;
  const { innerWidth: width, innerHeight: height } = window;
  canvas.width = Math.floor(width * ratio);
  canvas.height = Math.floor(height * ratio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  return { width: canvas.width, height: canvas.height, ratio };
}
