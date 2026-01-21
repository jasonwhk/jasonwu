// FFT Simulator – client‑side logic

/* -------------------------------------------------------------
   Helper functions
   ------------------------------------------------------------- */
function setStatus(msg, type = "info") {
  const el = document.getElementById("status");
  el.textContent = msg;
  el.className = `status-message show ${type}`;
  if (type !== "loading") setTimeout(() => (el.className = "status-message"), 3000);
}

/* -------------------------------------------------------------
   Input handling
   ------------------------------------------------------------- */
function parseManual(text) {
  const vals = text.trim().split(/[\s,]+/).filter(Boolean).map(Number);
  if (vals.some(isNaN)) throw new Error("Manual input contains non‑numeric values.");
  return vals;
}

/* -------------------------------------------------------------
   Gaussian noise (Box‑Muller transform)
   ------------------------------------------------------------- */
function gaussRandom() {
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/* -------------------------------------------------------------
   Tone + noise generation
   ------------------------------------------------------------- */
function generateTone({ freq, amp, dur, sr, noise }) {
  const N = Math.round(dur * sr);
  const data = new Float32Array(N);
  const twoPiF = (2 * Math.PI * freq) / sr;

  for (let i = 0; i < N; i++) {
    const sine = Math.sin(twoPiF * i);
    const n = gaussRandom(); // Gaussian noise ~ N(0,1)
    data[i] = amp * sine + noise * n;
  }
  return Array.from(data);
}

/* -------------------------------------------------------------
   Pad array to next power of two (required for radix‑2 FFT)
   ------------------------------------------------------------- */
function padPow2(arr) {
  const n = arr.length;
  const target = 1 << Math.ceil(Math.log2(n));
  if (target === n) return arr;
  const padded = new Float32Array(target);
  padded.set(arr);
  return Array.from(padded);
}

/* -------------------------------------------------------------
   FFT using fft.js (CDN library)
   ------------------------------------------------------------- */
function computeFFT(signal) {
  const N = signal.length;
  // radix‑2 Cooley‑Tukey FFT (in‑place)
  const bits = Math.floor(Math.log2(N));
  // bit‑reversal permutation
  const rev = new Uint32Array(N);
  for (let i = 0; i < N; i++) {
    let j = 0;
    for (let k = 0; k < bits; k++) if (i & (1 << k)) j |= 1 << (bits - 1 - k);
    rev[i] = j;
  }
  const data = new Array(N);
  for (let i = 0; i < N; i++) data[i] = { re: signal[rev[i]], im: 0 };

  for (let size = 2; size <= N; size <<= 1) {
    const half = size >> 1;
    const theta = (-2 * Math.PI) / size;
    const wtemp = Math.sin(0.5 * theta);
    const wpr = -2.0 * wtemp * wtemp;
    const wpi = Math.sin(theta);
    let wre = 1, wim = 0;
    for (let m = 0; m < half; m++) {
      for (let i = m; i < N; i += size) {
        const j = i + half;
        const tempr = wre * data[j].re - wim * data[j].im;
        const tempi = wre * data[j].im + wim * data[j].re;
        data[j].re = data[i].re - tempr;
        data[j].im = data[i].im - tempi;
        data[i].re += tempr;
        data[i].im += tempi;
      }
      const wr = wre;
      wre = wr * wpr - wim * wpi + wre;
      wim = wim * wpr + wr * wpi + wim;
    }
  }
  return data;
}

/* -------------------------------------------------------------
   Magnitude & Phase extraction
   ------------------------------------------------------------- */
function getMagnitude(complexArr) {
  return complexArr.map(c => Math.hypot(c.re, c.im));
}
function getPhase(complexArr) {
  return complexArr.map(c => Math.atan2(c.im, c.re));
}

/* -------------------------------------------------------------
   Canvas drawing (magnitude bars + optional phase line)
   ------------------------------------------------------------- */
function drawCanvas(mag, phase, showPhase, sampleRate) {
  const canvas = document.getElementById("fftChart");
  const ctx = canvas.getContext("2d");
  const w = canvas.width,
        h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  // Magnitude bar chart (primary colour)
  const maxMag = Math.max(...mag);
  const barW = w / mag.length;
  ctx.fillStyle = "var(--color-primary)";
  mag.forEach((v, i) => {
    const barH = (v / maxMag) * h;
    ctx.fillRect(i * barW, h - barH, barW - 1, barH);
  });

  // Phase line plot (secondary colour) if toggled
  if (showPhase) {
    const maxPhase = Math.max(...phase);
    const minPhase = Math.min(...phase);
    const range = maxPhase - minPhase || 1;
    ctx.strokeStyle = "var(--color-secondary)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    phase.forEach((p, i) => {
      const x = i * barW + barW / 2;
      const y = h - ((p - minPhase) / range) * h;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }
  // X‑axis frequency labels
  ctx.strokeStyle = "#000";
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(w, h);
  ctx.stroke();
  ctx.fillStyle = "#000";
  ctx.textAlign = "center";
  ctx.font = "10px sans-serif";
  const binFreq = sampleRate / mag.length;
  const labelStep = Math.max(1, Math.floor(mag.length / 10));
  for (let i = 0; i < mag.length; i += labelStep) {
    const xPos = i * barW + barW / 2;
    const freqLabel = (i * binFreq).toFixed(1);
    ctx.fillText(freqLabel + "Hz", xPos, h + 12);
  }
}

/* -------------------------------------------------------------
   UI wiring
   ------------------------------------------------------------- */
document.getElementById("srcSelect").addEventListener("change", e => {
  const manual = document.getElementById("manualBox");
  const tone = document.getElementById("toneBox");
  if (e.target.value === "manual") {
    manual.style.display = "block";
    tone.style.display = "none";
  } else {
    manual.style.display = "none";
    tone.style.display = "block";
  }
});

// Update slider values display
["freq", "amp", "dur", "sr", "noise"].forEach(id => {
  const slider = document.getElementById(`${id}Slider`);
  const out = document.getElementById(`${id}Val`);
  if (slider) slider.addEventListener("input", () => out.textContent = slider.value);
});

// Run FFT button
document.getElementById("runBtn").addEventListener("click", () => {
  try {
    setStatus("Computing…", "loading");

    // Get raw signal
    let raw;
    if (document.getElementById("srcSelect").value === "manual") {
      raw = parseManual(document.getElementById("inputData").value);
    } else {
      raw = generateTone({
        freq:   +document.getElementById("freqSlider").value,
        amp:    +document.getElementById("ampSlider").value,
        dur:    +document.getElementById("durSlider").value,
        sr:     +document.getElementById("srSlider").value,
        noise:  +document.getElementById("noiseSlider").value,
      });
    }

    const padded = padPow2(raw);
    const complex = computeFFT(padded);
    const mag = getMagnitude(complex);
    const phase = getPhase(complex);
    const showPhase = document.getElementById("phaseToggle").checked;
    drawCanvas(mag, phase, showPhase, +document.getElementById("srSlider").value);
    setStatus("FFT completed", "success");
  } catch (e) {
    console.error(e);
    setStatus(e.message, "error");
  }
});
