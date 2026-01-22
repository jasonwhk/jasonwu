# Sokoban (倉庫番) Web Game — Technical Specification

## 1. Overview

This document specifies the requirements for implementing a classic Sokoban (倉庫番) puzzle game as a fully client-side web feature.

The specification is intended to be:
- Directly consumable by a coding agent
- Framework-agnostic
- Validated using SOKOBAN_TEST_CHECKLIST.md

---

## 2. Goals and Non-Goals

### Goals
- Implement a playable Sokoban game in the browser
- Follow standard Sokoban mechanics exactly
- Keep code simple, readable, and extensible
- Require no backend, build step, or external libraries

### Non-Goals
- Multiplayer support
- Server-side state
- User authentication
- Persistent progress storage

---

## 3. Target Environment

- Platform: Modern web browsers
- Languages: HTML5, CSS3, JavaScript (ES6+)
- Frameworks: None
- Build tools: None
- Network access: Not required

---

## 4. Functional Requirements

### Core Gameplay
- Display a 2D grid-based puzzle
- Allow player movement via arrow keys
- Allow pushing exactly one box at a time
- Prevent illegal moves (walls, stacked boxes)

### Win Condition
- A level is complete when all target tiles are occupied by boxes
- A completion message must be shown once per level

---

## 5. Level Representation

Levels must use ASCII encoding.

Symbols and meanings:
- `#` Wall
- ` ` Empty floor
- `.` Target
- `$` Box
- `@` Player
- `*` Box on target
- `+` Player on target

Example level:

Levels must be defined as an array of strings.
All rows must have equal length.

#.@  #
#.$$ #
#..  #

---

## 6. Game State Model

The game state must contain:
- grid: a 2D array of characters
- rows: number of rows
- cols: number of columns

Rules:
- The grid is mutable and reflects the current state
- Exactly one player must exist at all times
- The grid must remain rectangular

---

## 7. Architecture

The implementation must logically separate the following concerns:
- Game state management
- Rendering
- Input handling
- Movement rules
- Win detection

This separation may exist within a single file but must be clear in code structure.

---

## 8. Rendering Requirements

- Use CSS Grid or equivalent layout
- Each tile must map to a semantic CSS class:
  - wall
  - floor
  - target
  - box
  - player
- Rendering must be stateless and derived entirely from the grid

---

## 9. Input Handling

Supported inputs:
- ArrowUp
- ArrowDown
- ArrowLeft
- ArrowRight

Rules:
- Ignore all other keys
- Invalid input must not affect game state
- Rapid key presses must not break gameplay

---

## 10. Movement Rules

### Player Movement
The player may move if the target tile is:
- Empty floor
- Target

### Box Pushing
The player may push a box if:
- The adjacent tile contains a box
- The tile beyond the box is empty floor or target

### State Transitions
- Player leaving a target restores a target
- Player leaving floor restores floor
- Box moved onto a target becomes box-on-target
- Player on a target becomes player-on-target

Target information must never be lost.

---

## 11. Win Detection

- Win detection must run after every successful move
- A level is complete when no target tiles remain uncovered
- Win detection must not modify the game state

---

## 12. Error Handling and Safety

- Prevent out-of-bounds access
- Ignore invalid moves silently
- The game must never crash during normal play

---

## 13. Performance Requirements

- Input-to-render latency must feel instantaneous
- Full grid redraw per move is acceptable
- No memory growth during extended play

---

## 14. File Structure

Recommended structure:

- index.html
- style.css
- sokoban.js

Alternatively, a single self-contained HTML file is acceptable.

---

## 15. Optional Extensions (Out of Scope)

The following are explicitly out of scope:
- Undo or redo
- Multiple levels
- Touch controls
- Animations
- Level editor
- Persistent storage

---

## 16. Acceptance Criteria

The implementation is accepted if:
- All Sokoban rules are implemented correctly
- All tests in SOKOBAN_TEST_CHECKLIST.md pass
- The game is playable immediately in a browser
- The code is readable and easy to extend

---

Document version: 1.0  
Last updated: YYYY-MM-DD