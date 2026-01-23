# Coding Agent Instructions — 3D Solar System Orbit Map

You are a coding agent working in this repository.

This repo hosts a **static GitHub Pages website**.  
One feature in this repo is an interactive **3D Solar System orbit map** implemented fully client-side (no backend).

You must follow the rules and milestones below exactly.

---

## Project Overview

Feature: **3D Solar System Orbit Map**
- Location: `tools/solar-system/`
- Platform: GitHub Pages (static hosting)
- Target devices: iPhone (touch-first), tablet, desktop
- Rendering: Three.js (ESM via CDN)
- No build step, no backend, no API keys

The widget shows:
- Sun + 8 planets
- 3D orbit rings
- Approximate real-time positions using Keplerian orbits
- Touch interaction (rotate, zoom, pan)
- Time controls and camera presets

---

## Golden Rules (Non-Negotiable)

1. **Client-side only**
   - Everything must run by opening `index.html` directly.
   - No servers, no bundlers, no frameworks.

2. **Do NOT change public behavior of completed milestones**
   - Extend, don’t break.
   - If refactoring is necessary, behavior must remain identical.

3. **Touch-first UX**
   - Must work on mobile Safari.
   - No keyboard-only assumptions.

4. **Static hosting compatible**
   - Relative paths only.
   - CDN imports must work on GitHub Pages.


5. **No scope creep**
   - Implement **only the active milestone**.
   - Do not jump ahead.

---

## Files You May Touch

Primary feature files:
- `tools/solar-system/index.html`
- `tools/solar-system/main.js`
- `tools/solar-system/style.css`
- `tools/solar-system/MILESTONES.md`

Site integration (if needed):
- Existing navigation/menu files (minimal changes only)

---

## Milestone Control (IMPORTANT)

You will always be told **one** milestone to work on, for example:

> “Work on Milestone 3”

You must:
- Implement **only that milestone**
- Assume all previous milestones are complete and correct
- Do NOT redo or redesign earlier work

After completing a milestone:
1. Ensure no console errors
2. Ensure page runs by opening HTML directly
3. Update `tools/solar-system/MILESTONES.md`

---

## Milestones Definition

### Milestone 0 — Scaffold & Navigation
- Create `tools/solar-system/`
- Add `index.html`, `main.js`, `style.css`
- Add navigation link: “Tools → Solar System”
- Placeholder canvas/layout

---

### Milestone 1 — Three.js Scene & Touch Controls
- Three.js scene, camera, renderer
- OrbitControls with touch
- Fullscreen canvas
- Prevent page scroll while interacting with canvas
- Clamp devicePixelRatio for mobile

---

### Milestone 2 — Sun & Planets (Static) + Visibility Scale
- Sun + 8 planets as spheres
- Basic materials/colors
- Toggle: “Planet visibility scale”
- Labels toggle (simple, stable)

---

### Milestone 3 — Orbit Rings
- Elliptical orbit rings for each planet
- Scene units: AU-based scaling
- Orbits visually stable (no z-fighting)

---

### Milestone 4 — Keplerian Planet Positions (Now)
- Julian Day conversion
- Orbital elements dataset (approximate)
- Kepler solver
- Heliocentric ecliptic XYZ positions
- Place planets at current-date positions

---

### Milestone 5 — Time Simulation Controls
- Simulated time variable
- “Now” button
- ±365-day slider
- Play / pause
- Speed options: 1×, 60×, 600×

---

### Milestone 6 — Camera Presets & Focus
- View presets (top-down, tilted, free)
- Focus dropdown for planets
- Smooth camera transitions
- Optional target tracking

---
### Milestone 6.5 — Moons (v1)

Add a simple, extensible moon system that integrates with the existing
time simulation and camera focus logic.

Scope:
- Add Earth’s Moon as the first implementation.
- Structure code so adding more moons later requires only data entries.

Requirements:
- Represent moons via parent–child transforms (moon orbits planet).
- Circular orbit approximation is sufficient.
- Add UI toggles:
  - Show Moons
  - Show Moon Orbits
  - Moon Visibility Scale
- Moons must animate with simulation time.
- Moon orbit rings are optional but recommended.

Acceptance:
- Moon orbits Earth smoothly while Earth orbits Sun.
- Toggles work on mobile Safari.
- No console errors.
- Works when opening index.html directly.

Do NOT:
- Add external APIs
- Break existing planet focus/track behavior

### Milestone 6.6 — Moons (v2: All major moons, performant)

**Goal:** Extend the moon system from Milestone 6.5 to include **major moons for all planets** (where relevant) while keeping iPhone performance smooth. The implementation must remain **data-driven**: adding moons should require only adding entries to a dataset, not writing new logic.

This milestone builds on Milestone 6.5 (Earth’s Moon system already exists and works).

---

## Scope

### Must include (major moons set)
Implement at least the commonly referenced “major” moons below (don’t aim for every tiny irregular moon; that would be too many). Use this set as the default dataset:

- **Earth:** Moon
- **Mars:** Phobos, Deimos
- **Jupiter:** Io, Europa, Ganymede, Callisto
- **Saturn:** Titan, Rhea, Iapetus, Dione, Tethys, Enceladus, Mimas
- **Uranus:** Titania, Oberon, Umbriel, Ariel, Miranda
- **Neptune:** Triton, Proteus, Nereid
- **Mercury/Venus:** none

(Optionally allow “All included moons” to be expanded later, but do not add more than this set in this milestone.)

---

## UI Requirements (touch-first, compact)

Add the following controls to the existing overlay:

1) **Moons** (master toggle)
2) **Moon orbits** toggle
3) **Moon labels** toggle (separate from planet labels)
4) **Moon size boost** slider (or discrete steps)  
   - Suggested steps: Off / x20 / x50 / x100 / x200
5) **Moon density** dropdown:
   - “Major only” (default) — this milestone’s set
   - “(Reserved) Expanded” — show disabled option or omit; do not implement expanded

Optional but good:
- “Show moons only for focused planet” toggle (default OFF)
  - When ON: render moons only for currently focused planet (huge performance and clarity win)

---

## Rendering & Performance Constraints

- Keep the total number of moon meshes modest (this milestone’s set is fine).
- Use **shared geometries/materials**:
  - One sphere geometry reused for all moons (scaled per moon)
  - Reuse materials per parent planet or a small palette
- Update moon label positions at a throttled rate (e.g., 10 Hz), not every frame.
- Orbit rings must be lightweight and optionally hidden by default.

Target: **smooth interaction on iPhone Safari**.

---

## Data Model (strict)

Create/extend a `MOONS` array of objects with at least:

- `name` (string)
- `parent` (string planet name)
- `radiusKm` (number)
- `semiMajorAxisKm` (number) — average orbital distance
- `orbitalPeriodDays` (number)
- `inclinationDeg` (number, optional; can be 0 if you don’t have it)
- `phaseAtJ2000` (number radians, optional)

**Rule:** The logic must not special-case any moon by name.

---

## Orbital Motion (visual approximation)

Continue to use a simple circular model (consistent with 6.5):

- Compute `tDays = (simJD - J2000_JD)` in days.
- Angular speed `n = 2π / orbitalPeriodDays`.
- Angle `theta = phaseAtJ2000 + n * tDays`.
- Local position: `(a*cos(theta), 0, a*sin(theta))` then apply inclination rotation.
- Convert km → AU → scene units using existing constants and scales.

---

## Scene Graph (parent-child)

- Each planet has a `planetGroup` anchor.
- Moons attach to their planet’s group.
- Each moon should have:
  - `moonGroup` or mesh
  - optional `orbitLine` (child of planetGroup)
  - optional label handle

Toggles must show/hide these efficiently (don’t rebuild every time unless needed).

---

## Focus Integration

If the user has selected a focused planet (Milestone 6):
- When “Show moons only for focused planet” is ON:
  - Render/enable only moons where `parent === focusedPlanet`.
  - Others are hidden and not label-updated.

---

## Acceptance Criteria

- [ ] All listed moons appear (when Moons toggle ON).
- [ ] Moons orbit their correct parent planet and animate with time simulation.
- [ ] “Moon labels” toggle shows/hides moon names (stable, readable).
- [ ] “Moon orbits” toggle shows/hides orbit rings.
- [ ] “Moon size boost” makes moons visible without overwhelming the planets.
- [ ] Performance remains good on iPhone Safari (no obvious stutter during rotate/zoom).
- [ ] No console errors.
- [ ] `tools/solar-system/MILESTONES.md` updated with Milestone 6.6 notes.

---

## Test Checklist

1) Toggle Moons ON → see moons around Earth, Mars, Jupiter, Saturn, Uranus, Neptune.
2) Focus Jupiter → moons remain with Jupiter; enable “moons only for focused planet” → only Jupiter’s moons show.
3) Play at 600x → moons visibly orbit (fast for inner moons like Io).
4) Toggle Moon labels ON → labels appear and don’t jitter excessively.
5) Toggle Moon orbits ON → orbit rings appear; OFF → disappear.
6) Toggle Moon size boost between steps → sizes adjust predictably.

---

## Deliverables
Update only as needed:
- `tools/solar-system/index.html` (UI)
- `tools/solar-system/main.js` (data + rendering + updates)
- `tools/solar-system/style.css` (if needed)
- `tools/solar-system/MILESTONES.md`


### Milestone 7 — UX Polish
- Label jitter reduction
- Orbit toggle
- Optional planet trails
- Gesture help hint
- Mobile UI hardening

---

### Milestone 8 — Documentation & Final Checks
- Minimal documentation
- Sanity self-test
- Cleanup, no warnings/errors

---

## Validation Checklist (Run Every Time)

- [ ] Page opens without server
- [ ] No console errors
- [ ] Touch gestures work on mobile
- [ ] UI readable on small screens
- [ ] Previous milestones still work

---

## How You Will Be Instructed

Future instructions will look like:

> **“Work on Milestone N”**

That is sufficient context.
Do not ask clarifying questions unless something is ambiguous in the milestone definition.

Begin implementation immediately.