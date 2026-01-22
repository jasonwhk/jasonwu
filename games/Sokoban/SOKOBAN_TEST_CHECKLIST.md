# ✅ Sokoban Web Game — Test Checklist

This document defines the validation checklist for a **client-side Sokoban (倉庫番) web game** implementation.

It is intended for:
- Manual QA
- Agent validation
- Regression testing
- Future automation reference

---

## 1. Environment & Load Tests

### 1.1 Page Load
- [ ] Page loads without console errors
- [ ] No external network requests required
- [ ] Game renders immediately on load
- [ ] Game works offline

### 1.2 Browser Compatibility
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

---

## 2. Rendering & Layout

### 2.1 Grid Rendering
- [ ] Grid dimensions match level definition
- [ ] All rows have consistent column counts
- [ ] No overlapping tiles
- [ ] Grid remains stable during gameplay

### 2.2 Tile Mapping

| Symbol | Meaning |
|------|--------|
| `#` | Wall |
| ` ` | Empty floor |
| `.` | Target |
| `$` | Box |
| `*` | Box on target |
| `@` | Player |
| `+` | Player on target |

- [ ] Each symbol renders correctly
- [ ] Targets remain visible under player/box
- [ ] Player and box visuals are distinct

---

## 3. Input Handling

### 3.1 Keyboard Controls
- [ ] ArrowUp moves player up
- [ ] ArrowDown moves player down
- [ ] ArrowLeft moves player left
- [ ] ArrowRight moves player right

### 3.2 Invalid Input
- [ ] Non-arrow keys are ignored
- [ ] Holding keys does not break gameplay
- [ ] Rapid key presses handled correctly

---

## 4. Movement Rules

### 4.1 Player Movement
- [ ] Player moves onto empty floor
- [ ] Player moves onto target tile
- [ ] Player cannot move into walls

### 4.2 Box Pushing
- [ ] Player can push exactly one box
- [ ] Player cannot push two boxes
- [ ] Player cannot push box into wall
- [ ] Player cannot push box out of bounds

### 4.3 Target State Preservation
- [ ] Player leaving target restores `.`
- [ ] Box leaving target restores `.`
- [ ] Box pushed onto target becomes `*`
- [ ] Player on target becomes `+`

---

## 5. Edge Cases & Safety

### 5.1 Boundaries
- [ ] No out-of-bounds errors
- [ ] Edge movement is safely blocked

### 5.2 Deadlocks
- [ ] Game allows deadlock creation
- [ ] Game does not auto-reset
- [ ] No crashes after failed push

---

## 6. Win Condition

### 6.1 Detection
- [ ] Win check occurs after every move
- [ ] Win only triggers when all targets are filled
- [ ] No false positives

### 6.2 Completion Feedback
- [ ] Visual or modal confirmation appears
- [ ] Confirmation triggers only once
- [ ] Game remains stable after win

---

## 7. State Integrity

### 7.1 Grid Consistency
- [ ] Exactly one player exists
- [ ] No duplicated boxes
- [ ] No missing targets

### 7.2 Reload Behavior
- [ ] Page reload resets to initial state
- [ ] Initial grid matches level definition

---

## 8. Performance

### 8.1 Responsiveness
- [ ] Moves feel instantaneous
- [ ] No flicker during redraw
- [ ] No memory growth over time

---

## 9. Code Quality Review

### 9.1 Structure
- [ ] Game logic separated from rendering
- [ ] No DOM logic inside rule engine
- [ ] Functions have single responsibility

### 9.2 Maintainability
- [ ] Levels are easy to modify
- [ ] No duplicated logic
- [ ] Clear variable and function naming

---

## 10. Acceptance Tests (Must-Pass)

### 10.1 Playthrough
- [ ] Default level is solvable
- [ ] Rules behave as expected
- [ ] Win condition triggers correctly

### 10.2 Regression
- [ ] Replay works consistently
- [ ] No input lock after win

---

## 11. Optional Features (If Implemented)

### 11.1 Undo
- [ ] Undo restores exact previous state
- [ ] Multiple undo steps work
- [ ] Target states preserved on undo

### 11.2 Multiple Levels
- [ ] Level switching resets state correctly
- [ ] Progression behaves correctly

---

## 12. Final Validation Criteria

The implementation is **VALID** if:

- ✅ All checks in Sections 1–6 pass  
- ✅ No crashes or rule violations occur  
- ✅ Gameplay matches standard Sokoban mechanics  

---

**File version:** 1.0  
**Last updated:** YYYY-MM-DD