# 🎲 Family Dice

A tiny touch-first dice roller (1–20) designed for iPhone Safari/Chrome. Runs fully client-side and works as a static page on GitHub Pages.

## Use

- Open: `/games/dice/`
- Tap the dice face to roll.
- Or tap the large **ROLL** button.
- Switch between **Numbers** and **Dots**.
- Set **Max** from 1 to 20.

Settings persist in `localStorage` (`mode`, `max`, last result, and the last 5 rolls).

## Dots mode

- If `Max ≤ 6` and the rolled value is `≤ 6`, it shows standard die pips.
- Otherwise it falls back to showing the number for clarity.

## Link it from the homepage / games list

This widget lives at:

- `/games/dice/`

Add a card/link to `games/index.html`:

- `<a href="/games/dice/" class="item-card">…</a>`

