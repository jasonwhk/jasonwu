# Sand Clock (Animated Hourglass Timer)

A client-side animated sand clock (hourglass) timer rendered with `<canvas>`.

## How to run

- Open `tools/sand-clock/index.html` in a browser, or serve the repo with any static file server.

Example:

```sh
python3 -m http.server 8000
```

Then visit:

- `http://localhost:8000/tools/sand-clock/`

## Keyboard shortcuts

- `Space` → Start / Pause toggle (prevents page scroll)
- `R` → Reset

## Embed elsewhere

### Option A: Iframe embed (simplest)

```html
<iframe
  src="/tools/sand-clock/index.html"
  title="Sand Clock"
  style="width: 100%; max-width: 980px; height: 720px; border: 0;"
></iframe>
```

### Option B: Copy the folder

Copy `tools/sand-clock/` into your site and link to `index.html`.

