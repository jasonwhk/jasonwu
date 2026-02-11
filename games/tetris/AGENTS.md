🎮 AGENTS.md — Tetris (Classic Edition)

🎯 Objective

Recreate the classic 1984 Tetris game with:
	•	10 × 20 board
	•	7 standard tetrominoes (I, O, T, S, Z, J, L)
	•	Line clearing
	•	Scoring system
	•	Increasing difficulty (level progression)
	•	Keyboard controls
	•	Mobile touch controls
	•	Local high score persistence
	•	Smooth animation (60 FPS)

This version must feel authentic, responsive, and polished.

⸻

🧠 Technical Requirements

Stack
	•	HTML5
	•	CSS3
	•	Vanilla JavaScript (ES6+)
	•	<canvas> for rendering
	•	No frameworks
	•	No build tools
	•	Must run on GitHub Pages

⸻

📁 File Structure

tetris/
│
├── index.html
├── style.css
├── main.js
├── game/
│   ├── board.js
│   ├── piece.js
│   ├── bag.js
│   ├── collision.js
│   ├── scoring.js
│   ├── input.js
│   └── constants.js
│
└── assets/
    └── sounds/ (optional)

Keep game logic separated from rendering logic.

⸻

🎮 Game Specifications

Board
	•	Width: 10 cells
	•	Height: 20 visible rows
	•	Hidden rows: 2 (for spawn)

Cell size:
	•	Desktop: 30px
	•	Mobile: auto-scale to fit screen

⸻

🎲 Tetrominoes

Include all 7:
	•	I
	•	O
	•	T
	•	S
	•	Z
	•	J
	•	L

Use standard Super Rotation System (SRS) wall kicks.

⸻

🎰 Randomizer

Implement modern 7-bag system:
	1.	Shuffle all 7 pieces
	2.	Deal them one by one
	3.	When empty → reshuffle

No pure random.

⸻

🎯 Controls

Desktop
	•	⬅ Move left
	•	➡ Move right
	•	⬇ Soft drop
	•	⬆ Rotate clockwise
	•	Z Rotate counterclockwise
	•	Space Hard drop
	•	C Hold piece
	•	P Pause

Mobile
	•	Tap left/right side → move
	•	Swipe down → hard drop
	•	Tap center → rotate
	•	Long press → hold

⸻

🔁 Core Game Loop

Use requestAnimationFrame.

Game state update must be time-based, not frame-based.

Example:

deltaTime = now - lastTime
dropCounter += deltaTime

if (dropCounter > dropInterval) {
    dropPiece()
    dropCounter = 0
}


⸻

📈 Scoring System

Classic scoring:

Action	Points
Single	100 × level
Double	300 × level
Triple	500 × level
Tetris (4)	800 × level
Soft Drop	1 per cell
Hard Drop	2 per cell

Level increases every 10 cleared lines.

Drop speed increases per level.

⸻

🧩 Features

Required
	•	Ghost piece (projection)
	•	Next piece preview (show next 3)
	•	Hold piece system
	•	Line clear animation
	•	Game over screen
	•	Restart button
	•	Pause system

⸻

🎨 Rendering

Use canvas grid rendering.

Each piece should have distinct color:
	•	I: cyan
	•	O: yellow
	•	T: purple
	•	S: green
	•	Z: red
	•	J: blue
	•	L: orange

Add:
	•	Subtle glow
	•	Grid lines (low opacity)
	•	Smooth hard drop animation

⸻

💾 Persistence

Use localStorage:
	•	High score
	•	Last selected theme

⸻

🔊 Optional (Phase 2)
	•	Sound effects (rotate, drop, clear)
	•	Background music
	•	Theme selector (retro / modern / neon)
	•	Particle line clear effect

⸻

🧱 Architecture Rules
	1.	Board logic must not depend on rendering.
	2.	Piece rotation logic isolated.
	3.	No global state except game object.
	4.	Functions must be pure where possible.
	5.	All constants stored in constants.js.

⸻

🧪 Testing Checklist
	•	No overlapping blocks
	•	Rotation near walls works
	•	Wall kicks correct
	•	No infinite spins
	•	Proper game over detection
	•	Lines clear correctly
	•	Speed increases properly
	•	No piece skips rows at high level

⸻

🚀 Performance
	•	Must run at 60 FPS
	•	No unnecessary redraws
	•	Efficient collision detection
	•	Avoid deep cloning objects

⸻

🎮 UX Polish
	•	Smooth fade in game over
	•	Animated score increment
	•	Slight screen shake on Tetris
	•	Responsive layout

⸻

🏁 Completion Criteria

The game is considered complete when:
	•	It plays identically to classic Tetris
	•	No gameplay bugs remain
	•	Controls feel responsive
	•	High score persists
	•	Works on desktop + mobile
	•	Clean code structure
	•	Ready for GitHub Pages deployment

⸻

🔮 Future Extensions
	•	Multiplayer
	•	Online leaderboard
	•	AI autoplay mode
	•	Speedrun timer
	•	Marathon mode
	•	Zen mode

