# agent.md — Doom-ish Browser FPS (Client-side)

## Objective
Build a playable “Doom-ish” first-person shooter experience that runs entirely in the browser (client-side), deployable on GitHub Pages. The game should feel like classic Doom/Wolf3D: fast movement, 2.5D raycasted walls, sprite enemies/items, simple weapons, and level progression.

## Non-Goals
- Not a full Doom engine clone (no WAD parsing, no exact Doom rendering pipeline).
- No server-side rendering or multiplayer.
- No heavy frameworks required (keep dependencies minimal).

## Target Platform
- Web: modern evergreen browsers (Chrome/Edge/Firefox/Safari).
- Must work on desktop; mobile support is a stretch goal (touch controls).

## Constraints / Requirements
- Fully client-side: all rendering, simulation, and assets loaded locally.
- Must run smoothly on mid-range laptops and phones (target 60 FPS desktop, 30+ FPS mobile).
- Prefer small codebase and clear modular structure.
- No external paid APIs.
- Must be easily hosted on GitHub Pages (static files).

## Deliverables
- A working game accessible at: `/games/doomish/`
- Source structure with clear separation:
  - `index.html` (bootstrap + UI)
  - `src/` (engine + gameplay)
  - `assets/` (textures, sprites, sounds)
  - `levels/` (level JSON files)
- Documentation:
  - `README.md` (how to run locally + deploy)
  - `TECHNICAL_SPEC.md` (high-level design)
  - `TEST_CHECKLIST.md` (manual verification steps)

---

## Milestones (Implement in Order)

### Milestone 1 — Minimal Engine & Movement (MVP)
**Goal:** Walking around a maze in first-person.

**Features**
- Canvas-based renderer (start with 2.5D raycasting).
- Map grid (2D array): `0 = empty`, `>0 = wall`.
- Player:
  - WASD move, arrow keys turn
  - Optional pointer-lock mouse look
  - Collision with walls
- Basic shading by distance.
- Minimap toggle.

**Acceptance criteria**
- Player can move without clipping through walls.
- Stable FPS and no input lag.
- No console errors.

---

### Milestone 2 — Textures & Visual Polish
**Goal:** Classic look (textured walls + floor/ceiling).

**Features**
- Wall textures (per wall type).
- Optional floor/ceiling fill or textured sampling.
- Resolution scaling option (quality vs performance).
- Simple HUD (crosshair + debug stats toggle).

**Acceptance criteria**
- Walls are textured and stable (no severe warping/jitter).
- No fish-eye distortion (use perpendicular distance).
- Texture loading works offline.

---

### Milestone 3 — Sprites (Items + Enemies)
**Goal:** Enemies and pickups rendered as billboards.

**Features**
- Sprite billboard renderer:
  - Depth-sort sprites back-to-front
  - Occlusion against walls (use depth buffer per column)
- Place items/enemies in world coords.
- Basic pickups (ammo/health) with collision radius.

**Acceptance criteria**
- Sprites scale with distance and are correctly occluded by walls.
- Player can pick up items and state updates accordingly.

---

### Milestone 4 — Weapons + Shooting
**Goal:** You can shoot and defeat enemies.

**Features**
- Weapon system:
  - One starter weapon (pistol)
  - Fire rate + ammo
  - Hitscan ray vs enemies
- Weapon animation (simple sprite/frames or CSS).
- Sound effects (optional if assets available).

**Acceptance criteria**
- Shooting reduces enemy health and kills them.
- Ammo decreases; pickups replenish ammo.
- No shooting through walls (hitscan stops at first wall).

---

### Milestone 5 — Enemy AI (Simple Doom-ish)
**Goal:** Enemies notice you, chase, and attack.

**Features**
- AI states:
  - Idle → Alert (line of sight or proximity)
  - Chase (simple steering)
  - Attack (melee or ranged)
- Pathing: naive “move toward player” + wall sliding is OK initially.
- Player damage + health.

**Acceptance criteria**
- Enemies reliably chase without getting stuck too often.
- Player can die (game over screen) and restart.

---

### Milestone 6 — Levels, Progression, and UX
**Goal:** Multiple levels with a menu and basic game loop.

**Features**
- Level format: JSON describing:
  - Map grid
  - Player spawn
  - Entities (enemies, pickups, exit)
- Exit tile/trigger to progress to next level.
- UI:
  - Start screen
  - Level complete screen
  - Restart level
  - Next/Previous level or level select

**Acceptance criteria**
- At least 3 playable levels.
- Level transitions work consistently.

---

## Architecture Notes

### Core Modules (suggested)
- `src/main.js` — bootstraps game, loads assets/levels, starts loop
- `src/engine/renderer.js` — raycaster + sprite rendering + depth buffer
- `src/engine/input.js` — keyboard, pointer lock, (later) touch controls
- `src/engine/physics.js` — collision, movement integration
- `src/game/state.js` — player stats, inventory, health/ammo, scoring
- `src/game/entities.js` — enemy/item definitions and update logic
- `src/game/ai.js` — enemy AI state machine
- `src/game/levels.js` — JSON loader + level manager
- `src/ui/ui.js` — HUD + menus + overlays

### Game Loop
- Fixed timestep simulation recommended (e.g., 60 Hz) with accumulator.
- Rendering can interpolate or render per requestAnimationFrame.

### Coordinate System
- World coordinates in “tile units”.
- Map grid index = `Math.floor(x), Math.floor(y)`.

---

## Performance Targets
- Ray count equal to render width (1 ray per column).
- Optional dynamic resolution scaling when FPS drops.
- Avoid per-frame allocations where possible (reuse arrays).

---

## Input Requirements
- Desktop:
  - WASD move
  - Mouse look (pointer lock)
  - Shift sprint
  - Space use/open (optional)
  - Left click fire
- Must prevent page scrolling on arrow keys/space when game focused.
- Provide “Click to play” button for pointer lock.

---

## Asset Strategy
- Start with simple placeholder assets (flat colors).
- Then add:
  - Wall textures: small PNGs (e.g., 64x64)
  - Sprite sheets for enemies/items
  - Weapon sprite(s)
  - Optional sounds (OGG/WAV)

All assets must be local and included in the repo.

---

## Testing & Validation

### Manual Test Checklist (must create `TEST_CHECKLIST.md`)
Include checks for:
- Movement/collision correctness
- Pointer lock works and exits with Esc
- Sprites occlusion correct
- Shooting does not pass through walls
- Enemy AI transitions (idle → chase → attack)
- Level progression + restart works
- No console errors on refresh
- Works on mobile Safari/Chrome (if touch controls implemented)

### Debug Tools
- Toggleable minimap
- Toggleable debug overlay (FPS, player pos, angle)
- Optional “noclip” debug toggle (dev-only)

---

## Coding Standards
- Use modern JS modules (`type="module"`).
- Prefer readable code over micro-optimizations (until performance needs it).
- Keep functions small and testable.
- Avoid frameworks unless there’s a clear benefit.

---

## Deployment
- Must run as static site:
  - `games/doomish/index.html`
  - relative asset paths
- GitHub Pages compatible.

---

## Completion Definition
Project is “done” when:
- You can start the game, move, shoot enemies, pick up items, take damage, and finish at least 3 levels.
- The game has minimal UX: start screen, HUD, restart, level progression.
- No major bugs in collision, rendering, or input.
- Docs and checklist are present and accurate.

---

## Stretch Goals (Optional)
- Touch controls (virtual joystick / swipe-to-look).
- Sector-based levels (floors/ceilings with different heights).
- Doors, keys, switches.
- Simple lighting effects.
- Save/load progress in localStorage.
- Basic level editor (in-browser).