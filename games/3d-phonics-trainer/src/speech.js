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

  encourage(word) {
    if (!this.supported || !this.recognition) {
      return;
    }
    try {
      this.recognition.start();
      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        if (transcript.includes(word)) {
          console.log(`Heard something like ${word}`);
        }
      };
    } catch (error) {
      // Ignore restart errors.
    }
  }
}
