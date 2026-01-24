# Play with the Wind

A touch-first wind painting toy built with a single canvas and zero dependencies.

## Run locally

Use any static server from this directory:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000/tools/wind-toy/`.

## Deploy (GitHub Pages)

- Ensure `/tools/wind-toy` is published in your Pages source.
- The demo will be available at `https://<user>.github.io/<repo>/tools/wind-toy/`.

## Mobile gestures

Drag to paint wind, tap for a gust, pinch to resize the brush.
Use the More panel to switch to the Obstacles tool and draw walls (hold `E` on desktop to erase).
Toggle Sound in the More panel for subtle ambient audio (volume slider stays low).

When idle for a few seconds, the canvas drifts into a gentle attract mode.
Use the Share button to copy (or share) the current URL.

## Known limitations

- Smoke mode is still lightweight (no full fluid solver), so wispy trails fade quickly.

## Test checklist

- Load the page and confirm the canvas renders without console errors.
- Drag, tap, pinch/wheel, and verify wind responds in Particles and Smoke modes.
- Toggle the Field button to confirm the vector field overlay appears and hides.
- Toggle Quality and confirm particle density and flow resolution change.
- Switch to the Obstacles tool, draw a wall, and confirm flow bends around it.
- Append `?fps=1` (or press `F`) to verify the FPS meter toggles and low-power mode auto-switches when performance dips.
