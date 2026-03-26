/**
 * Polished metronome widget using Web Audio scheduling.
 * - Avoids timing drift via look-ahead scheduler.
 * - Supports keyboard shortcuts, tap tempo, and localStorage persistence.
 */
(() => {
  const STORAGE_KEY = "metronome_widget_v1";
  const MIN_BPM = 30;
  const MAX_BPM = 240;
  const DEFAULT_BPM = 100;
  const DEFAULT_BEATS = 4;

  class Metronome {
    constructor() {
      // Playback / timing state
      this.audioContext = null;
      this.isRunning = false;
      this.nextNoteTime = 0;
      this.currentBeat = 0;
      this.timerId = null;
      this.lookaheadMs = 25;
      this.scheduleAheadSec = 0.12;
      this.masterGain = null;

      // Musical state
      this.bpm = DEFAULT_BPM;
      this.beatsPerBar = DEFAULT_BEATS;
      this.soundEnabled = true;

      // UI / input helpers
      this.tapTimes = [];
      this.maxTapAgeMs = 2200;

      // Element references
      this.bpmValueEl = document.getElementById("bpmValue");
      this.bpmRangeEl = document.getElementById("bpmRange");
      this.indicatorsEl = document.getElementById("beatIndicators");
      this.displayEl = document.querySelector(".display");
      this.pendulumEl = document.getElementById("pendulum");
      this.beatsPerBarEl = document.getElementById("beatsPerBar");
      this.soundEnabledEl = document.getElementById("soundEnabled");
      this.startStopBtn = document.getElementById("startStopBtn");
      this.tapBtn = document.getElementById("tapBtn");
      this.testSoundBtn = document.getElementById("testSoundBtn");
      this.resetBtn = document.getElementById("resetBtn");
      this.decrease5Btn = document.getElementById("decrease5");
      this.increase5Btn = document.getElementById("increase5");

      this.loadSettings();
      this.syncUI();
      this.renderIndicators();
      this.bindEvents();
    }

    // ----- Initialization / persistence -----
    loadSettings() {
      try {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (!stored) return;

        if (Number.isFinite(stored.bpm)) this.bpm = this.clampBpm(stored.bpm);
        if ([2, 3, 4, 5, 6].includes(stored.beatsPerBar)) this.beatsPerBar = stored.beatsPerBar;
        if (typeof stored.soundEnabled === "boolean") this.soundEnabled = stored.soundEnabled;
      } catch {
        // Ignore malformed storage and continue with defaults.
      }
    }

    saveSettings() {
      const payload = {
        bpm: this.bpm,
        beatsPerBar: this.beatsPerBar,
        soundEnabled: this.soundEnabled,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    }

    syncUI() {
      this.bpmValueEl.textContent = String(this.bpm);
      this.bpmRangeEl.value = String(this.bpm);
      this.beatsPerBarEl.value = String(this.beatsPerBar);
      this.soundEnabledEl.checked = this.soundEnabled;
      this.updateStartStopButton();
    }

    bindEvents() {
      this.bpmRangeEl.addEventListener("input", (event) => {
        this.setBpm(Number(event.target.value));
      });

      this.decrease5Btn.addEventListener("click", () => this.adjustBpm(-5));
      this.increase5Btn.addEventListener("click", () => this.adjustBpm(5));

      this.beatsPerBarEl.addEventListener("change", (event) => {
        this.beatsPerBar = Number(event.target.value);
        this.currentBeat = 0;
        this.renderIndicators();
        this.saveSettings();
      });

      this.soundEnabledEl.addEventListener("change", (event) => {
        this.soundEnabled = Boolean(event.target.checked);
        if (this.soundEnabled) {
          // Prime audio immediately from a user interaction when possible.
          this.primeAudio();
        }
        this.saveSettings();
      });

      this.startStopBtn.addEventListener("click", () => {
        this.primeAudio();
        this.toggleStartStop();
      });

      this.tapBtn.addEventListener("click", () => {
        this.primeAudio();
        this.tapTempo();
      });
      this.testSoundBtn.addEventListener("click", () => this.testSound());
      this.resetBtn.addEventListener("click", () => this.reset());

      window.addEventListener("keydown", (event) => this.onKeyDown(event));
      window.addEventListener("beforeunload", () => this.stop());
    }

    // ----- Tempo / meter -----
    clampBpm(value) {
      return Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(value)));
    }

    setBpm(value) {
      this.bpm = this.clampBpm(value);
      this.bpmValueEl.textContent = String(this.bpm);
      this.bpmRangeEl.value = String(this.bpm);
      this.saveSettings();
    }

    adjustBpm(delta) {
      this.setBpm(this.bpm + delta);
    }

    reset() {
      this.stop();
      this.currentBeat = 0;
      this.tapTimes.length = 0;
      this.setBpm(DEFAULT_BPM);
      this.beatsPerBar = DEFAULT_BEATS;
      this.soundEnabled = true;
      this.syncUI();
      this.renderIndicators();
      this.saveSettings();
    }

    tapTempo() {
      const now = performance.now();
      this.tapTimes.push(now);

      // Keep only recent taps for more reliable averages.
      this.tapTimes = this.tapTimes.filter((t) => now - t <= this.maxTapAgeMs);

      if (this.tapTimes.length < 2) return;

      const intervals = [];
      for (let i = 1; i < this.tapTimes.length; i += 1) {
        intervals.push(this.tapTimes[i] - this.tapTimes[i - 1]);
      }

      const avgInterval = intervals.reduce((sum, n) => sum + n, 0) / intervals.length;
      const tappedBpm = 60000 / avgInterval;
      this.setBpm(tappedBpm);
    }

    // ----- Visuals -----
    renderIndicators() {
      this.indicatorsEl.innerHTML = "";
      for (let i = 0; i < this.beatsPerBar; i += 1) {
        const dot = document.createElement("div");
        dot.className = `beat-dot ${i === 0 ? "accent" : ""}`.trim();
        dot.setAttribute("aria-hidden", "true");
        this.indicatorsEl.appendChild(dot);
      }
      this.highlightBeat(-1);
    }

    highlightBeat(index) {
      const dots = this.indicatorsEl.children;
      for (let i = 0; i < dots.length; i += 1) {
        dots[i].classList.toggle("active", i === index);
      }

      if (index >= 0) {
        // Trigger a subtle pulse animation on the BPM text each beat.
        this.bpmValueEl.classList.remove("pulse");
        // Force reflow so repeated beats retrigger the animation class.
        void this.bpmValueEl.offsetWidth;
        this.bpmValueEl.classList.add("pulse");

        // Pendulum-like swing synced with beat position.
        const phase = index / Math.max(1, this.beatsPerBar - 1);
        const angle = -20 + phase * 40;
        this.pendulumEl.style.setProperty("--pendulum-angle", `${angle.toFixed(1)}deg`);
      }
    }

    // ----- Web Audio scheduling -----
    async ensureAudioContext() {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.value = 0.9;
        this.masterGain.connect(this.audioContext.destination);
      }
      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume();
      }
    }

    async primeAudio() {
      try {
        await this.ensureAudioContext();
        this.unlockAudioGraph();
      } catch {
        // If browser blocks audio initialization, keep UI working silently.
      }
    }

    unlockAudioGraph() {
      if (!this.audioContext || !this.masterGain) return;
      const now = this.audioContext.currentTime;
      const unlockOsc = this.audioContext.createOscillator();
      const unlockGain = this.audioContext.createGain();
      unlockOsc.type = "sine";
      unlockOsc.frequency.setValueAtTime(440, now);
      unlockGain.gain.setValueAtTime(0.00001, now);
      unlockGain.gain.exponentialRampToValueAtTime(0.00001, now + 0.02);
      unlockOsc.connect(unlockGain);
      unlockGain.connect(this.masterGain);
      unlockOsc.start(now);
      unlockOsc.stop(now + 0.02);
    }

    async testSound() {
      await this.primeAudio();
      if (!this.audioContext) return;
      const wasEnabled = this.soundEnabled;
      if (!wasEnabled) {
        this.soundEnabled = true;
        this.soundEnabledEl.checked = true;
      }
      const when = this.audioContext.currentTime + 0.01;
      this.playClick(when, true);
      setTimeout(() => this.highlightBeat(0), 10);
      this.soundEnabled = true;
      this.saveSettings();
    }

    playClick(when, accented) {
      if (!this.soundEnabled || !this.audioContext) return;

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.type = accented ? "triangle" : "square";
      oscillator.frequency.setValueAtTime(accented ? 1600 : 980, when);

      gainNode.gain.setValueAtTime(0.0001, when);
      gainNode.gain.exponentialRampToValueAtTime(accented ? 0.38 : 0.24, when + 0.002);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, when + 0.07);

      oscillator.connect(gainNode);
      gainNode.connect(this.masterGain || this.audioContext.destination);
      oscillator.start(when);
      oscillator.stop(when + 0.075);
    }

    scheduleNote(beat, when) {
      const accented = beat === 0;
      this.playClick(when, accented);

      // Visual update aligned to the scheduled audio time.
      const delayMs = Math.max(0, (when - this.audioContext.currentTime) * 1000);
      setTimeout(() => this.highlightBeat(beat), delayMs);
    }

    getSecondsPerBeat() {
      return 60 / this.bpm;
    }

    advanceNote() {
      this.nextNoteTime += this.getSecondsPerBeat();
      this.currentBeat = (this.currentBeat + 1) % this.beatsPerBar;
    }

    schedulerTick() {
      if (!this.audioContext) return;
      while (this.nextNoteTime < this.audioContext.currentTime + this.scheduleAheadSec) {
        this.scheduleNote(this.currentBeat, this.nextNoteTime);
        this.advanceNote();
      }
    }

    async start() {
      if (this.isRunning) return;

      try {
        await this.ensureAudioContext();
      } catch {
        return;
      }
      this.isRunning = true;
      this.currentBeat = 0;
      this.nextNoteTime = this.audioContext.currentTime + 0.05;
      this.timerId = window.setInterval(() => this.schedulerTick(), this.lookaheadMs);
      this.displayEl.classList.add("running");
      this.updateStartStopButton();
    }

    stop() {
      if (!this.isRunning) return;
      this.isRunning = false;

      if (this.timerId !== null) {
        window.clearInterval(this.timerId);
        this.timerId = null;
      }

      this.highlightBeat(-1);
      this.displayEl.classList.remove("running");
      this.pendulumEl.style.setProperty("--pendulum-angle", "0deg");
      this.updateStartStopButton();
    }

    toggleStartStop() {
      if (this.isRunning) {
        this.stop();
      } else {
        this.start();
      }
    }

    updateStartStopButton() {
      this.startStopBtn.textContent = this.isRunning ? "Stop" : "Start";
      this.startStopBtn.classList.toggle("running", this.isRunning);
      this.startStopBtn.setAttribute("aria-pressed", this.isRunning ? "true" : "false");
    }

    // ----- Keyboard shortcuts -----
    onKeyDown(event) {
      const target = event.target;
      const isTypingInInput =
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" || target.tagName === "SELECT" || target.tagName === "TEXTAREA");

      if (isTypingInInput && event.key !== " ") return;

      if (event.code === "Space") {
        event.preventDefault();
        this.toggleStartStop();
      } else if (event.key.toLowerCase() === "t") {
        this.tapTempo();
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        this.adjustBpm(1);
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        this.adjustBpm(-1);
      }
    }
  }

  new Metronome();
})();
