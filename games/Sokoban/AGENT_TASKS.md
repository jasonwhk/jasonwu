# Codex Tasks — Sokoban Enhancements

Context:
- You are modifying an existing, working Sokoban web game.
- Do NOT rewrite from scratch.
- Preserve all existing behavior unless explicitly changed below.

Complete ALL tasks in order.

[LEVELS]
- [ ] Define a levels array with at least 10 Sokoban levels (ASCII format).
- [ ] Add currentLevelIndex state.
- [ ] Load level 0 on initial page load.
- [ ] Reset undo history and move counter when loading a level.

[RESET]
- [ ] Add a Reset button.
- [ ] Reset reloads the current level from its original template.
- [ ] Reset clears undo history and move counter.

[UNDO]
- [ ] Implement single-step undo.
- [ ] Store deep copies of grid state before each successful move.
- [ ] Undo restores exact previous grid state.
- [ ] Disable Undo button when no undo steps exist.

[LEVEL NAVIGATION]
- [ ] Add Next and Previous buttons OR a level selector.
- [ ] Disable navigation at first/last level OR wrap consistently.
- [ ] Display current level number and total level count.

[MOVE COUNT]
- [ ] Increment move counter only on successful moves.
- [ ] Reset move counter on reset or level change.

[MOBILE INPUT]
- [ ] Implement swipe gestures OR an on-screen D-pad.
- [ ] Use the same move(dx,dy) logic as keyboard input.
- [ ] Prevent diagonal or accidental moves.

[KEYBOARD SCROLL PREVENTION]
- [ ] Make the game container focusable (tabindex).
- [ ] Prevent page scrolling on arrow keys while game is focused.
- [ ] Do not block scrolling outside the game.

[VALIDATION]
- [ ] No console errors.
- [ ] Default level still solvable.
- [ ] All new features work on desktop and mobile.

Final instruction:
- Do not stop early.
- Complete every checklist item before responding.
- Output full updated code for all modified files.