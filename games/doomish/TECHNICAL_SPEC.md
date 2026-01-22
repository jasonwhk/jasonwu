Nice — here are matching TECHNICAL_SPEC.md and TEST_CHECKLIST.md that align with the agent.md you’ve got.

⸻

TECHNICAL_SPEC.md

# TECHNICAL_SPEC.md — Doom-ish Browser FPS (Client-side)

## 1. Overview
This project is a client-side, browser-playable “Doom-ish” FPS using a classic 2.5D raycasting renderer (Wolf3D-style) plus sprite billboards for enemies and items. It is designed to run as a static site on GitHub Pages.

Primary goals:
- Smooth first-person movement and collision in a grid map.
- Raycasted walls with textured rendering.
- Sprites for enemies/items with correct depth/occlusion.
- Simple weapons, damage, and basic enemy AI.
- Multi-level progression with minimal UI.

Non-goals:
- Full Doom engine clone (no WAD parsing, no exact Doom renderer).
- Multiplayer/networking.

---

## 2. Technology & Runtime
- Language: JavaScript (ES2020+)
- Rendering: HTML5 Canvas 2D initially
  - Optional future upgrade: WebGL
- Input: Keyboard + Pointer Lock mouse
- Audio: HTML5 Audio (later)
- Packaging: Static files, no build step required (optional Vite later)

---

## 3. Directory Layout (Target)

games/Doom/
index.html
README.md
TECHNICAL_SPEC.md
TEST_CHECKLIST.md
src/
main.js
engine/
renderer.js
input.js
time.js
math.js
assets.js
physics.js
game/
state.js
entities.js
ai.js
weapons.js
levels.js
constants.js
ui/
ui.js
assets/
textures/
sprites/
sounds/
levels/
level01.json
level02.json
level03.json

---

## 4. Data Model

### 4.1 Coordinate system
- World units: “tile units”
- Tile index: `tx = Math.floor(x)`, `ty = Math.floor(y)`
- Player position: continuous (float) x,y
- Player angle: radians in [0, 2π)

### 4.2 Map grid
- Stored as a 1D array `map[w*h]` or 2D array `map[y][x]`
- Tile values:
  - `0`: empty
  - `1..N`: wall type (texture selection)
  - Special tiles (later):
    - `E`: exit trigger (or numeric code)
    - `D`: door (optional)

### 4.3 Entities
All entities have:
- `id`, `type`, `x`, `y`, `radius`
- Optional:
  - `health`, `state`, `sprite`, `solid`, `pickup`, `damage`

Entity types:
- `enemy_basic`
- `pickup_health`
- `pickup_ammo`
- `exit`

---

## 5. Game Loop
Use a fixed timestep simulation to stabilize gameplay independent of frame rate.

Recommended:
- `SIM_DT = 1/60`
- Accumulator loop:
  - `acc += realDt`
  - while `acc >= SIM_DT`:
    - input sample
    - update game state (movement, AI, bullets)
    - resolve collisions
    - `acc -= SIM_DT`
  - render using latest state (optionally interpolation factor `alpha = acc/SIM_DT`)

---

## 6. Engine Subsystems

### 6.1 Input (`src/engine/input.js`)
Responsibilities:
- Track key states (`Set` or boolean map)
- Pointer lock handling and mouse delta collection
- Provide per-tick “intent”:
  - moveForward, moveBack, strafeLeft, strafeRight
  - turnLeft, turnRight
  - fire, use
- Prevent page scrolling for arrow keys and space while game active

### 6.2 Physics (`src/engine/physics.js`)
Responsibilities:
- Player collision against grid walls
- Basic circle-vs-grid collision via axis separation:
  - attempt X move, clamp if hits wall
  - attempt Y move, clamp if hits wall
- Entity collision checks:
  - player vs pickups
  - bullets/hitscan vs enemy radius

### 6.3 Renderer (`src/engine/renderer.js`)
Responsibilities:
- Raycasting wall renderer using DDA
- Per-column depth buffer:
  - `zBuffer[x] = wallDist`
- Sprite billboard renderer:
  - transform sprite into camera space
  - project to screen columns
  - draw only if `spriteDepth < zBuffer[x]`
- Visuals:
  - sky/floor fill (solid)
  - later: wall textures and simple floor/ceiling texture sampling
- Debug overlays:
  - minimap
  - fps + player position readout

Raycasting details:
- FOV ~ 60°
- One ray per screen column
- Use perpendicular distance to avoid fish-eye

### 6.4 Assets (`src/engine/assets.js`)
Responsibilities:
- Load images/sounds via `fetch`/`Image`/`Audio`
- Cache assets and expose handles to renderer
- Must work under GitHub Pages and local file server

### 6.5 Levels (`src/game/levels.js`)
Responsibilities:
- Load level JSON
- Spawn player and entities
- Provide `nextLevel()`, `restartLevel()`, `setLevel(i)`

---

## 7. Gameplay Systems

### 7.1 State (`src/game/state.js`)
Stores:
- `player: {x,y,a, health, ammo}`
- `currentLevelIndex`
- `entities[]`
- `flags: {gameOver, levelComplete}`
- `timers` for weapon cooldown, hit flash etc.

### 7.2 Weapons (`src/game/weapons.js`)
Start with a pistol:
- Fire rate ~ 3–5 shots/sec
- Ammo consumption optional initially (can be infinite for early milestones)
- Hitscan:
  - Cast a ray from player angle
  - Find first wall intersection distance
  - Check enemies along the ray before the wall distance (ray vs circle)
  - Apply damage

### 7.3 AI (`src/game/ai.js`)
Enemy FSM:
- `IDLE`: stand still
- `ALERT`: noticed player (distance or LoS)
- `CHASE`: move toward player
- `ATTACK`: if close enough (melee) or LoS (ranged optional)
Rules:
- Simple steering: desired velocity toward player + collision slide

---

## 8. UI/UX (`src/ui/ui.js`)
Screens:
- Start menu: “Play”
- In-game HUD: crosshair, health, ammo, level
- Game over: “Restart”
- Level complete: “Next level”
Controls:
- “Click to play” button triggers pointer lock

---

## 9. Level Format (JSON)
Example:
```json
{
  "name": "Level 01",
  "size": [16, 16],
  "map": [
    1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
    1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
    ...
  ],
  "playerSpawn": { "x": 2.5, "y": 2.5, "a": 0 },
  "entities": [
    { "type": "enemy_basic", "x": 8.5, "y": 8.5 },
    { "type": "pickup_health", "x": 3.5, "y": 5.5 },
    { "type": "exit", "x": 14.5, "y": 14.5 }
  ]
}
```

⸻

## 10. Performance Plan
	•	Keep internal render resolution modest (e.g., 480x270 scaled)
	•	Avoid allocations inside hot loops (raycast, sprite draw)
	•	Use typed arrays for zBuffer if needed
	•	Add optional dynamic resolution scaling if FPS dips

⸻

## 11. Security / Licensing
	•	No external code copied from Doom source.
	•	Use original or permissively licensed placeholder assets.
	•	Avoid embedding copyrighted Doom sprites/textures unless confirmed permitted.

⸻

## 12. Milestone Mapping
	•	M1: movement + raycast walls + minimap
	•	M2: textures + polish + HUD
	•	M3: sprites + pickups + occlusion
	•	M4: weapons + hitscan + kill enemies
	•	M5: AI + player damage + game over
	•	M6: multi-level + menus + progression

---