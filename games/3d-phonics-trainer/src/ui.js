import { burstStars } from './fx.js';

export class UIController {
  constructor({
    promptText,
    hintText,
    onListen,
    onReveal,
    onNext,
    onShuffle,
    onModeToggle,
    onMicStart,
    onMicStop,
    onParentOpen,
    onParentClose,
    onResetProgress,
  }) {
    this.promptText = promptText;
    this.hintText = hintText;
    this.starCount = document.querySelector('#starCount');
    this.micRing = document.querySelector('#micRing');
    this.modeBtn = document.querySelector('#modeBtn');
    this.parentPanel = document.querySelector('#parentPanel');
    this.parentTable = document.querySelector('#parentTable');
    this.logoButton = document.querySelector('#logoButton');

    document.querySelector('#listenBtn').addEventListener('pointerdown', onListen);
    document.querySelector('#revealBtn').addEventListener('pointerdown', onReveal);
    document.querySelector('#nextBtn').addEventListener('pointerdown', onNext);
    document.querySelector('#shuffleBtn').addEventListener('pointerdown', onShuffle);
    this.modeBtn.addEventListener('pointerdown', onModeToggle);

    const micBtn = document.querySelector('#micBtn');
    micBtn.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      onMicStart();
      micBtn.setPointerCapture(event.pointerId);
    });
    micBtn.addEventListener('pointerup', () => onMicStop());
    micBtn.addEventListener('pointercancel', () => onMicStop());

    document.querySelector('#parentClose').addEventListener('click', onParentClose);
    document.querySelector('#resetProgress').addEventListener('click', onResetProgress);
    this.onParentOpen = onParentOpen;

    this.clearHintTimer = null;
  }

  setStarCount(count) {
    this.starCount.textContent = count;
  }

  setMode(mode) {
    this.modeBtn.textContent = mode === 'phoneme' ? 'Mode: Phoneme' : 'Mode: Blend';
  }

  setRevealLabel(label) {
    document.querySelector('#revealBtn').textContent = label;
  }

  showHint(text) {
    this.hintText.textContent = text;
    this.hintText.style.opacity = text ? '1' : '0';
    if (this.clearHintTimer) {
      clearTimeout(this.clearHintTimer);
    }
    if (text) {
      this.clearHintTimer = setTimeout(() => {
        this.hintText.textContent = '';
        this.hintText.style.opacity = '0';
      }, 2200);
    }
  }

  updateMicLevel(level) {
    const scale = 1 + Math.min(level * 3, 0.8);
    this.micRing.style.setProperty('--mic-scale', scale);
    this.micRing.style.opacity = 0.4 + Math.min(level * 2, 0.6);
  }

  showSuccessFX() {
    burstStars(document.querySelector('#fxLayer'));
  }

  showParent(isVisible) {
    this.parentPanel.classList.toggle('active', isVisible);
    this.parentPanel.setAttribute('aria-hidden', (!isVisible).toString());
  }

  renderParentTable(progressData, cards) {
    if (!cards) {
      return;
    }
    this.parentTable.innerHTML = cards
      .map((card) => {
        const stats = progressData[card.id] || { attempts: 0, successes: 0, lastPracticed: null };
        const label = card.letter || card.word;
        const last = stats.lastPracticed ? new Date(stats.lastPracticed).toLocaleDateString() : '—';
        return `
          <div class="parent-row">
            <div>${label.toUpperCase()}</div>
            <div>Attempts: ${stats.attempts} / Successes: ${stats.successes}</div>
            <div>Last: ${last}</div>
          </div>
        `;
      })
      .join('');
  }

  setupParentLongPress() {
    let timer = null;
    this.logoButton.addEventListener('pointerdown', () => {
      timer = setTimeout(() => {
        this.onParentOpen();
      }, 2000);
    });
    const clear = () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
    this.logoButton.addEventListener('pointerup', clear);
    this.logoButton.addEventListener('pointerleave', clear);
    this.logoButton.addEventListener('pointercancel', clear);
  }
}
