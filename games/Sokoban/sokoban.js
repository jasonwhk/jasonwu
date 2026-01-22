(() => {
  "use strict";

  const LEVELS = [
    [
      "#####",
      "#@  #",
      "# $ #",
      "# . #",
      "#####",
    ],
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

  function applyMove(state, dir) {
    const deltas = {
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1],
    };
    const delta = deltas[dir];
    if (!delta) return false;

    const [dr, dc] = delta;
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

  function init() {
    const gridEl = document.getElementById("sokobanGrid");
    const winBannerEl = document.getElementById("winBanner");
    if (!gridEl || !winBannerEl) return;

    const state = parseLevel(LEVELS[0]);
    const tiles = buildBoard(gridEl, state);
    render(state, tiles);

    function maybeShowWin() {
      if (state.hasWon) return;
      if (!isWin(state.grid)) return;
      state.hasWon = true;
      winBannerEl.hidden = false;
    }

    document.addEventListener(
      "keydown",
      (e) => {
        if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) return;
        e.preventDefault();

        const moved = applyMove(state, e.key);
        if (!moved) return;

        assertStateIntegrity(state);
        render(state, tiles);
        maybeShowWin();
      },
      { passive: false },
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

