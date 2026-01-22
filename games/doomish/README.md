# Doomish (Milestone 1)

Minimal “Doom-ish” browser FPS prototype: 2.5D raycaster, movement + collision, pointer-lock mouse look, minimap.

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
- `M`: toggle minimap
- `Esc`: exit pointer lock

