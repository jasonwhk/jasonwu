# agent.md — German License Plate Region Finder (Kennzeichen-Ortsschild)

Build a small, mobile-first web tool that lets a user select a German license plate prefix (e.g., **BN**) and then:
1) shows the associated city/region name,
2) zooms/highlights that location on a **Germany map**,
3) optionally offers quick search / favorites.

Target: static site (GitHub Pages / Vercel), client-side only, no backend.

---

## Product goals

### User stories
- As a user, I can pick a prefix like **BN** from a searchable list and instantly see **Bonn** on a Germany map.
- As a user, I can type “bonn” or “bn” and get suggestions quickly.
- As a user on iPhone, the UI is touch-friendly and fast.

### Non-goals (v1)
- No OCR from photos.
- No “guess from full plate string” beyond simple prefix extraction.
- No real-time external API dependency required.

---

## UX requirements
- **Mobile-first** layout.
- Big tap targets (>= 44px).
- Search field at top + list results below.
- When a region is selected:
  - display: prefix, official name(s), state (Bundesland) if available
  - highlight point/area on map, and show a label tooltip/popover

---

## Data approach (important)
Use a **local JSON dataset** in the repo.

### Minimum dataset schema (v1: point-based)
Create `data/plates.de.json`:
```json
[
  {
    "code": "BN",
    "name": "Bonn",
    "state": "Nordrhein-Westfalen",
    "lat": 50.7374,
    "lon": 7.0982
  }
]

Notes:
	•	For “where on the map”, a point marker is acceptable for v1.
	•	Later milestones can add polygons (Kreise) if desired.

⸻

Map approach

Use Leaflet (lightweight, no build step required) with a Germany-focused view.
	•	Base tiles: OpenStreetMap standard tiles.
	•	Default view: Germany centered, zoom ~6.
	•	On selection: flyTo marker, add highlight ring + open popup.

⸻

Repo structure

tools/plate-origin/
  index.html
  styles.css
  app.js
  data/
    plates.de.json
  assets/
    icon.svg (optional)

No framework required; plain HTML/CSS/JS.

⸻

Milestones

Milestone 0 — Project skeleton & quality gates

Deliverables
	•	Folder tools/plate-origin/ with:
	•	index.html, styles.css, app.js
	•	simple header + empty layout slots (search, results list, map container, details panel)
	•	Basic mobile styling (safe-area padding, responsive layout)
	•	Add ESLint/Prettier only if already used in the repo; otherwise keep simple.

Acceptance checklist
	•	Page loads without console errors.
	•	Layout looks OK on iPhone width.

⸻

Milestone 1 — Map rendering (Germany) with Leaflet

Deliverables
	•	Leaflet integrated via CDN
	•	Map shows Germany with OSM tiles
	•	A test marker (hardcoded) to verify marker + popup

Acceptance checklist
	•	Map is interactive (pan/zoom)
	•	Marker renders and popup opens

⸻

Milestone 2 — Local dataset + basic selection

Deliverables
	•	Add data/plates.de.json (start with at least 30–50 common codes for demo)
	•	Load JSON on startup (fetch)
	•	Render list of all codes (alphabetical)
	•	On tap, show details and place marker on map

Acceptance checklist
	•	Selecting “BN” shows “Bonn” and moves marker correctly
	•	Works offline once assets are cached by the browser (no network dependency besides tiles)

⸻

Milestone 3 — Search UX (fast, forgiving)

Deliverables
	•	Search box filters list by:
	•	code prefix (e.g., “b” → BN, B…)
	•	name substring (e.g., “bonn” → BN)
	•	Debounced input (e.g., 80–150ms)
	•	Keyboard UX:
	•	Enter selects first result
	•	Escape clears search

Acceptance checklist
	•	Search feels instant with 1000+ entries
	•	No scrolling glitches on iOS

⸻

Milestone 4 — Map highlighting polish

Deliverables
	•	Animated flyTo on selection
	•	Highlight ring (circle) around marker for 1–2 seconds or persistent until next selection
	•	Popup/tooltip label with code + name
	•	“Reset view” button (back to Germany default)

Acceptance checklist
	•	The selected location is visually obvious
	•	Reset restores default view reliably

⸻

Milestone 5 — “Paste a plate” helper (optional but useful)

Deliverables
	•	Input that accepts a full plate string (e.g., BN-AB 1234)
	•	Extract likely code:
	•	take leading letters up to first non-letter
	•	normalize uppercase, trim spaces
	•	If multiple matches possible (rare): show best match list

Acceptance checklist
	•	bn ab 123 → selects BN
	•	Bad input shows friendly error state

⸻

Milestone 6 — Dataset expansion & maintainability

Deliverables
	•	Expand plates.de.json substantially (goal: complete list)
	•	Add data/README.md explaining format + how to update
	•	Add a tiny validation script (optional):
	•	checks unique code
	•	checks lat/lon range
	•	checks required fields

Acceptance checklist
	•	Dataset loads quickly
	•	No duplicate codes

⸻

Milestone 7 — Nice-to-haves (pick any 2–4)

Choose based on time:
	•	Favorites (star codes, stored in localStorage)
	•	Recent selections
	•	Share link: ?code=BN deep-link loads selection
	•	Light/dark mode
	•	German/English toggle (labels only)

Acceptance checklist
	•	Features work on iPhone Safari/Chrome
	•	No persistent bugs in navigation

⸻

Engineering notes

Performance
	•	Render list with basic DOM optimization:
	•	limit to top N results when searching (e.g., 200)
	•	use document fragments for updates
	•	Keep CSS simple; avoid heavy shadows.

Accessibility
	•	Buttons with aria-labels
	•	Focus states visible
	•	List items reachable with keyboard

Testing (lightweight)
	•	Manual checklist per milestone
	•	Optional: a tiny dataset validation script if you already have node tooling

⸻

Done definition (v1)
	•	User can select a code from list/search and see the place highlighted on a Germany map.
	•	Works smoothly on iPhone.
	•	Dataset is local and easy to update.

⸻

Implementation constraints
	•	Client-side only
	•	No breaking changes to the surrounding site structure
	•	Keep dependencies minimal (Leaflet + OSM tiles)
