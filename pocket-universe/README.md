# Pocket Universe Lab

Path: `/pocket-universe/` (GitHub Pages static).

## Run
- Open `https://jasonwu.de/pocket-universe/` after deploy.
- Local: `python3 -m http.server` then visit `/pocket-universe/`.

## Features
- Three.js WebGLRenderer particle universe with quality tiers.
- Modes: Galaxy, Gravity Well, Solar Playground, Black Hole, Starfield Flight.
- Mobile sensors (orientation + shake), iOS permission flow, calibration.
- Touch: tap pulse, long-press attractor, drag fallback nudge.
- Adaptive quality via FPS monitoring.
- localStorage persistence: mode, quality, calibration, FPS toggle, tutorial, best black-hole score.
- Tutorial and desktop key shortcuts.

## Compatibility
- iOS Safari: permission required after Start tap.
- Android Chrome: sensors generally available by default.
- Desktop: full fallback via pointer + keyboard.
- No WebGL: friendly unsupported overlay.

## Add a new mode
1. Add mode metadata in `modes.js`.
2. Extend force logic in `Universe.update()`.
3. Add UI copy/status in `app.js` if needed.

## Manual test checklist
- Desktop Chrome/Edge modes + keyboard.
- Android Chrome tilt/touch/shake.
- iPhone Safari permission prompt + calibration.
- Denied sensor permission fallback behavior.
- Portrait + landscape layouts.
- localStorage persistence after refresh.
- Simulate WebGL off (expect fallback message).
- GitHub Pages static path load.

## Known limitations
- Shake thresholds vary by device.
- No post-processing bloom yet.
- Solar mode is stylized particle interpretation, not ephemeris-accurate.
