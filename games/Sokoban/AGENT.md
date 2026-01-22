# Sokoban Level Design Notes (for agents)

These notes capture the level-design intent for this project’s built-in `LEVELS` (in `games/Sokoban/sokoban.js`).
They are based on Mic’s “How to build a good Sokoban level?” guidance:
`https://www.games4brains.de/sokoban-leveldesign.php`

## Core Invariants (must always hold)

- Levels are ASCII grids with equal-length rows.
- Exactly one player exists (`@` or `+`).
- Number of boxes equals number of targets (count `$` + `*` equals count `.` + `*` + `+`).
- Targets are never “lost” (engine relies on `.`, `*`, `+` semantics).
- Avoid obvious deadlocks in the initial position (e.g., a box in a non-goal corner).

## Design Principles (what “good” means here)

- **Condense the layout**: remove unnecessary empty space; keep puzzles “tight”.
- **Readable planning**: obstacles should be manageable; avoid overly symmetric “guessing” setups.
- **Goal-area focus** (“goal area method”): design the goal/target region so boxes must be placed in a meaningful order.
- **Interesting constraints**: use walls/doors/one-tile corridors deliberately to create sequencing (without turning it into trial-and-error).
- **Avoid routine**: vary patterns across levels; don’t repeat the same motif every time.
- **Iterate by playtesting**: refine by repeatedly testing, then tightening/moving elements closer.

## Project-Specific Level Set Targets

- Provide at least 10 levels with gradually increasing difficulty.
- Keep layouts compact enough to render nicely on the page (current set uses 10 rows × 12 columns).
- Prefer levels that are not “one push to win” and not trivially reversible.
- Difficulty is treated qualitatively; a rough proxy is “minimum pushes” (used during internal validation to avoid too-simple levels).

## Validation Expectations

When editing or adding levels:

- Validate invariants (rectangular grid, 1 player, boxes == goals).
- Validate solvability (at minimum: manual solve; ideally: run/maintain a small solver check during development).
- Sanity-check that difficulty isn’t wildly inconsistent (no accidental “free” solutions, no accidental unsolvable states).

