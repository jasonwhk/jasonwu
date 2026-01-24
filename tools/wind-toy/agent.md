# agent.md — Play with the Wind (Touch Wind Physics Toy)

Goal
- Build a single-page, client-side “wind painting” physics toy for mobile + desktop.
- User drags to create wind; particles (and optional smoke/field viz) flow realistically at 60 FPS.
- Ship as a static site (GitHub Pages / Vercel), zero backend.

Non-goals (v1)
- No heavy UI, no accounts, no saving to server.
- No external dependencies required (keep it lightweight). If you add one, justify it.

Core UX (must feel great)
- Touch-first on iPhone: drag = wind, tap = gust burst, two-finger pinch = change brush size.
- Desktop: mouse drag works; wheel adjusts brush size.
- One “Reset” button, one “Mode” toggle (Particles / Smoke optional), one “Quality” toggle (Low/High).
- Prevent page scrolling while interacting with canvas.

Success criteria
- Looks delightful within 3 seconds of opening.
- Stable 60 FPS on modern iPhone for default “Particles” mode.
- No obvious stutter, no runaway memory, no particles disappearing due to NaNs.
- Resets instantly; simulation never “explodes”.

Tech constraints
- Pure client-side: HTML + CSS + JS (ES Modules).
- Use <canvas> 2D for v1 (fast enough). Optionally add WebGL later.
- Deterministic update loop with fixed dt stepping for physics stability.

Repo layout
- /tools/wind-toy/
  - index.html
  - styles.css
  - src/
    - main.js
    - sim/
      - field.js
      - particles.js
      - advect.js
      - utils.js
    - ui/
      - controls.js
      - gestures.js
  - assets/ (optional)
  - README.md

Milestones

Milestone 0 — Scaffold + Canvas + Touch Gestures (Foundation)
Deliverables
- index.html with full-screen canvas and minimal controls overlay.
- Pointer/touch gesture layer:
  - Single pointer drag produces a “stroke” (position, velocity).
  - Tap creates a short “gust burst”.
  - Two-finger pinch adjusts brush radius.
- Prevent scroll/zoom while interacting.
Acceptance checklist
- Works on iPhone Safari + desktop Chrome.
- Visual feedback for brush radius (subtle ring).
- No console errors.

Milestone 1 — Vector Field Grid + Wind Injection
Concept
- Maintain a 2D vector field grid (u,v) over the canvas:
  - Grid size: e.g. 96x54 (scaled by device) as default.
- On drag, inject velocity into nearby cells (Gaussian falloff).
- Add damping to field each frame (so wind fades).
Deliverables
- field.js storing u,v arrays (Float32Array).
- Injection function: addVelocity(x,y,vx,vy,radius,strength).
- Debug view: optional arrows or colored flow lines toggle.
Acceptance checklist
- Drag creates wind that persists briefly then decays.
- No performance issues; field arrays reused (no per-frame allocations).

Milestone 2 — Particle Advection + Rendering
Concept
- Spawn N particles (e.g. 10k–40k depending on quality).
- Each particle samples the vector field and moves accordingly:
  - v = sampleField(x,y)
  - x += v.x * dt; y += v.y * dt
- Add mild noise and drag; wrap-around edges (or respawn).
- Render as trails for beauty:
  - Draw with low alpha each frame, fade using translucent fill.
Deliverables
- particles.js with particle buffers (x,y).
- Bilinear sampling of field for smooth motion.
- Quality toggle adjusts particle count and grid resolution.
Acceptance checklist
- “Magical” flowing look, responsive to finger.
- 60 FPS on typical hardware; no particle jitter/teleporting unless intended.
- Reset clears particles + field.

Milestone 3 — Optional “Smoke” Mode (Lightweight Fluid-ish Look)
Concept
- Keep it simple: render a density field (scalar) as smoke.
- Density injected along the brush stroke.
- Advect density by the same vector field (Semi-Lagrangian):
  - For each cell: trace backward using velocity and sample previous density.
Deliverables
- advect.js implementing semi-lagrangian advection for scalar field.
- Toggle: Particles vs Smoke.
- Basic colormap/alpha mapping for smoke (keep subtle).
Acceptance checklist
- Smoke curls convincingly with wind strokes.
- No major artifacts; stable over time.

Milestone 4 — Polish + Mobile Feel
Deliverables
- Haptics (if available) on gust burst (very light).
- Idle attract mode: gentle ambient wind when user hasn’t touched for 5s.
- “Share” hint: copy URL button optional.
- Accessibility: buttons have labels, decent contrast.
Acceptance checklist
- Feels like a finished toy you’d show your kids.
- Works in portrait + landscape; handles resize/orientation smoothly.

Milestone 5 — Performance Hardening + QA
Deliverables
- Add a tiny FPS meter (dev-only toggle).
- Ensure no per-frame allocations in hot loops.
- Add “Low Power” mode auto-trigger when FPS drops below threshold.
- Basic test checklist in README.md.
Acceptance checklist
- Stable in long run (5+ minutes) without memory growth.
- No NaNs; no stuck particles; clean reset.

Implementation notes (recommended defaults)
- Use requestAnimationFrame loop.
- Use fixed timestep for simulation (e.g. 1/60), accumulate time:
  - while (accum >= dt) step(dt), accum -= dt
- Sampling:
  - Convert screen coords to grid coords: gx = x / width * (gw-1)
  - Bilinear sample u,v arrays.
- Wind injection:
  - Track last pointer position/time to get velocity.
  - Clamp velocity magnitude to avoid instability.
- Trails:
  - Each frame draw a translucent black/white overlay with low alpha to fade.
  - Then draw particles as points/short segments.

UI specs
- Buttons: Reset, Mode, Quality
- Slider (optional): “Wind strength” (hidden behind a gear icon)
- Minimal overlay top-right; keep canvas full-screen.

Edge cases
- Multi-touch: ignore additional pointers except pinch gesture.
- Resizing: rebuild field + particles proportionally; avoid reloading page.
- High DPR: render canvas at devicePixelRatio, but cap DPR to 2 for performance.

README checklist (must include)
- How to run locally (static server).
- Deploy notes for GitHub Pages.
- Mobile gesture instructions (1 line).
- Known limitations.

Definition of Done
- Deployed demo URL works on iPhone.
- First interaction is instant; no lag spike.
- Code is modular (field/particles/ui), readable, and commented where it matters.

How to work (Codex execution loop)
- Work milestone-by-milestone.
- After each milestone:
  - Run locally, verify acceptance checklist.
  - Fix any regressions before moving on.
- Keep commits small and descriptive.

Start here
- Implement Milestone 0 first.
- Keep everything dependency-free unless absolutely necessary.
