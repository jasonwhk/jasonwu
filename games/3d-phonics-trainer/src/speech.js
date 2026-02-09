export class SpeechCoach {
  constructor() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.supported = !!SpeechRecognition;
    this.recognition = this.supported ? new SpeechRecognition() : null;
    if (this.recognition) {
      this.recognition.lang = 'en-US';
      this.recognition.interimResults = false;
      this.recognition.maxAlternatives = 1;
    }
  }

  listenForWord(word, onResult) {
    if (!this.supported || !this.recognition) {
      onResult?.(false);
      return;
    }
    const target = word.toLowerCase();
    let handled = false;
    const finish = (matched) => {
      if (handled) {
        return;
      }
      handled = true;
      onResult?.(matched);
    };
    try {
      const timeout = setTimeout(() => {
        try {
          this.recognition.stop();
        } catch (error) {
          // Ignore stop errors.
        }
        finish(false);
      }, 2500);

      this.recognition.onresult = (event) => {
        clearTimeout(timeout);
        const transcript = event.results[0][0].transcript.toLowerCase();
        finish(transcript.includes(target));
      };
      this.recognition.onerror = () => finish(false);
      this.recognition.onend = () => {
        if (!handled) {
          finish(false);
        }
      };
      this.recognition.start();
    } catch (error) {
      finish(false);
    }
  }
}
