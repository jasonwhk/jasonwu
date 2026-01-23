# Milestones — Solar System 3D orbit map

## Milestone 0 — Repo integration scaffold (navigation + route)
- Added `tools/solar-system/` with `index.html`, `main.js`, `style.css` (placeholder canvas + status overlay).
- Linked from `tools/index.html` as “Solar System”.

How to test:
- Open `index.html` (homepage) → click “Tools” → click “Solar System”.
- Confirm the Solar System page loads and shows a dark canvas placeholder with a small overlay panel.
- Confirm there are no console errors.

## Milestone 1 — Three.js scene + touch camera controls
- Replaced the placeholder canvas with a Three.js WebGL scene.
- Added OrbitControls for touch-first rotate/zoom/pan.
- Canvas fills the viewport, clamps devicePixelRatio to 2, and blocks page scrolling while touching the canvas.

How to test:
- Open `/tools/solar-system/index.html`.
- On iPhone: 1-finger rotate, pinch zoom, 2-finger pan; confirm the page doesn’t scroll while interacting with the scene.
- Confirm there are no console errors.

## Milestone 2 — Sun & Planets (Static) + Visibility Scale
- Added Sun + 8 planet spheres with basic materials/colors (static placement).
- Added UI toggles:
  - “Planet visibility scale” (boosts planet radius for readability)
  - “Labels” (on/off)
- Labels are rendered via CSS2DRenderer and don’t block touch gestures.

How to test:
- Open `/tools/solar-system/index.html`.
- Toggle “Planet visibility scale” and confirm planet sizes change.
- Toggle “Labels” and confirm labels show/hide.
- Confirm touch rotate/zoom/pan still works and there are no console errors.

## Milestone 3 — Orbit Rings
- Added elliptical orbit rings (LineLoop) for each planet.
- Switched planet orbit placement to AU-based semimajor axis + eccentricity (Sun at focus).
- Orbit rings are slightly offset in `y` and use `depthWrite=false` to avoid z-fighting artifacts.

How to test:
- Open `/tools/solar-system/index.html`.
- Confirm each planet has a corresponding orbit ring.
- Rotate/zoom/pan; confirm rings remain visually stable with no flicker/z-fighting.
- Toggle “Labels” and “Planet visibility scale”; confirm prior Milestone 2 behavior still works.

## Milestone 4 — Keplerian Planet Positions (Now)
- Added Julian Day conversion (from `Date`) and centuries-since-J2000 time variable.
- Added an approximate orbital-elements dataset (J2000 base + per-century rates).
- Implemented a Kepler equation solver (Newton iteration).
- Compute heliocentric ecliptic positions (XYZ, AU) and place planets at current-date positions.
- Planets update once per second and the status panel shows the current UTC timestamp.

How to test:
- Open `/tools/solar-system/index.html`.
- Confirm planets are no longer aligned at the same orbital angle (they should be spread around the Sun).
- Wait ~10 seconds; confirm the “Now:” timestamp updates and there are no console errors.
- Toggle “Labels” and “Planet visibility scale”; confirm prior Milestone 2 behavior still works.

## Milestone 5 — Time Simulation Controls
- Added a simulated time variable used for planet positions (instead of always using real time).
- Added time controls:
  - “Now” button (snap simulated time to current time and reset offset)
  - Offset slider: -365 to +365 days
  - Play / pause
  - Speed options: 1×, 60×, 600×, 6000×, 60000× + custom input
- Status line shows simulated UTC time, playback state, speed, and offset.

How to test:
- Open `/tools/solar-system/index.html`.
- Confirm planets move in real-time at 1× by default and there are no console errors.
- Tap “Pause”, drag the Offset slider, and confirm planet positions jump accordingly.
- Tap “Play” and select 60× / 600×; confirm planets move faster.
- Tap “Now”; confirm offset resets to 0 and simulated time matches current UTC.
