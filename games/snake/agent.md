# agent.md — Classic Snake (Web, touch-first)

## Mission
Build a classic Snake game that runs fully client-side on my website, with excellent mobile/touch UX and solid desktop keyboard support. Keep it simple, polished, and reliable.

## Execution mode (IMPORTANT)
You must complete **Milestones 0 → N sequentially in a single run**, without stopping to ask for confirmation between milestones.

For each milestone:
1. Implement the code changes.
2. Do a quick self-check using the milestone’s checklist.
3. If something fails, fix it before moving on.
4. Only then continue to the next milestone.

## Constraints
- Client-side only (no backend).
- No external game engines.
- Prefer plain HTML/CSS/JS (or minimal tooling if repo already uses bundler — but do not introduce heavy dependencies).
- Mobile/touch is first-class, desktop keyboard is also required.
- Must prevent page scrolling when playing (keys + touch).
- Keep code readable, modular, and easy to extend.

## Target deliverables
Create (or update) these files under `/games/Snake/`:
- `index.html`
- `style.css`
- `snake.js`
- `README.md`

(If this repo uses a different structure, adapt paths but keep the same logical separation.)

---

## Milestone 0 — Scaffold + Baseline UI
### Goals
- Add the page and basic layout (canvas + HUD + buttons).
- Responsive layout for mobile.
- No gameplay yet (can show an idle “Press Start” message).

### Requirements
- Canvas centered with a container.
- HUD: Score, Best, Status, Speed label.
- Buttons: Start, Pause, Restart.
- Mobile area reserved for D-pad (even if not wired yet).
- `README.md` with how to run locally.

### Checklist
- [ ] Page loads with no console errors
- [ ] Canvas visible and scales on mobile
- [ ] Buttons visible and clickable (no action needed yet)

---

## Milestone 1 — Core Game State + Deterministic Step Loop
### Goals
- Implement state model for snake/food/score.
- Implement a tick-based loop (rAF + accumulator or setInterval).
- Implement a `step()` function that moves the snake each tick.

### Requirements
- Grid-based coordinates (e.g., 20x20 default).
- Snake starts length 3 near center, moving right.
- Render snake blocks on canvas.
- Start button begins the loop.
- Restart resets state.

### Checklist
- [ ] Snake moves one cell per tick
- [ ] Restart always resets to the same initial state
- [ ] No visible stutter on desktop or mobile

---

## Milestone 2 — Food Spawn + Growth + Scoring
### Goals
- Add food spawning on empty cells.
- Eating food increases score and grows snake by 1.
- Persist best score in `localStorage`.

### Requirements
- Food must never spawn on snake.
- Growth behavior: on eating, do not remove tail that tick.
- HUD updates live.

### Checklist
- [ ] Food appears and is reachable
- [ ] Eating food grows snake exactly by 1 segment
- [ ] Score increments correctly
- [ ] Best score persists after refresh

---

## Milestone 3 — Collision + Game Over + Status UX
### Goals
- Add wall collision and self collision.
- Show game over state and stop movement.
- Clean restart from game over.

### Requirements
- Classic mode: hitting wall ends game (no wrap).
- Self collision ends game.
- Status text: “Running / Paused / Game Over”.
- After game over, Start should restart (or switch to Restart).

### Checklist
- [ ] Wall collision triggers game over reliably
- [ ] Self collision triggers game over reliably
- [ ] Controls behave sensibly after game over

---

## Milestone 4 — Keyboard Controls + Input Buffering + No Reverse
### Goals
- Add keyboard controls: arrows + WASD.
- Prevent 180° reversal.
- Buffer at most one direction change per tick (avoids double-turn glitches).

### Requirements
- Space toggles pause/resume.
- R restarts.
- Prevent arrow keys from scrolling the page while game is focused/running.

### Checklist
- [ ] No reverse-direction bug
- [ ] Rapid key presses don’t break movement
- [ ] Page does not scroll while using arrow keys during play

---

## Milestone 5 — Pause/Resume System (Button + Keyboard)
### Goals
- Implement pause that freezes game state (no steps).
- Render paused overlay text and keep HUD accurate.

### Requirements
- Pause button toggles Pause/Resume label.
- Space key toggles pause.
- Start while paused resumes (or keep consistent behavior).

### Checklist
- [ ] Pausing stops movement instantly
- [ ] Resuming continues smoothly
- [ ] No “fast-forward” after resume

---

## Milestone 6 — Mobile Touch D-pad Controls + Scroll Prevention
### Goals
- Wire up on-screen D-pad (Up/Down/Left/Right).
- Ensure touch does not scroll the page.
- Make controls thumb-friendly.

### Requirements
- D-pad buttons use `pointerdown` (or touchstart) for responsiveness.
- Add CSS `touch-action: none` where appropriate.
- Taps should feel instant and reliable.

### Checklist
- [ ] D-pad controls snake direction correctly
- [ ] No accidental page scrolling while using controls
- [ ] Buttons are usable on small screens

---

## Milestone 7 — Optional Swipe Controls (Mobile)
### Goals
- Add swipe gestures on the canvas container as an alternative input.

### Requirements
- Detect directional swipe (min distance threshold).
- Don’t interfere with D-pad; both can coexist.
- Must not scroll the page during swipes.

### Checklist
- [ ] Swiping changes direction correctly
- [ ] Light swipes don’t misfire
- [ ] Page doesn’t scroll during swipe play

---

## Milestone 8 — Rendering Polish (Crisp Pixels + Nice Shapes)
### Goals
- Improve visuals while staying lightweight.
- Keep rendering crisp (no blurry scaling).

### Requirements
- Compute integer `cellSize`.
- Draw snake with slight rounding or clear blocks.
- Differentiate head (subtle).
- Draw food as a circle or distinct marker.
- Optional faint grid lines.

### Checklist
- [ ] Looks sharp on retina + non-retina
- [ ] Snake and food clearly visible
- [ ] No jitter or tearing during movement

---

## Milestone 9 — Speed Control + Difficulty Curve (Optional but recommended)
### Goals
- Add speed presets: Slow / Normal / Fast (or slider).
- Optionally increase speed every N foods.

### Requirements
- Speed displayed in HUD.
- Changing speed works during idle and during play (define consistent rules).
- Persist last chosen speed in `localStorage` (optional).

### Checklist
- [ ] Speed changes actually affect tick rate
- [ ] No instability when changing speed

---

## Milestone 10 — Robust Edge Cases + “Win” Condition
### Goals
- Ensure food spawn logic works even when snake is large.
- Add a win state if snake fills the grid (optional but nice).

### Requirements
- Food spawn chooses from available empty cells list (avoid infinite loops).
- If no empty cells remain: end game with “You Win”.

### Checklist
- [ ] No hang when snake is very large
- [ ] Win condition works (manually test by shrinking grid)

---

## Milestone 11 — Final QA + Documentation
### Goals
- Tighten code organization and comments.
- Ensure consistent behavior across devices.
- Update README with controls and features.

### Requirements
- `README.md` includes:
  - How to run
  - Controls (keyboard + touch)
  - Settings (grid size / speed)
- Remove dead code, ensure no console warnings.

### Checklist
- [ ] ESLint not required, but code is clean and consistent
- [ ] No console errors
- [ ] All prior milestone checklists still pass

---

## Definition of Done
- Snake game works on iPhone touch-only and desktop keyboard.
- Reliable tick loop, buffered input, no reverse turns.
- Food/growth/score/best score all correct.
- Pause/restart robust.
- No page scrolling during play.
- Polished visuals and clean code structure.
