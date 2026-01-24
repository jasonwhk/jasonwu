/* Temperature Conversion Rolling Dials (°C ⇄ °F)
 * - Vanilla HTML/CSS/JS (no deps)
 * - Scroll-snap wheel picker behavior
 * - Debounced “scroll end” syncing to avoid feedback loops
 */

(() => {
  const C_MIN = -50.0;
  const C_MAX = 204.5;
  const C_STEP = 0.5;

  const F_STEP = 1;
  const SCROLL_END_DEBOUNCE_MS = 120;
  const SYNC_RELEASE_MS = 260;

  const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
  const smoothBehavior = prefersReducedMotion ? "auto" : "smooth";

  const cDial = document.getElementById("cDial");
  const fDial = document.getElementById("fDial");
  const cList = document.getElementById("cList");
  const fList = document.getElementById("fList");
  const liveRegion = document.getElementById("liveRegion");

  if (!cDial || !fDial || !cList || !fList) return;

  // --- Math helpers ---
  function clamp(number, min, max) {
    return Math.min(max, Math.max(min, number));
  }

  function roundToStep(value, step) {
    const inv = 1 / step;
    return Math.round(value * inv) / inv;
  }

  function cToF(c) {
    return c * (9 / 5) + 32;
  }

  function fToC(f) {
    return (f - 32) * (5 / 9);
  }

  // Fahrenheit range derived from the Celsius minimum, with an explicit upper cap.
  const F_MIN = Math.floor(cToF(C_MIN));
  const F_MAX = 400;

  // --- Dial value arrays ---
  function buildValues(min, max, step) {
    const out = [];
    const count = Math.round((max - min) / step) + 1;
    for (let i = 0; i < count; i++) out.push(roundToStep(min + i * step, step));
    return out;
  }

  const cValues = buildValues(C_MIN, C_MAX, C_STEP);
  const fValues = buildValues(F_MIN, F_MAX, F_STEP);

  // --- Formatting ---
  const fmtC = (c) => `${c.toFixed(1)}°C`;
  const fmtF = (f) => `${Math.round(f)}°F`;

  // --- Index/value mapping ---
  function cIndexToValue(index) {
    return cValues[clamp(index, 0, cValues.length - 1)];
  }

  function fIndexToValue(index) {
    return fValues[clamp(index, 0, fValues.length - 1)];
  }

  function cValueToIndex(value) {
    const rounded = roundToStep(value, C_STEP);
    return clamp(Math.round((rounded - C_MIN) / C_STEP), 0, cValues.length - 1);
  }

  function fValueToIndex(value) {
    const rounded = roundToStep(value, F_STEP);
    return clamp(Math.round((rounded - F_MIN) / F_STEP), 0, fValues.length - 1);
  }

  // --- DOM building ---
  function buildDial(listEl, values, formatter) {
    const frag = document.createDocumentFragment();
    const items = [];

    for (let i = 0; i < values.length; i++) {
      const li = document.createElement("li");
      li.className = "dial-item";
      li.dataset.index = String(i);
      li.dataset.value = String(values[i]);
      li.textContent = formatter(values[i]);
      frag.appendChild(li);
      items.push(li);
    }

    listEl.appendChild(frag);
    return items;
  }

  const cItems = buildDial(cList, cValues, fmtC);
  const fItems = buildDial(fList, fValues, fmtF);

  // --- Scrolling geometry ---
  function getDialGeometry(dialEl) {
    const dialHeight = dialEl.clientHeight;
    const padEl = dialEl.querySelector(".dial-spacer");
    const pad = padEl ? padEl.offsetHeight : 0;
    const itemEl = dialEl.querySelector(".dial-item");
    const itemHeight = itemEl ? itemEl.offsetHeight : 1;
    return { dialHeight, pad, itemHeight };
  }

  function getCenteredIndex(dialEl, maxIndex) {
    const { dialHeight, pad, itemHeight } = getDialGeometry(dialEl);
    const centerY = dialEl.scrollTop + dialHeight / 2;
    const raw = (centerY - pad - itemHeight / 2) / itemHeight;
    return clamp(Math.round(raw), 0, maxIndex);
  }

  function scrollTopForIndex(dialEl, index) {
    const { dialHeight, pad, itemHeight } = getDialGeometry(dialEl);
    return pad + index * itemHeight + itemHeight / 2 - dialHeight / 2;
  }

  function scrollToIndex(dialEl, index, behavior = "auto") {
    dialEl.scrollTo({ top: scrollTopForIndex(dialEl, index), behavior });
  }

  // --- Selection styling ---
  function setSelected(items, prevIndex, nextIndex) {
    if (prevIndex != null && items[prevIndex]) items[prevIndex].classList.remove("is-selected");
    if (items[nextIndex]) items[nextIndex].classList.add("is-selected");
  }

  // --- Sync engine ---
  let activeSource = "c"; // 'c' or 'f'
  let syncingDial = null; // 'c' or 'f' while programmatically scrolling
  const ignoreNextScroll = { c: false, f: false }; // suppress a single scroll event after snap-to-center
  const timers = { c: null, f: null };

  let selectedCIndex = cValueToIndex(20.0);
  let selectedFIndex = fValueToIndex(68);

  function announce(cIndex, fIndex) {
    const c = fmtC(cIndexToValue(cIndex));
    const f = fmtF(fIndexToValue(fIndex));
    if (liveRegion) liveRegion.textContent = `${c} equals ${f}`;
  }

  function snapAndMark(dialName, index) {
    if (dialName === "c") {
      ignoreNextScroll.c = true;
      scrollToIndex(cDial, index, "auto");
      setSelected(cItems, selectedCIndex, index);
      selectedCIndex = index;
    } else {
      ignoreNextScroll.f = true;
      scrollToIndex(fDial, index, "auto");
      setSelected(fItems, selectedFIndex, index);
      selectedFIndex = index;
    }
  }

  function syncOtherFrom(dialName, sourceIndex) {
    if (dialName === "c") {
      const c = cIndexToValue(sourceIndex);
      const f = clamp(roundToStep(cToF(c), F_STEP), F_MIN, F_MAX);
      const fIndex = fValueToIndex(f);

      syncingDial = "f";
      window.clearTimeout(timers.f);
      scrollToIndex(fDial, fIndex, smoothBehavior);
      window.setTimeout(() => {
        syncingDial = null;
        snapAndMark("f", fIndex);
        announce(sourceIndex, fIndex);
      }, SYNC_RELEASE_MS);
    } else {
      const f = fIndexToValue(sourceIndex);
      const c = clamp(roundToStep(fToC(f), C_STEP), C_MIN, C_MAX);
      const cIndex = cValueToIndex(c);

      syncingDial = "c";
      window.clearTimeout(timers.c);
      scrollToIndex(cDial, cIndex, smoothBehavior);
      window.setTimeout(() => {
        syncingDial = null;
        snapAndMark("c", cIndex);
        announce(cIndex, sourceIndex);
      }, SYNC_RELEASE_MS);
    }
  }

  function onScrollEnd(dialName) {
    const dialEl = dialName === "c" ? cDial : fDial;
    const maxIndex = dialName === "c" ? cValues.length - 1 : fValues.length - 1;
    const index = getCenteredIndex(dialEl, maxIndex);

    // Ensure the source dial itself is perfectly centered after scrolling stops.
    snapAndMark(dialName, index);
    syncOtherFrom(dialName, index);
  }

  function onDialScroll(dialName) {
    if (syncingDial === dialName) return;
    if (ignoreNextScroll[dialName]) {
      ignoreNextScroll[dialName] = false;
      return;
    }

    activeSource = dialName;
    window.clearTimeout(timers[dialName]);
    timers[dialName] = window.setTimeout(() => onScrollEnd(dialName), SCROLL_END_DEBOUNCE_MS);
  }

  // --- Input source detection (helps when scroll events happen without pointerdown) ---
  function bindSourceDetection(dialEl, dialName) {
    const setActive = () => {
      activeSource = dialName;
    };
    dialEl.addEventListener("pointerdown", setActive, { passive: true });
    dialEl.addEventListener("touchstart", setActive, { passive: true });
    dialEl.addEventListener("wheel", setActive, { passive: true });
  }

  bindSourceDetection(cDial, "c");
  bindSourceDetection(fDial, "f");

  cDial.addEventListener("scroll", () => onDialScroll("c"), { passive: true });
  fDial.addEventListener("scroll", () => onDialScroll("f"), { passive: true });

  // Click-to-select (optional nicety)
  function bindClickSelect(listEl, dialName) {
    listEl.addEventListener("click", (event) => {
      const item = event.target?.closest?.(".dial-item");
      if (!item) return;

      const index = Number(item.dataset.index);
      if (!Number.isFinite(index)) return;

      activeSource = dialName;
      snapAndMark(dialName, index);
      syncOtherFrom(dialName, index);
    });
  }

  bindClickSelect(cList, "c");
  bindClickSelect(fList, "f");

  // Initial state: 20.0°C and 68°F (synced).
  function setInitial() {
    scrollToIndex(cDial, selectedCIndex, "auto");
    scrollToIndex(fDial, selectedFIndex, "auto");
    setSelected(cItems, null, selectedCIndex);
    setSelected(fItems, null, selectedFIndex);
    announce(selectedCIndex, selectedFIndex);
  }

  // Keep the selected value centered after resizes (mobile rotation, etc.)
  let resizeTimer = null;
  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      if (activeSource === "c") {
        scrollToIndex(cDial, selectedCIndex, "auto");
        scrollToIndex(fDial, selectedFIndex, "auto");
      } else {
        scrollToIndex(fDial, selectedFIndex, "auto");
        scrollToIndex(cDial, selectedCIndex, "auto");
      }
    }, 80);
  });

  setInitial();
})();
