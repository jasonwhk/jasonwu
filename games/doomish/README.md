# Doomish (Milestone 6)

Minimal “Doom-ish” browser FPS prototype: 2.5D raycaster, movement + collision, pointer-lock mouse look, minimap/HUD,
textured wall rendering, billboard sprites (pickups + enemies), hitscan shooting, simple enemy AI + melee combat, and
multi-level progression.

## Game flow
- Start screen → `Play` enters pointer lock and starts Level 1.
- `P` / `Esc` pauses (releases pointer lock) → `Resume` / `Restart Level` / `Quit to Menu`.
- Walk into the `exit` marker to complete the level → `Next Level` / `Restart Level` (or `N` / `R`).
- If you die → `Game Over` → restart or quit to menu.

## Run locally
ES modules require an HTTP server (not `file://`).

```bash
cd games/doomish
python3 -m http.server 8000
```

Open `http://localhost:8000/` in a modern browser.

## Controls
- `Play`: enter pointer lock
- `WASD`: move
- `←/→` or `Q/E`: turn
- Mouse: look (pointer lock)
- `Shift`: sprint
- `Left click`: fire (pointer lock)
- `F` / `Ctrl`: fire (keyboard fallback when not pointer locked)
- `M`: toggle minimap
- `V`: cycle resolution scale
- `R`: restart level
- `N`: next level (on level complete screen)
- `P` / `Esc`: pause / resume
- `F3`: toggle debug HUD

## Notes
- Shooting: pistol hitscan stops at the first wall; enemies can be damaged and killed.
- Pickups: walk into `pickup_health` / `pickup_ammo` sprites to collect; HUD shows current health/ammo.
- Sprite assets live in `games/doomish/assets/sprites/` (placeholders).
- Levels are JSON files under `games/doomish/levels/` (map grid + spawn + entities, including `exit`).
