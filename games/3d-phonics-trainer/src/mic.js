export class MicMonitor {
  constructor({ onLevel, onSpeech, onSilence, onPermissionError }) {
    this.onLevel = onLevel;
    this.onSpeech = onSpeech;
    this.onSilence = onSilence;
    this.onPermissionError = onPermissionError;
    this.stream = null;
    this.context = null;
    this.analyser = null;
    this.data = null;
    this.active = false;
    this.speechTimer = 0;
    this.silenceTimer = 0;
    this.raf = null;
  }

  async start() {
    if (this.active) {
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      this.onPermissionError?.();
      return;
    }
    try {
      if (!this.stream) {
        this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      if (!this.context) {
        this.context = new (window.AudioContext || window.webkitAudioContext)();
      }
      this.analyser = this.context.createAnalyser();
      this.analyser.fftSize = 512;
      const source = this.context.createMediaStreamSource(this.stream);
      source.connect(this.analyser);
      this.data = new Uint8Array(this.analyser.fftSize);
      this.active = true;
      this.speechTimer = 0;
      this.silenceTimer = performance.now();
      this.loop();
    } catch (error) {
      this.onPermissionError?.();
    }
  }

  stop() {
    this.active = false;
    if (this.raf) {
      cancelAnimationFrame(this.raf);
    }
    this.onLevel?.(0);
  }

  loop() {
    if (!this.active || !this.analyser) {
      return;
    }
    this.analyser.getByteTimeDomainData(this.data);
    const rms = computeRms(this.data);
    this.onLevel?.(rms);
    const now = performance.now();

    if (rms > 0.12) {
      this.speechTimer += 16;
      if (this.speechTimer > 200) {
        this.onSpeech?.();
        this.stop();
        return;
      }
    } else {
      this.speechTimer = Math.max(0, this.speechTimer - 10);
    }

    if (now - this.silenceTimer > 2500) {
      this.onSilence?.();
      this.stop();
      return;
    }

    this.raf = requestAnimationFrame(() => this.loop());
  }
}

function computeRms(data) {
  let sum = 0;
  for (let i = 0; i < data.length; i += 1) {
    const value = (data[i] - 128) / 128;
    sum += value * value;
  }
  return Math.sqrt(sum / data.length);
}
