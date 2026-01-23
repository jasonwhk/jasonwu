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

5. **Always print full code**
   - For every file you create or modify, print the entire file.

6. **No scope creep**
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
4. Print full code for modified files

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