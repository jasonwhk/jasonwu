# Snake

A classic Snake game built with plain HTML, CSS, and JavaScript. It is designed to be touch-first while still offering solid keyboard controls on desktop.

## Run locally

Because it is a static project, you can open `index.html` directly in a browser or serve the folder with a simple HTTP server:

```bash
cd /workspace/jasonwu
python -m http.server 8000
```

Then visit: `http://localhost:8000/games/snake/`.

## Controls

**Keyboard**
- Arrow keys / WASD: Move
- Space: Pause / Resume
- R: Restart

**Touch**
- Tap the on-screen D-pad
- Swipe on the board to change direction

## Settings

- Speed: Choose Slow / Normal / Fast in the speed selector. The choice is saved locally.
- Grid size: Set to 20x20 (fixed for consistent gameplay).

## Features

- Deterministic tick loop for consistent movement
- Growth and scoring with best score saved in local storage
- Collision detection and game over / win states
- Touch-friendly D-pad and swipe gestures
- Crisp, pixel-aligned rendering
