## `TEST_CHECKLIST.md`


# TEST_CHECKLIST.md — Doom-ish Browser FPS

## A. Smoke Tests (Every Change)
- [ ] Page loads with no console errors/warnings that indicate a bug.
- [ ] Game starts from a click (pointer lock available).
- [ ] Rendering shows sky/floor + walls (not black screen).
- [ ] FPS is stable (no massive stutter after 30 seconds).
- [ ] Refreshing the page resets state cleanly.

---

## B. Input & Controls
### Keyboard
- [ ] WASD moves player correctly (forward/back/strafe).
- [ ] Arrow keys rotate (or Q/E rotate if implemented).
- [ ] Holding Shift increases speed (sprint).
- [ ] Space triggers “use” (noop acceptable early).
- [ ] Arrow keys and Space do not scroll the page during gameplay.

### Pointer Lock / Mouse Look
- [ ] Clicking “Play” locks pointer (cursor disappears).
- [ ] Mouse movement rotates view smoothly.
- [ ] Pressing Esc exits pointer lock and returns cursor.
- [ ] Re-clicking “Play” re-enters pointer lock.

### Mobile (if implemented)
- [ ] Touch controls appear and allow movement + looking.
- [ ] Page does not scroll while interacting with controls.

---

## C. Movement & Collision
- [ ] Player cannot walk through walls.
- [ ] Player can slide along walls (no sticky snagging).
- [ ] Diagonal movement speed is not faster than straight movement.
- [ ] Collision is stable at high speed (sprinting into corners).

---

## D. Rendering Correctness
### Walls
- [ ] No fish-eye distortion (walls look consistent when turning).
- [ ] Wall heights scale correctly with distance.
- [ ] Shading/distance fog behaves smoothly.

### Textures (when added)
- [ ] Textures appear on walls with correct orientation.
- [ ] Texture seams are not excessively jittery when moving.
- [ ] Different wall types show different textures.

### Minimap (if present)
- [ ] Minimap toggle works (e.g., M).
- [ ] Player position marker matches world location.
- [ ] Facing direction indicator rotates correctly.

---

## E. Sprites (when added)
- [ ] Sprites scale with distance (bigger when closer).
- [ ] Sprites are correctly occluded by walls.
- [ ] Multiple sprites render in correct depth order.
- [ ] Pickups disappear when collected.

---

## F. Combat (when added)
- [ ] Left click (or key) fires the weapon.
- [ ] Fire rate respects cooldown (no infinite rapid fire).
- [ ] Hitscan does not shoot through walls.
- [ ] Enemies take damage and can die.
- [ ] Ammo decreases (if ammo system enabled).
- [ ] Ammo/health pickups change player stats.

---

## G. Enemy AI (when added)
- [ ] Enemies notice player by proximity and/or LoS.
- [ ] Enemies chase the player and generally don’t get stuck.
- [ ] Enemies attack when in range.
- [ ] Player takes damage and health decreases visibly.
- [ ] Player can die → “Game Over” shown.

---

## H. Levels & Progression (when added)
- [ ] Level JSON loads correctly.
- [ ] Player spawn location and angle are correct.
- [ ] Exit trigger completes level.
- [ ] Next level loads and starts cleanly.
- [ ] Restart level resets entities and player stats correctly.
- [ ] Level select (if present) loads selected level.

---

## I. Performance & Compatibility
- [ ] Runs at ~60 FPS on desktop at default resolution.
- [ ] No memory growth over 2 minutes of play (basic sanity).
- [ ] Works in:
  - [ ] Chrome
  - [ ] Firefox
  - [ ] Safari (macOS/iOS) (best effort)

---

## J. Deployment (GitHub Pages)
- [ ] Works with relative paths when served from `/games/doomish/`.
- [ ] Hard refresh does not break asset loading.
- [ ] No CORS errors.
- [ ] Works over HTTPS on Pages.


⸻