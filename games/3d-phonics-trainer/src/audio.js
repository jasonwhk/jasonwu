export class AudioManager {
  constructor() {
    this.context = null;
    this.current = null;
  }

  async init() {
    if (!this.context) {
      this.context = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.context.state === 'suspended') {
      await this.context.resume();
    }
  }

  stop() {
    if (this.current && this.current.stop) {
      this.current.stop();
    }
    this.current = null;
  }

  async playPhoneme(card) {
    this.stop();
    const file = card.audio;
    if (file) {
      await this.playAudioFile(`./audio/phonemes/${file}`);
      return;
    }
    this.playCueTone();
  }

  async playWord(card) {
    this.stop();
    const file = card.audio;
    if (file) {
      await this.playAudioFile(`./audio/words/${file}`);
      return;
    }
    this.speak(card.word);
  }

  async playBlend(card) {
    this.stop();
    if (Array.isArray(card.phonemes)) {
      await this.playPhonemeSequence(card.phonemes.length);
    }
    this.speak(card.word);
  }

  async playAudioFile(url) {
    const audio = new Audio(url);
    this.current = audio;
    await audio.play();
  }

  playCueTone(frequency = 600, duration = 0.25) {
    if (!this.context) {
      return;
    }
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = 'sine';
    osc.frequency.value = frequency;
    gain.gain.value = 0.08;
    osc.connect(gain).connect(this.context.destination);
    osc.start();
    osc.stop(this.context.currentTime + duration);
    this.current = osc;
  }

  async playPhonemeSequence(count) {
    if (!this.context) {
      return;
    }
    const baseFreq = 520;
    for (let i = 0; i < count; i += 1) {
      this.playCueTone(baseFreq + i * 40, 0.18);
      await wait(220);
    }
  }

  speak(text) {
    if (!('speechSynthesis' in window)) {
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    window.speechSynthesis.speak(utterance);
    this.current = utterance;
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
