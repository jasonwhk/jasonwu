# agent.md — Family Meditation Page (Breathing + Rainbow Painting)

## Mission
Build a touch-first, family-friendly meditation webpage with two calming activities:
1) **Rainbow Breathing** — guided inhale/hold/exhale with a center orb that expands/contracts and advances through rainbow colors.
2) **Paint the Rainbow** — breathing drives a watercolor-like rainbow painting that fills in smoothly over a set number of breaths.

The page must feel cozy, playful, and minimal: one-tap start, full-screen focus, no reading required.

---

## Non-goals
- No accounts, login, cloud sync, or server backend.
- No complex analytics, tracking, or ads.
- No heavy 3rd-party animation engines unless truly needed.

---

## Target Platforms
- iPhone Safari (primary)
- iPad Safari
- Desktop Chrome/Safari/Firefox
- Optional: TV browser (nice-to-have)

---

## Core UX Principles
- **Touch-first**: big hit targets, no tiny controls
- **Low cognitive load**: after start, UI fades out
- **Kid-friendly**: icon cues, no reading required
- **Accessible**: motion + sound toggles, reduced-motion support
- **Fast**: loads instantly, runs smoothly at 60fps on mobile

---

## Tech Stack (Recommended)
- Vanilla HTML/CSS/JS + Canvas 2D (or OffscreenCanvas if supported)
- Web Audio API for optional gentle chimes/ambience (no autoplay—requires user gesture)
- No frameworks required

---

## Folder Layout
- `index.html`
- `styles.css`
- `src/`
  - `main.js`
  - `state.js`
  - `modes/`
    - `rainbowBreathing.js`
    - `paintRainbow.js`
  - `ui/`
    - `hud.js`
    - `toggles.js`
    - `icons.js`
  - `audio/`
    - `audio.js`
    - `chimeSynth.js`
  - `utils/`
    - `raf.js`
    - `easing.js`
    - `colors.js`
    - `fitCanvas.js`
- `assets/` (optional, keep light)
- `README.md`

---

## Definitions
### Breathing phases
- Inhale: default 4.0s
- Hold: default 2.0s
- Exhale: default 5.0s
- Optional “rest”: 0–1.0s (off by default)

### Presets (icons only)
- Short: 1 rainbow cycle (≈ 1 min)
- Medium: 7 breath cycles (one full rainbow)
- Free: continuous until user stops

### Modes
- `RAINBOW_BREATHING`
- `PAINT_RAINBOW`

---

## Milestones

### Milestone 0 — Scaffold & Fullscreen Canvas
**Goal:** A clean, responsive full-screen page with an animation loop.
**Deliverables:**
- `index.html` with a single canvas + minimal HUD layer
- Resize handling (devicePixelRatio aware) via `fitCanvas.js`
- Render loop with delta time
- “Tap to Start” overlay (required for enabling audio later)
**Acceptance checklist:**
- Works on iPhone Safari; canvas fits without scrolling
- Orientation changes don’t break layout
- 60fps feels smooth

---

### Milestone 1 — Minimal HUD & Input Model
**Goal:** Build touch controls that can disappear during meditation.
**HUD elements (icons, not text-heavy):**
- Mode switch: 🌬️ / 🌈
- Duration preset: 🟡 / 🌈 / ⭐
- Toggles: 🔇/🔊, 🌀/🚫 (reduced motion)
- Pause: ⏸ (two-finger tap also)
**Input:**
- Tap (start/confirm)
- Two-finger tap (pause/resume)
- Long-press (open HUD) optional
**Acceptance checklist:**
- HUD fades out after 3s of inactivity
- Any tap brings HUD back briefly
- Buttons are easy to hit with a thumb

---

### Milestone 2 — Rainbow Breathing Mode (Core Animation)
**Goal:** Guided breathing orb that expands/contracts with smooth easing.
**Visual:**
- Center orb (soft blob / circle) with subtle glow
- Expansion = inhale, contraction = exhale
- Color advances across rainbow each cycle
**Logic:**
- Breath state machine: inhale → hold → exhale → (optional rest)
- Progress bar is implicit (orb animation), no numbers required
**Acceptance checklist:**
- Breath timing matches defaults
- Transitions are smooth (no jumps)
- Color changes at the start of inhale (or at full exhale—choose one and keep consistent)
- Pause/resume resumes the exact phase smoothly

---

### Milestone 3 — Paint the Rainbow Mode (Breath-as-Brush)
**Goal:** Breathing drives a watercolor rainbow painting that “rewards calm”.
**Visual:**
- A rainbow arc composed of 7 color bands
- Each breath cycle fills one band (or gradually fills all bands across cycles)
- Calm breathing → smooth edges; jittery breathing → slightly messy edges (subtle, not punishing)
**Implementation idea:**
- Use offscreen buffer layers per band
- Brush stroke uses soft alpha + noise texture (procedural)
- Inhale increases brush radius/flow; exhale settles/fades edges
**Acceptance checklist:**
- Painting looks pleasant and soft
- No harsh artifacts or pixelation on mobile
- Completes a “full rainbow” in the medium preset

---

### Milestone 4 — Audio: Gentle Chime + Optional Ambience
**Goal:** Add optional sound that never autoplays.
**Audio cues:**
- Soft chime at phase changes or at color completion
- Optional ambient pad/wind (very subtle)
**Rules:**
- Audio only starts after the first user gesture
- Respect mute toggle
**Acceptance checklist:**
- iOS Safari audio works after tapping Start
- Mute works immediately
- Audio does not clip, is low volume by default

---

### Milestone 5 — Polish: Calm Visual World + Micro-interactions
**Goal:** Make it feel like a “toy you want to return to”.
**Add:**
- Subtle background gradient (day sky → dusk)
- Slow drifting particles (dust/sparkles) that respect reduced motion
- End-of-session moment: rainbow gently dissolves into sparkles
**Acceptance checklist:**
- Reduced motion toggle actually reduces/halts nonessential motion
- No distracting movement (everything should be slow)

---

### Milestone 6 — Accessibility & Quality
**Goal:** Make it robust and inclusive.
**Add:**
- `prefers-reduced-motion` default behavior
- High-contrast mode (optional)
- Prevent page scroll & rubber-banding during interaction
- Clear focus handling on desktop
**Acceptance checklist:**
- No accidental page scroll while interacting
- Motion reduced when OS setting requests it
- Works with mouse on desktop

---

### Milestone 7 — Shipping: README + Deploy
**Goal:** Document and deploy to GitHub Pages.
**Add:**
- `README.md` with usage + controls
- Simple build-free deploy steps
- Performance notes + tested devices list
**Acceptance checklist:**
- Deployed page loads fast
- No console errors
- Easy for future you to extend

---

## Implementation Notes (Important)
- Use a deterministic animation loop:
  - `t += dt;`
  - Never tie phase progression to frame count.
- Store all settings in a single `state` object:
  - `mode`, `preset`, `soundOn`, `reducedMotion`, `phase`, `phaseT`, `cycleCount`
- Keep “session” logic separate from rendering logic.

---

## Test Checklist (Manual)
- iPhone Safari: start, pause, resume, rotate, mute toggle
- iPad Safari: same + split screen (optional)
- Desktop: mouse controls work, no scroll on spacebar/arrows
- Reduced motion OS setting: nonessential motion reduced
- Audio: does not play until first user gesture

---

## Future Extensions (Optional)
- “Cloud Breathing” mode: clouds drift and breathing gently moves them
- Seasonal themes (snow, night sky)
- “Rainbow count” badge (not a score)
- Save last used mode/preset in `localStorage`

---

## How to Work With This Agent (Codex)
When starting a new task, tell Codex:
- Which milestone you are implementing (e.g., “Implement Milestone 2”)
- Target folder (e.g., `tools/family-meditation/`)
- Constraints: touch-first, minimal UI, no frameworks, smooth animation, iOS Safari friendly
- Ask it to run a quick self-check list against the milestone acceptance criteria