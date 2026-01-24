# agent.md — Save the Rocket! (ADHD-friendly Number Rush)
A touch-first, kid-friendly web game for iPhone that builds number recognition + gentle number speaking, with dopamine-friendly loops (countdown → action → reward → streak) and a smooth parent-controlled exit (“Landing sequence”).

## Product goals
- Make number practice feel like an arcade game, not homework.
- Encourage speaking numbers without forcing it (tap always works; speaking gets bonus effects).
- Keep sessions short and satisfying; avoid tantrum triggers.
- Provide a smooth, story-based exit that stops urgency immediately and ends with closure.

## Non-goals
- No speech recognition requirement (optional later).
- No accounts / logins / cloud saves.
- No ads, no external trackers.

## Target platform
- Mobile Safari (iPhone), touch-only first.
- Also works on desktop.

## Tech stack (recommended)
- Vanilla HTML/CSS/JS (ES modules)
- Canvas 2D for visuals (rocket, particles, stars)
- WebAudio API for tick + reward sounds (fallback to HTML audio)
- Optional: Service Worker for offline + instant load (later milestone)

## Core loop (5–12s per round)
1. Show a big number (center).
2. Countdown ring drains (with ticking).
3. Player taps **FUEL!** (or the number) to succeed.
4. Rocket boosts + confetti + reward sound.
5. Streak increments; next number after a short cool-down.

## ADHD-friendly dopamine principles (must-haves)
- Variable reward cosmetics (random trails, meteor shower, sticker burst).
- Streaks don’t hard reset on failure (pause/soft drop only).
- Frequent small wins, short rounds.
- No “Game Over”. Only “Try again” with positive feedback.
- 90-second default mission length with a clear end screen.

## Smooth exit requirements (parent)
- A parent-only control triggers a **Landing sequence**:
  - Stops ticking immediately (no urgency sound).
  - Rocket goes to autopilot, gentle animation (3s).
  - Shows “Mission complete” summary.
  - Offers: “Play again” (kid) + “Exit” (parent gated).
- Parent exit control must be hard to trigger accidentally:
  - Long-press 1s to reveal parent bar OR “hold top-right corner 2s”.

---

# Milestones

## Milestone 0 — Repo + scaffold + mobile safety
**Deliverables**
- `/tools/rocket/` with:
  - `index.html`, `styles.css`, `main.js`
  - `game/` modules: `state.js`, `render.js`, `audio.js`, `input.js`, `ui.js`, `rng.js`
- Fullscreen layout optimized for iPhone.
- Prevent scroll, pinch-zoom issues during gameplay.

**Acceptance criteria**
- Loads locally and on GitHub Pages/Vercel.
- Touch input works; page doesn’t scroll while playing.
- A “Start Mission” screen exists.

**Implementation notes**
- Use `touch-action: none;` on game container.
- Add `meta viewport` with `user-scalable=no` (optional; be careful).
- Use requestAnimationFrame loop.

---

## Milestone 1 — Basic gameplay loop (number + countdown + success)
**Deliverables**
- Game states: `MENU`, `COUNTDOWN`, `SUCCESS`, `MISS`, `SUMMARY`, `PAUSED`, `LANDING`
- Countdown ring visual (canvas or SVG).
- Ticking sound during countdown only.
- Tap **FUEL!** or number to succeed.

**Rules**
- Countdown default 4.5s.
- Success triggers rocket boost animation.
- Miss triggers friendly “Oops! Try again!” (no harsh feedback) and immediately proceeds.

**Acceptance criteria**
- Round runs end-to-end repeatedly for 90 seconds mission.
- Miss does not end the game.
- Timer stops on pause and landing.

---

## Milestone 2 — Dopamine rewards + streak system (soft failure)
**Deliverables**
- Streak counter UI: `x1 … x5`
- Reward tiers:
  - x1: small boost + sparkle
  - x2: bigger boost + extra particles
  - x3: meteor shower
  - x4: rainbow trail
  - x5: sticker burst + “SUPER LAUNCH!”
- Variable cosmetic reward after each success (choose from a pool).

**Soft failure design**
- On miss: streak “freezes” for next round (no reset), or decreases by 1 max.
- Success resumes streak growth.

**Acceptance criteria**
- Streak never drops to 0 instantly unless mission ends.
- Rewards feel immediately different each tier.
- Audio never gets louder on miss; only softer.

---

## Milestone 3 — Speaking-optional scoring (no speech recognition)
**Deliverables**
- Add a “Speak bonus” mechanic without forcing it:
  - Base success = tap (always)
  - Optional: parent taps “✅ Heard it!” within 2 seconds after success to grant bonus
- Bonus gives: +1 “Star” currency and a special trail.

**UI**
- A small “Heard it!” button appears after success for 2 seconds (parent-only gated option available too).

**Acceptance criteria**
- Game fully playable without “Heard it!”
- When “Heard it!” used, reward is clearly stronger.

---

## Milestone 4 — Number generation + difficulty ramps
**Deliverables**
- Number range modes:
  - Easy: 1–20
  - Normal: 1–100
  - Big: 1–200 (or 1–999 later)
- “Tricky teens” weighting toggle (13, 15, 18, etc.)
- Adaptive ramp:
  - If 5 successes in a row → slightly faster countdown (min 3.2s)
  - If repeated misses → slower countdown (max 6.0s)

**Acceptance criteria**
- Numbers match selected range.
- Countdown adjusts smoothly, never abruptly.

---

## Milestone 5 — Smooth exit: Landing sequence + parent gate
**Deliverables**
- Parent gate to show controls:
  - Hold top-right corner for 2s OR long-press 1s to reveal parent bar
- Parent bar actions:
  - Pause
  - Land & Exit (hold 1s)
  - Settings
- Landing sequence:
  - Immediately stops ticking and urgency visuals
  - Rocket animates to “return to base” for ~3s
  - Summary screen appears with:
    - Rockets fueled
    - Best streak
    - Stars earned
  - From summary:
    - “Play again” (kid) starts a new mission
    - “Exit” requires parent gate again

**Acceptance criteria**
- Landing always works from any game state.
- No abrupt stop; no ticking after landing is triggered.
- Accidental taps cannot exit.

---

## Milestone 6 — Polish: feel, feedback, accessibility, and calm
**Deliverables**
- Gentle “cool-down” between rounds (0.8s) with subtle breathing animation.
- Settings:
  - Sound: ticks on/off, volume
  - Visual intensity: low/med/high
  - Mission length: 60/90/120 seconds
  - Number range + tricky teens toggle
- Accessibility:
  - Large fonts, high contrast option
  - Reduced motion option

**Acceptance criteria**
- Game feels smooth at 60fps on iPhone.
- Settings persist via `localStorage`.
- Reduced motion disables heavy particle spam.

---

## Milestone 7 — Offline + instant launch (optional)
**Deliverables**
- Service Worker caching static assets.
- “Add to Home Screen” friendly behavior.

**Acceptance criteria**
- Game loads offline after first visit.
- No caching bugs, no stale broken versions.

---

# Test checklist
## Functional
- Start mission → rounds run → summary appears at mission end.
- Tap success works every round.
- Miss never ends mission; continues smoothly.
- Pause freezes countdown + audio.
- Landing stops ticking immediately, transitions to summary.

## UX
- No page scroll while playing.
- Buttons are reachable with one hand.
- No tiny close buttons accessible to kids.

## Performance
- Stable 60fps typical.
- Audio doesn’t glitch on rapid taps.

## Safety / Parent control
- Exit requires parent gate.
- Landing works from MENU/COUNTDOWN/SUCCESS/MISS/SUMMARY/PAUSED.

---

# File layout (suggested)
tools/rocket/
  index.html
  styles.css
  main.js
  game/
    state.js
    ui.js
    input.js
    render.js
    audio.js
    rng.js
    numbers.js
    storage.js
  assets/
    sfx/
    img/

---

# Definition of Done
- Touch-first, fun, rewarding.
- Speaking encouraged but never required.
- Short missions with clear closure.
- Smooth landing exit that prevents “one more!” loops.
- Ready to host as a standalone tool page.