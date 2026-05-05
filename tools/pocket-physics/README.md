# Pocket WebGPU Physics Lab

A mobile-first static physics lab for GitHub Pages.

## Location
- Feature path: `/tools/pocket-physics/`
- Entry: `tools/pocket-physics/index.html`

## Run locally
- Any static server works, e.g. `python3 -m http.server` from repo root and open `/tools/pocket-physics/`.

## Renderer behavior
- Tries WebGPU first (`navigator.gpu` + adapter/device/context).
- If unavailable or init fails, falls back to Canvas2D.
- UI badge always shows the active path.

## Sensors and permissions
- Requests iOS-style motion/orientation permission where required.
- Uses filtered orientation for gravity.
- Shake detection injects burst energy with cooldown.
- If sensor access is unavailable, touch/mouse can directly influence gravity/fields.

## Browser compatibility
- Chrome/Edge Android: best experience (WebGPU + sensors where available).
- Safari iOS: Canvas fallback, sensor permission flow supported.
- Desktop browsers: mouse + keyboard fallbacks, no required sensors.

## Add a new mode
1. Add mode key/help text in `modes.js`.
2. Update mode selector in `index.html`.
3. Implement behavior in `physics.js` and optionally renderer overlays.

## Known limitations
- WebGPU path currently composites a GPU background pass plus Canvas particle FX.
- No full GPU compute particle pipeline yet.

## Manual test checklist
- [ ] Desktop Chrome/Edge mode switching + keyboard shortcuts.
- [ ] Android Chrome/Edge tilt + shake + touch.
- [ ] iPhone Safari permission request + fallback behavior.
- [ ] WebGPU unavailable still renders Canvas.
- [ ] Sensors unavailable still controllable via touch/mouse.
- [ ] localStorage persists mode, quality, overlay, calibration, best stability.
- [ ] Responsive layout on narrow phones.
- [ ] GitHub Pages static deploy works over HTTPS.
