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

---

# Extended Feature Milestones (Optional / Post-Core)

The following milestones build on top of Milestones 0–5.
They are independent but ordered for best integration.
Codex should only work on ONE milestone at a time.

# agent.md — Play with the Wind (Extended Milestones: Feature Pack)

Context
- This app already has: vector field + particle mode + optional smoke + touch controls + basic UI.
- These milestones add ALL requested new features as incremental upgrades.
- Keep the UI minimal: most features behind a single “More” drawer (collapsed by default) and a “Pro” toggle.

Rules
- Don’t break existing behavior.
- Keep 60 FPS as the north star (auto-degrade quality if needed).
- Avoid dependencies unless absolutely necessary.
- After each milestone: verify acceptance checklist and fix regressions.

---

## Milestone 6 — Wind Memory / “Ghost Winds”
Goal
- Make wind feel like it has persistence and history without becoming unstable.

Implementation
- Add two decay modes:
  - Normal decay (existing): strong damping, quick fade.
  - Persistent decay: slow damping + mild diffusion/blur.
- Add optional “field diffusion” step:
  - Simple 2D blur on u/v (cheap: one Jacobi-like smoothing pass).
- Add a toggle: `Wind Memory: Off / On`.

Acceptance checklist
- With Wind Memory ON, old flow patterns linger and slowly fade.
- Dragging repeatedly builds coherent “wind structures”.
- No runaway velocities; field remains bounded.
- Performance remains stable (no per-frame allocations).

---

## Milestone 7 — Temperature Mode (Buoyancy + Heat/Cold Painting)
Goal
- Add a temperature scalar field that influences motion (hot rises, cold sinks).

Implementation
- Add scalar grid `temp` (Float32Array) matching field resolution.
- Input mapping:
  - Long-press + drag: inject heat (+temp).
  - Two-finger tap: inject cold (-temp).
  - Desktop: hold `Shift` while dragging = heat; hold `Alt` = cold.
- Each sim step:
  - Advect temp by velocity (semi-lagrangian, like smoke density).
  - Apply decay to temp (slow).
  - Apply buoyancy to velocity:
    - `v_y += buoyancyStrength * temp`
- Rendering:
  - Optional overlay: show temp as subtle red/blue tint (toggle).
- Add UI toggle: `Physics: Wind / Wind+Temperature`
- Add slider (in “More” drawer): Buoyancy strength.

Acceptance checklist
- Heat rises visibly; cold sinks.
- Temperature fades over time and doesn’t accumulate forever.
- Touch gestures feel natural and discoverable.
- No drift/instability; reset clears temp.

---

## Milestone 8 — Mode Skins (Themes)
Goal
- Add multiple visual “skins” without changing the core sim.

Implementation
- Add renderer presets:
  - Classic Particles (default)
  - Autumn Leaves (sprite-like triangles or small leaf glyphs)
  - Snow (larger soft dots, slower fall with gravity)
  - Ink (smoke density with darker palette)
  - Fireflies (glow points with twinkle; drift + mild noise)
- Keep the same particle buffers; only change draw style and per-particle params.
- Add a `Theme` selector in “More”:
  - `Classic / Leaves / Snow / Ink / Fireflies`
- Add a “no-assets” requirement for v1:
  - Generate shapes procedurally (triangles/circles) rather than PNGs.

Acceptance checklist
- Switching themes is instant and doesn’t reset unless user chooses.
- Themes do not reduce FPS significantly vs Classic (or auto-lower count).
- Looks good on dark and light backgrounds.

---

## Milestone 9 — Vortex Lock (Spin Brush)
Goal
- Add a brush mode that injects rotational flow for perfect spirals.

Implementation
- Add brush mode: `Push` (normal) vs `Vortex`.
- When injecting velocity:
  - Compute pointer delta `(dx, dy)`.
  - For vortex: inject perpendicular vector `(-dy, dx)` instead of `(dx, dy)`.
- Optional: “Vortex Direction” toggle (CW/CCW), or flip with double-tap.

UI
- Small toggle near Mode: `Brush: Push / Vortex`.

Acceptance checklist
- Spirals form immediately and predictably.
- Works with both particles and smoke.
- No new UI clutter beyond one toggle.

---

## Milestone 10 — Obstacle Painting (Flow Around Shapes)
Goal
- Let users draw obstacles that block/redirect flow.

Implementation
- Add a binary mask grid `solid` (Uint8Array), same resolution as field.
- Input mapping:
  - “Obstacle” tool in “More” drawer:
    - Draw: add solid
    - Erase: remove solid
  - Desktop: hold `E` to erase (while obstacle tool active).
- Simulation rules:
  - Velocity inside solid cells set to 0.
  - Density/temp inside solids set to 0 (or not advected).
  - Optional boundary handling (cheap):
    - For cells adjacent to solid: damp normal component to reduce “leaks”.
- Rendering:
  - Show obstacles as faint overlay (toggle).
- Add buttons:
  - `Clear Obstacles`
  - `Invert Obstacles` (optional, hidden in Pro)

Acceptance checklist
- You can draw a wall and see flow bend around it.
- No severe artifacts (exploding velocities near boundaries).
- Obstacles don’t tank performance.

---

## Milestone 11 — Sound from Flow (Subtle Ambient Sonification)
Goal
- Add optional, low-volume sound that responds to the simulation.

Implementation
- Use Web Audio API (no libs).
- Create a gentle ambient source:
  - One or two oscillators + noise source through filters.
- Drive parameters from flow statistics sampled each second:
  - Mean speed → overall volume (clamped very low).
  - Mean vorticity → filter cutoff / pitch shift.
- Audio safety:
  - Default OFF.
  - Only starts after a user interaction (required by browsers).
  - Provide a clear mute toggle.
- Add UI toggle in “More”: `Sound: Off / On` + volume slider (max low).

Acceptance checklist
- Sound is subtle and pleasant, never loud.
- No audio glitches when toggling.
- Audio starts only after user gesture and respects mute.

---

## Milestone 12 — Science Overlay Mode (Arrows / Streamlines / Diagnostics)
Goal
- Add a “science” view for learning and debugging.

Implementation
- Add overlay modes:
  - Off
  - Arrows (downsampled grid vectors)
  - Streamlines (seed lines + integrate forward)
  - Divergence / Vorticity heatmap (choose one for v1; add the other in Pro)
- Add a `Science Overlay` selector in “More”.
- Keep overlays lightweight:
  - Compute at reduced resolution (e.g. every 4th cell).
  - Limit streamline count (e.g. 100–300).

Acceptance checklist
- Overlay helps understand the flow.
- Doesn’t destroy FPS; auto-disable or lower density on low FPS.

---

## Milestone 13 — Exotic Force Fields (Hidden “Pro” Menu)
Goal
- Add optional “forces” that influence particles/flow: gravity wells, repellers, dipoles.

Implementation
- Add a list of “field sources” with params:
  - type: `attractor` | `repeller` | `dipole`
  - position (x,y)
  - strength
  - radius/falloff
- Input mapping (Pro only):
  - Double-tap: add attractor at tap.
  - Triple-tap: add repeller.
  - Long-press with 2 fingers: add dipole (direction from gesture).
- Each sim step:
  - For each source, apply additional acceleration to velocity field (or directly to particles):
    - Use inverse-square or smooth falloff: `strength / (r^2 + eps)` with clamp.
- UI (Pro drawer):
  - `Force Fields: Off / On`
  - `Add Field` button (desktop-friendly)
  - List with delete per item
  - `Clear Fields`

Acceptance checklist
- Fields feel intuitive: particles curve toward/away.
- No instability: clamp max acceleration.
- Pro UI stays hidden unless enabled.

---

## Milestone 14 — Integration + “More” Drawer + UX Cleanup
Goal
- Add all controls cleanly without clutter.

Implementation
- Add a single “More” button that opens a bottom sheet (mobile) / side panel (desktop).
- Group controls:
  - Visual: Theme, Trails strength
  - Physics: Wind Memory, Temperature, Buoyancy
  - Tools: Brush mode, Obstacles
  - Overlays: Science overlay
  - Audio: Sound toggle/volume
  - Pro: Force fields toggle + management
- Ensure controls are touch-friendly (44px min target).
- Add “Reset All” (resets field, particles, smoke/temp, obstacles, force fields).

Acceptance checklist
- Default UI stays minimal (Reset + Mode + More).
- Everything is reachable with one hand on phone.
- No accidental page scroll; gestures are reliable.

---

## Milestone 15 — Performance & Quality Auto-Scaling (Mandatory after adding features)
Goal
- Keep it fast as features accumulate.

Implementation
- Add a simple performance monitor:
  - Track average frame time over last 60 frames.
- Auto-scale rules:
  - If FPS < 45 for >2s:
    - reduce particle count
    - reduce grid resolution
    - reduce overlay density
  - If FPS > 58 for >5s:
    - cautiously restore quality (up to user-selected cap)
- Cap DPR used for canvas rendering (e.g. max 2.0; on slow devices max 1.5).
- Ensure no per-frame allocations in hot loops.
- Optional: OffscreenCanvas (only if it’s worth it; keep optional).

Acceptance checklist
- No “death spiral” performance drop.
- Long-run stability (10 minutes) with multiple toggles switching.
- Memory stable; no growth from event handlers or arrays.

---

## Test checklist (run after every milestone)
Functional
- Touch drag creates wind
- Tap gust works
- Pinch changes brush radius
- Reset works instantly
- Rotate device / resize does not break

Feature checks
- Wind Memory toggle behaves
- Temperature: heat rises, cold sinks
- Themes switch correctly
- Vortex brush spirals reliably
- Obstacles block flow
- Sound respects mute and user gesture
- Science overlay renders and can be disabled
- Pro force fields add/remove and affect motion

Performance
- No per-frame allocations in main step/draw loops
- Stable FPS on iPhone in Classic Particles
- Auto-scaling triggers when needed

---

## Definition of Done (Extended)
- All milestones 6–15 implemented.
- Default view remains simple and calm.
- “More” drawer organizes everything without clutter.
- Runs smoothly on iPhone Safari and desktop Chrome.

