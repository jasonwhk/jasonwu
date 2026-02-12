# Hoop Flight

Hoop Flight is a browser-based arcade flying game built with Three.js.
You pilot a small plane through a sequence of sky hoops as quickly as possible.

## Features

- Quaternion-based flight controls for smooth 3-axis steering.
- Procedural hoop track generated from a Catmull-Rom spline.
- Checkpoint progression with score tracking.
- Timer-based run completion and restart loop.
- Optional invert pitch toggle.
- Optional mouse steering (pointer lock) with clear exit flow.
- Lightweight smoke trail effect for improved motion readability.

## Controls

### Keyboard

- `W` / `S`: Pitch
- `A` / `D`: Roll
- `Q` / `E`: Yaw
- `Shift`: Increase throttle
- `Ctrl`: Decrease throttle
- `R`: Restart run
- `Space`: Respawn at last checkpoint
- `C`: Toggle camera view (chase / first-person)

### Mouse Steering

- Enable **Mouse steer** in the HUD.
- Click the game canvas to enter pointer lock.
- Move mouse to steer pitch/yaw.
- Press `Esc` or `M` to exit mouse mode.

## Run Locally

Because this is a static ES module game, you can run it with a simple static server:

```bash
python3 -m http.server 4173
```

Then open:

- `http://localhost:4173/games/hoop-flight/`

## Project Files

- `index.html` — game shell + UI overlay.
- `style.css` — HUD and screen styling.
- `main.js` — Three.js scene setup, flight logic, hoops, camera, audio, and effects.

## Notes

- Designed for desktop keyboard + mouse.
- No build step, no backend, and GitHub Pages compatible.
