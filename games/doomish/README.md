# Doomish (Milestone 4)

Minimal “Doom-ish” browser FPS prototype: 2.5D raycaster, movement + collision, pointer-lock mouse look, minimap/HUD,
textured wall rendering, billboard sprites (pickups + dummy enemy), and simple hitscan shooting.

## Run locally
ES modules require an HTTP server (not `file://`).

```bash
cd games/doomish
python3 -m http.server 8000
```

Open `http://localhost:8000/` in a modern browser.

## Controls
- `Click to Play`: enter pointer lock
- `WASD`: move
- `←/→` or `Q/E`: turn
- Mouse: look (pointer lock)
- `Shift`: sprint
- `Left click`: fire (pointer lock)
- `F` / `Ctrl`: fire (keyboard fallback when not pointer locked)
- `M`: toggle minimap
- `R`: cycle resolution scale
- `F3`: toggle debug HUD
- `Esc`: exit pointer lock

## Notes
- Shooting: pistol hitscan stops at the first wall; enemies can be damaged and killed.
- Pickups: walk into `pickup_health` / `pickup_ammo` sprites to collect; HUD shows current health/ammo.
- Sprite assets live in `games/doomish/assets/sprites/` (placeholders).
