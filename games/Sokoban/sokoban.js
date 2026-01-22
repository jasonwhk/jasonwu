(() => {
  "use strict";

  const LEVELS = [
    ["#####", "#@  #", "# $ #", "# . #", "#####"],
    ["#######", "#     #", "#  .  #", "#  $  #", "#  @  #", "#     #", "#######"],
    ["#########", "#       #", "#   .   #", "#   $   #", "#   .   #", "#   $ @ #", "#########"],
    ["#########", "#       #", "#   ### #", "# . $ @ #", "#   #   #", "#       #", "#########"],
    ["#########", "#   .   #", "#   $   #", "#   .   #", "#   $   #", "#   @   #", "#########"],
    ["#########", "#       #", "#  @ $ .#", "#       #", "#       #", "#       #", "#########"],
    ["##########", "#        #", "#  @ $$..#", "#        #", "#        #", "#        #", "##########"],
    ["##########", "#        #", "#   ...  #", "#   $$$  #", "#    @   #", "#        #", "##########"],
    ["###########", "#         #", "#    ...  #", "#    $$$  #", "#     @   #", "#         #", "###########"],
    ["###########", "#         #", "#   . .   #", "#   $ $   #", "#    @    #", "#         #", "###########"],
  ];

  function parseLevel(levelRows) {
    if (!Array.isArray(levelRows) || levelRows.length === 0) {
      throw new Error("Level must be a non-empty array of strings.");
    }

    const rows = levelRows.length;
    const cols = levelRows[0].length;
    if (cols === 0) throw new Error("Level rows must be non-empty strings.");

    for (const row of levelRows) {
      if (typeof row !== "string") throw new Error("Level rows must be strings.");
      if (row.length !== cols) throw new Error("All level rows must have equal length.");
    }

    const allowed = new Set(["#", " ", ".", "$", "@", "*", "+"]);
    let playerCount = 0;
    const grid = levelRows.map((row, r) =>
      Array.from(row, (ch, c) => {
        if (!allowed.has(ch)) throw new Error(`Invalid level character '${ch}' at (${r}, ${c}).`);
        if (ch === "@" || ch === "+") playerCount += 1;
        return ch;
      }),
    );

    if (playerCount !== 1) throw new Error(`Level must contain exactly 1 player, found ${playerCount}.`);

    const playerPos = findPlayer(grid);
    if (!playerPos) throw new Error("Player not found.");

    return {
      grid,
      rows,
      cols,
      playerRow: playerPos.row,
      playerCol: playerPos.col,
      hasWon: false,
    };
  }

  function findPlayer(grid) {
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        const ch = grid[r][c];
        if (ch === "@" || ch === "+") return { row: r, col: c };
      }
    }
    return null;
  }

  function isWall(ch) {
    return ch === "#";
  }

  function isBox(ch) {
    return ch === "$" || ch === "*";
  }

  function isTarget(ch) {
    return ch === "." || ch === "*" || ch === "+";
  }

  function isPlayer(ch) {
    return ch === "@" || ch === "+";
  }

  function isWalkable(ch) {
    return ch === " " || ch === ".";
  }

  function inBounds(state, row, col) {
    return row >= 0 && row < state.rows && col >= 0 && col < state.cols;
  }

  function setPlayerCell(ch, onTarget) {
    return onTarget ? "+" : "@";
  }

  function setBoxCell(ch, onTarget) {
    return onTarget ? "*" : "$";
  }

  function clearPlayerCell(ch) {
    if (!isPlayer(ch)) throw new Error("clearPlayerCell called on non-player cell.");
    return ch === "+" ? "." : " ";
  }

  function applyMove(state, dr, dc) {
    const isCardinal =
      (dr === -1 && dc === 0) || (dr === 1 && dc === 0) || (dr === 0 && dc === -1) || (dr === 0 && dc === 1);
    if (!isCardinal) return false;

    const r0 = state.playerRow;
    const c0 = state.playerCol;
    const r1 = r0 + dr;
    const c1 = c0 + dc;
    if (!inBounds(state, r1, c1)) return false;

    const from = state.grid[r0][c0];
    const to = state.grid[r1][c1];
    if (!isPlayer(from)) return false;
    if (isWall(to)) return false;

    if (isWalkable(to)) {
      state.grid[r0][c0] = clearPlayerCell(from);
      state.grid[r1][c1] = setPlayerCell(to, to === ".");
      state.playerRow = r1;
      state.playerCol = c1;
      return true;
    }

    if (isBox(to)) {
      const r2 = r1 + dr;
      const c2 = c1 + dc;
      if (!inBounds(state, r2, c2)) return false;

      const beyond = state.grid[r2][c2];
      if (!isWalkable(beyond)) return false;

      state.grid[r2][c2] = setBoxCell(beyond, beyond === ".");
      state.grid[r1][c1] = setPlayerCell(to, to === "*");
      state.grid[r0][c0] = clearPlayerCell(from);
      state.playerRow = r1;
      state.playerCol = c1;
      return true;
    }

    return false;
  }

  function isWin(grid) {
    for (const row of grid) {
      for (const ch of row) {
        if (ch === "." || ch === "+") return false;
      }
    }
    return true;
  }

  function tileClassesFromChar(ch) {
    if (ch === "#") return ["tile", "wall"];

    const classes = ["tile", "floor"];
    if (isTarget(ch)) classes.push("target");
    if (isBox(ch)) classes.push("box");
    if (isPlayer(ch)) classes.push("player");
    return classes;
  }

  function buildBoard(container, state) {
    container.innerHTML = "";
    container.style.gridTemplateColumns = `repeat(${state.cols}, var(--sokoban-tile-size))`;
    container.style.gridTemplateRows = `repeat(${state.rows}, var(--sokoban-tile-size))`;

    const tiles = [];
    for (let r = 0; r < state.rows; r++) {
      for (let c = 0; c < state.cols; c++) {
        const el = document.createElement("div");
        el.className = "tile floor";
        container.appendChild(el);
        tiles.push(el);
      }
    }
    return tiles;
  }

  function render(state, tiles) {
    let i = 0;
    for (let r = 0; r < state.rows; r++) {
      for (let c = 0; c < state.cols; c++) {
        const ch = state.grid[r][c];
        tiles[i].className = tileClassesFromChar(ch).join(" ");
        i += 1;
      }
    }
  }

  function assertStateIntegrity(state) {
    let playerCount = 0;
    for (let r = 0; r < state.rows; r++) {
      for (let c = 0; c < state.cols; c++) {
        const ch = state.grid[r][c];
        if (ch === "@" || ch === "+") playerCount += 1;
      }
    }
    if (playerCount !== 1) throw new Error(`State invariant broken: expected 1 player, found ${playerCount}.`);
  }

  function cloneStateSnapshot(state) {
    return {
      grid: state.grid.map((row) => row.slice()),
      playerRow: state.playerRow,
      playerCol: state.playerCol,
      hasWon: state.hasWon,
    };
  }

  function init() {
    const gameEl = document.getElementById("sokobanGame");
    const gridEl = document.getElementById("sokobanGrid");
    const winBannerEl = document.getElementById("winBanner");
    const levelLabelEl = document.getElementById("levelLabel");
    const moveLabelEl = document.getElementById("moveLabel");
    const prevLevelBtn = document.getElementById("prevLevelBtn");
    const nextLevelBtn = document.getElementById("nextLevelBtn");
    const resetBtn = document.getElementById("resetBtn");
    const undoBtn = document.getElementById("undoBtn");
    const dpadEl = document.querySelector(".sokoban-dpad");

    if (
      !gameEl ||
      !gridEl ||
      !winBannerEl ||
      !levelLabelEl ||
      !moveLabelEl ||
      !prevLevelBtn ||
      !nextLevelBtn ||
      !resetBtn ||
      !undoBtn
    ) {
      return;
    }

    let currentLevelIndex = 0;
    let state = null;
    let tiles = null;
    let moveCount = 0;
    let undoStack = [];

    function updateHud() {
      levelLabelEl.textContent = `Level ${currentLevelIndex + 1} / ${LEVELS.length}`;
      moveLabelEl.textContent = `Moves: ${moveCount}`;
      undoBtn.disabled = undoStack.length === 0;
      prevLevelBtn.disabled = currentLevelIndex === 0;
      nextLevelBtn.disabled = currentLevelIndex === LEVELS.length - 1;
    }

    function setWinBannerVisibility() {
      winBannerEl.hidden = !state?.hasWon;
    }

    function maybeShowWin() {
      if (!state || state.hasWon) return;
      if (!isWin(state.grid)) return;
      state.hasWon = true;
      setWinBannerVisibility();
    }

    function loadLevel(levelIndex) {
      if (!Number.isInteger(levelIndex)) return;
      if (levelIndex < 0 || levelIndex >= LEVELS.length) return;

      currentLevelIndex = levelIndex;
      state = parseLevel(LEVELS[currentLevelIndex]);
      tiles = buildBoard(gridEl, state);
      undoStack = [];
      moveCount = 0;
      setWinBannerVisibility();
      render(state, tiles);
      updateHud();
      gameEl.focus();
    }

    function resetLevel() {
      loadLevel(currentLevelIndex);
    }

    function undoMove() {
      if (undoStack.length === 0 || !state) return;
      const snapshot = undoStack.pop();
      state.grid = snapshot.grid.map((row) => row.slice());
      state.playerRow = snapshot.playerRow;
      state.playerCol = snapshot.playerCol;
      state.hasWon = snapshot.hasWon;
      moveCount = snapshot.moveCount;
      setWinBannerVisibility();
      render(state, tiles);
      updateHud();
    }

    function move(dr, dc) {
      if (!state) return;
      const snapshot = { ...cloneStateSnapshot(state), moveCount };
      const moved = applyMove(state, dr, dc);
      if (!moved) return;

      undoStack.push(snapshot);
      moveCount += 1;
      assertStateIntegrity(state);
      render(state, tiles);
      maybeShowWin();
      updateHud();
    }

    function handleArrowKey(key) {
      if (key === "ArrowUp") move(-1, 0);
      else if (key === "ArrowDown") move(1, 0);
      else if (key === "ArrowLeft") move(0, -1);
      else if (key === "ArrowRight") move(0, 1);
    }

    gameEl.addEventListener("click", () => {
      gameEl.focus();
    });

    gameEl.addEventListener(
      "keydown",
      (e) => {
        if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) return;
        e.preventDefault();
        handleArrowKey(e.key);
      },
      { passive: false },
    );

    resetBtn.addEventListener("click", resetLevel);
    undoBtn.addEventListener("click", undoMove);
    prevLevelBtn.addEventListener("click", () => loadLevel(currentLevelIndex - 1));
    nextLevelBtn.addEventListener("click", () => loadLevel(currentLevelIndex + 1));

    if (dpadEl) {
      dpadEl.addEventListener("pointerdown", (e) => {
        const btn = e.target?.closest?.("button[data-dir]");
        if (!btn) return;
        const dir = btn.getAttribute("data-dir");
        if (dir === "up") move(-1, 0);
        else if (dir === "down") move(1, 0);
        else if (dir === "left") move(0, -1);
        else if (dir === "right") move(0, 1);
      });
    }

    let swipeStart = null;
    gridEl.addEventListener("pointerdown", (e) => {
      if (!e.isPrimary) return;
      swipeStart = { x: e.clientX, y: e.clientY };
    });

    function clearSwipeStart() {
      swipeStart = null;
    }

    gridEl.addEventListener("pointerup", (e) => {
      if (!e.isPrimary || !swipeStart) return;
      const dx = e.clientX - swipeStart.x;
      const dy = e.clientY - swipeStart.y;
      swipeStart = null;

      const minDistance = 26;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);
      if (absX < minDistance && absY < minDistance) return;

      if (absX > absY * 1.15) {
        move(0, dx > 0 ? 1 : -1);
      } else if (absY > absX * 1.15) {
        move(dy > 0 ? 1 : -1, 0);
      }
    });

    gridEl.addEventListener("pointercancel", clearSwipeStart);
    gridEl.addEventListener("pointerleave", clearSwipeStart);

    loadLevel(0);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
