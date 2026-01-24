# Codex Agent Prompt — Particle Flow Page with Multiple Modes

You are an expert frontend engineer focused on premium interactive visuals and mobile performance.

## Goal
Create a fullscreen particle page:
- Particles continuously flow in a smooth field.
- User can switch between multiple interaction “modes”.
- Touch interaction changes particle behavior depending on mode.
- Must be mobile-first and feel polished.

## Constraints
- Pure HTML/CSS/JS, no external libraries.
- Fullscreen <canvas>.
- Correct DPR handling.
- Prevent page scroll/zoom during interaction (touch-action: none).
- Prefer 60fps; degrade gracefully.

## Deliverables
Create/modify:
- index.html
- styles.css
- main.js
Output FULL contents of each file after editing.

## Modes (must implement all)
Represent modes as an enum/string and show a UI selector.

### Mode A: FLOW (default)
- Base motion: particles advected by a smooth pseudo vector field.
- Touch adds mild gravity + swirl (gentle).

### Mode B: GRAVITY WELL
- Touch creates strong gravity well:
  - accel ~ G / (r^2 + softening)
  - plus swirl ~ swirlStrength / (r^2 + softening)
- Clamp speed and use damping.

### Mode C: ORBIT
- Touch causes particles within a radius to “capture” into orbit:
  - Use perpendicular acceleration so particles circle around attractor.
  - Blend-in smoothly (no sudden snapping).
  - Orbit strength decays with distance.

### Mode D: REPEL
- Touch pushes particles away:
  - accel points away from touch, strength ~ R / (r^2 + softening)
  - optional slight swirl for style.

### Mode E: MAGNET LINES
- Touch draws particles into line-like streams:
  - Add attraction toward touch.
  - Add strong velocity alignment: steer particle velocity toward (touch - pos) direction.
  - Add mild noise so it doesn’t look rigid.

### Mode F: FIREWORKS
- On pointerdown: trigger a burst at touch:
  - Spawn N “burst impulses” that apply outward acceleration within a radius.
  - Particles gain a temporary “heat” (float) value used for color/alpha and then cool down.
  - After burst, particles gradually return to base flow.
- Also allow continuous press to trigger small repeated bursts (rate-limited).

## Visual spec
- Dark background with vignette.
- Trails: each frame draw translucent rect (alpha ~0.08–0.14).
- Particles: small points with alpha; subtle color variance.
- Touch indicator: glowing circle. Color can change per mode.

## UX spec
- Add a minimal mode switch UI:
  - A small pill/button bottom-center: shows current mode name.
  - Tapping opens a compact list or carousel of modes.
  - Also support swipe left/right on the pill to cycle modes.
- Add haptics? (No, web only; skip.)
- Add a tiny HUD (top-left) showing fps + particle count (toggle with double tap).

## Performance
- Particle count:
  - Desktop ~6000, mobile ~3000, reduced-motion ~800.
- Adaptive: measure avg frame dt; if >20ms for ~1s, reduce particle count by 10% down to a minimum.
- Use wrap-around edges or respawn; must not allocate per frame.
- Use arrays or typed arrays; avoid object churn.

## Implementation plan
1) index.html
   - Fullscreen canvas.
   - Minimal overlay UI: mode pill, optional dropdown.
2) styles.css
   - Fullscreen, safe-area aware.
   - UI is non-intrusive, touch friendly.
3) main.js
   - Setup canvas DPR resize.
   - Initialize particles.
   - Pointer handling: store attractor, down/up, velocity of pointer (optional).
   - Mode system:
     - One update() function that calls applyField() + applyModeForces(mode)
   - Rendering with trails.
   - UI logic: open/close selector; cycle modes; update text.
   - Reduced motion: detect prefers-reduced-motion and reduce effects.
   - FPS tracker and adaptive particle reduction.

## Acceptance checklist
- Mode selector works on iPhone with touch.
- Each mode feels meaningfully different.
- Touch interaction is smooth, no scroll issues.
- Runs fast; adapts if slow.
- Looks premium.

## IMPORTANT
After implementing, output the FULL contents of each file: index.html, styles.css, main.js.
