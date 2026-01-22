(() => {
  const STORAGE_PREFIX = "familyDice.";
  const KEYS = {
    mode: `${STORAGE_PREFIX}mode`,
    max: `${STORAGE_PREFIX}max`,
    last: `${STORAGE_PREFIX}last`,
    history: `${STORAGE_PREFIX}history`,
  };

  const MAX_MIN = 1;
  const MAX_MAX = 20;
  const DOTS_MAX = 6;
  const HISTORY_LEN = 5;

  const elements = {
    modeNumbers: document.getElementById("modeNumbers"),
    modeDots: document.getElementById("modeDots"),
    maxDown: document.getElementById("maxDown"),
    maxUp: document.getElementById("maxUp"),
    maxValue: document.getElementById("maxValue"),
    dice: document.getElementById("dice"),
    diceFace: document.getElementById("diceFace"),
    rollBtn: document.getElementById("rollBtn"),
    resetBtn: document.getElementById("resetBtn"),
    historyRow: document.getElementById("historyRow"),
    srStatus: document.getElementById("srStatus"),
  };

  const motionQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)");

  const state = {
    mode: "numbers",
    max: 20,
    value: null,
    history: [],
    rolling: false,
  };

  function clampInt(value, min, max) {
    if (!Number.isFinite(value)) return min;
    const asInt = Math.trunc(value);
    return Math.max(min, Math.min(max, asInt));
  }

  function getStoredJSON(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function setStoredJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore
    }
  }

  function getStoredString(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  function setStoredString(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      // ignore
    }
  }

  function isReducedMotion() {
    return Boolean(motionQuery?.matches);
  }

  function randomIntInclusive(min, max) {
    const range = max - min + 1;
    if (range <= 0) return min;

    const cryptoObj = globalThis.crypto;
    if (!cryptoObj?.getRandomValues) {
      return Math.floor(Math.random() * range) + min;
    }

    const maxUint32Plus1 = 0x100000000;
    const limit = Math.floor(maxUint32Plus1 / range) * range;
    const buf = new Uint32Array(1);

    let x = 0;
    do {
      cryptoObj.getRandomValues(buf);
      x = buf[0];
    } while (x >= limit);

    return (x % range) + min;
  }

  function maxUpperBoundForMode(mode) {
    return mode === "dots" ? DOTS_MAX : MAX_MAX;
  }

  function setMode(mode) {
    state.mode = mode === "dots" ? "dots" : "numbers";
    setStoredString(KEYS.mode, state.mode);
    if (state.max > maxUpperBoundForMode(state.mode)) {
      state.max = maxUpperBoundForMode(state.mode);
      setStoredString(KEYS.max, String(state.max));
    }
    renderControls();
    renderDice();
  }

  function setMax(newMax) {
    state.max = clampInt(newMax, MAX_MIN, maxUpperBoundForMode(state.mode));
    setStoredString(KEYS.max, String(state.max));
    renderControls();
    renderDice();
  }

  function setValue(value) {
    state.value = typeof value === "number" ? value : null;
    setStoredString(KEYS.last, state.value == null ? "" : String(state.value));
    renderDice();
  }

  function setHistory(history) {
    const cleaned = Array.isArray(history)
      ? history.filter((n) => Number.isInteger(n) && n >= 1 && n <= MAX_MAX)
      : [];
    state.history = cleaned.slice(0, HISTORY_LEN);
    setStoredJSON(KEYS.history, state.history);
    renderHistory();
  }

  function pushHistory(value) {
    if (!Number.isInteger(value)) return;
    setHistory([value, ...state.history].slice(0, HISTORY_LEN));
  }

  function pipPositionsFor(value) {
    switch (value) {
      case 1:
        return [5];
      case 2:
        return [1, 9];
      case 3:
        return [1, 5, 9];
      case 4:
        return [1, 3, 7, 9];
      case 5:
        return [1, 3, 5, 7, 9];
      case 6:
        return [1, 3, 4, 6, 7, 9];
      default:
        return [];
    }
  }

  function renderPips(value) {
    const wrap = document.createElement("div");
    wrap.className = "pips";
    for (const pos of pipPositionsFor(value)) {
      const pip = document.createElement("div");
      pip.className = `pip pos-${pos}`;
      wrap.appendChild(pip);
    }
    return wrap;
  }

  function renderDice() {
    elements.diceFace.classList.remove("fallback-number");
    elements.diceFace.replaceChildren();

    const value = state.value;
    if (value == null) {
      elements.diceFace.textContent = "?";
      return;
    }

    if (state.mode === "dots" && state.max <= 6 && value <= 6) {
      elements.diceFace.appendChild(renderPips(value));
      return;
    }

    elements.diceFace.classList.add("fallback-number");
    elements.diceFace.textContent = String(value);
  }

  function renderHistory() {
    elements.historyRow.replaceChildren();
    for (let i = 0; i < HISTORY_LEN; i++) {
      const chip = document.createElement("div");
      chip.className = "chip";
      const value = state.history[i];
      if (!value) {
        chip.classList.add("empty");
        chip.textContent = "–";
      } else {
        chip.textContent = String(value);
      }
      elements.historyRow.appendChild(chip);
    }
  }

  function renderControls() {
    elements.modeNumbers.setAttribute("aria-pressed", String(state.mode === "numbers"));
    elements.modeDots.setAttribute("aria-pressed", String(state.mode === "dots"));

    elements.maxValue.textContent = String(state.max);
    elements.maxDown.disabled = state.max <= MAX_MIN;
    elements.maxUp.disabled = state.max >= maxUpperBoundForMode(state.mode);
  }

  function announce(text) {
    elements.srStatus.textContent = text;
  }

  function roll() {
    if (state.rolling) return;

    if (isReducedMotion()) {
      const finalValue = randomIntInclusive(1, state.max);
      setValue(finalValue);
      pushHistory(finalValue);
      announce(`Rolled ${finalValue} out of ${state.max}.`);
      return;
    }

    state.rolling = true;
    elements.dice.classList.add("rolling");

    const flickerTotalMs = 360;
    const tickMs = 35;
    const ticks = Math.max(6, Math.floor(flickerTotalMs / tickMs));
    let remaining = ticks;

    const timer = window.setInterval(() => {
      const preview = randomIntInclusive(1, state.max);
      setValue(preview);
      remaining -= 1;
      if (remaining <= 0) {
        window.clearInterval(timer);

        const finalValue = randomIntInclusive(1, state.max);
        setValue(finalValue);
        pushHistory(finalValue);
        announce(`Rolled ${finalValue} out of ${state.max}.`);

        window.setTimeout(() => {
          elements.dice.classList.remove("rolling");
          state.rolling = false;
        }, 80);
      }
    }, tickMs);
  }

  function resetResult() {
    if (state.rolling) return;
    setValue(null);
    setHistory([]);
    announce("Reset.");
  }

  function loadState() {
    const storedMode = getStoredString(KEYS.mode);
    if (storedMode === "numbers" || storedMode === "dots") state.mode = storedMode;

    const storedMaxRaw = getStoredString(KEYS.max);
    if (storedMaxRaw != null && storedMaxRaw !== "") {
      const parsed = Number(storedMaxRaw);
      if (Number.isFinite(parsed)) state.max = clampInt(parsed, MAX_MIN, maxUpperBoundForMode(state.mode));
    }

    const storedLastRaw = getStoredString(KEYS.last);
    const storedLast = clampInt(Number(storedLastRaw), 1, MAX_MAX);
    if (storedLastRaw && storedLast >= 1) state.value = storedLast;

    const storedHistory = getStoredJSON(KEYS.history);
    if (storedHistory) {
      const cleaned = Array.isArray(storedHistory)
        ? storedHistory.filter((n) => Number.isInteger(n) && n >= 1 && n <= MAX_MAX)
        : [];
      state.history = cleaned.slice(0, HISTORY_LEN);
    }
  }

  function bindEvents() {
    elements.modeNumbers.addEventListener("click", () => setMode("numbers"));
    elements.modeDots.addEventListener("click", () => setMode("dots"));

    elements.maxDown.addEventListener("click", () => setMax(state.max - 1));
    elements.maxUp.addEventListener("click", () => setMax(state.max + 1));

    let ignoreClickUntil = 0;
    const maybeIgnoreClick = () => Date.now() < ignoreClickUntil;
    const markIgnoreClick = () => {
      ignoreClickUntil = Date.now() + 650;
    };

    const bindPrimaryRollTarget = (target) => {
      target.addEventListener("pointerup", (e) => {
        if (state.rolling) return;
        if (e.pointerType === "touch" || e.pointerType === "pen") markIgnoreClick();
        roll();
      });
      target.addEventListener("click", () => {
        if (maybeIgnoreClick()) return;
        roll();
      });
    };

    bindPrimaryRollTarget(elements.dice);
    bindPrimaryRollTarget(elements.rollBtn);

    elements.resetBtn.addEventListener("click", resetResult);

    motionQuery?.addEventListener?.("change", () => {
      renderDice();
    });
  }

  function init() {
    loadState();
    renderControls();
    renderHistory();
    renderDice();
    bindEvents();
  }

  init();
})();
