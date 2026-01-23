# Milestones — Solar System 3D orbit map

## Milestone 0 — Repo integration scaffold (navigation + route)
- Added `tools/solar-system/` with `index.html`, `main.js`, `style.css` (placeholder canvas + status overlay).
- Linked from `tools/index.html` as “Solar System”.

How to test:
- Open `index.html` (homepage) → click “Tools” → click “Solar System”.
- Confirm the Solar System page loads and shows a dark canvas placeholder with a small overlay panel.
- Confirm there are no console errors.

## Milestone 1 — Three.js scene + touch camera controls
- Replaced the placeholder canvas with a Three.js WebGL scene.
- Added OrbitControls for touch-first rotate/zoom/pan.
- Canvas fills the viewport, clamps devicePixelRatio to 2, and blocks page scrolling while touching the canvas.

How to test:
- Open `/tools/solar-system/index.html`.
- On iPhone: 1-finger rotate, pinch zoom, 2-finger pan; confirm the page doesn’t scroll while interacting with the scene.
- Confirm there are no console errors.
