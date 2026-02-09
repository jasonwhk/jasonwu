import { createScene } from './scene.js';
import { loadCardData } from './data.js';
import { AudioManager } from './audio.js';
import { MicMonitor } from './mic.js';
import { SpeechCoach } from './speech.js';
import { ProgressTracker } from './progress.js';
import { UIController } from './ui.js';

const canvas = document.querySelector('#scene');
const promptText = document.querySelector('#promptText');
const hintText = document.querySelector('#hintText');

canvas.addEventListener('pointerdown', () => toggleFlip());

const state = {
  mode: 'phoneme',
  cards: [],
  currentIndex: 0,
  flipped: false,
};

const audio = new AudioManager();
const speechCoach = new SpeechCoach();
const progress = new ProgressTracker();
const mic = new MicMonitor({
  onLevel: (level) => ui.updateMicLevel(level),
  onSpeech: () => handleSuccess('Great listening!'),
  onSilence: () => {
    scene.wobble();
    ui.showHint('Try again when you are ready.');
  },
  onPermissionError: () => ui.showHint('Mic is off. You can still listen and tap Next.'),
});

const scene = createScene(canvas);
const ui = new UIController({
  promptText,
  hintText,
  onListen: () => playCurrent(),
  onReveal: () => toggleFlip(true),
  onNext: () => nextCard(),
  onShuffle: () => shuffleCards(),
  onModeToggle: () => toggleMode(),
  onMicStart: () => mic.start(),
  onMicStop: () => mic.stop(),
  onParentOpen: () => showParent(),
  onParentClose: () => hideParent(),
  onResetProgress: () => resetProgress(),
});

let parentViewVisible = false;

init();

async function init() {
  const data = await loadCardData();
  state.cards = data.phonemes;
  state.mode = 'phoneme';
  updateCard();
  scene.start();
  ui.setMode(state.mode);
  updateProgress();
  ui.setupParentLongPress();
  if (new URLSearchParams(window.location.search).get('parent') === '1') {
    showParent();
  }
}

function updateCard() {
  const card = state.cards[state.currentIndex];
  if (!card) {
    return;
  }
  state.flipped = false;
  scene.updateCard(card, state.mode);
  promptText.textContent = state.mode === 'phoneme'
    ? `Say the sound: ${card.prompt}`
    : 'Say the word';
  hintText.textContent = '';
  ui.setRevealLabel(state.mode === 'phoneme' ? 'Reveal' : 'Show Word');
  progress.recordAttempt(card.id);
  updateProgress();
}

function updateProgress() {
  const total = progress.getTotalSuccesses();
  ui.setStarCount(total);
  if (parentViewVisible) {
    ui.renderParentTable(progress.getAll(), state.cards);
  }
}

async function playCurrent() {
  const card = state.cards[state.currentIndex];
  if (!card) {
    return;
  }
  await audio.init();
  if (state.mode === 'phoneme') {
    await audio.playPhoneme(card);
  } else {
    await audio.playBlend(card);
  }
}

function toggleFlip(forceReveal = false) {
  state.flipped = forceReveal ? true : !state.flipped;
  scene.flip(state.flipped);
}

function nextCard() {
  state.currentIndex = (state.currentIndex + 1) % state.cards.length;
  updateCard();
}

function shuffleCards() {
  state.cards = [...state.cards].sort(() => Math.random() - 0.5);
  state.currentIndex = 0;
  updateCard();
  ui.showHint('Shuffled!');
}

function toggleMode() {
  const data = loadCardData.getCached();
  state.mode = state.mode === 'phoneme' ? 'blend' : 'phoneme';
  state.cards = state.mode === 'phoneme' ? data.phonemes : data.words;
  state.currentIndex = 0;
  updateCard();
  ui.setMode(state.mode);
}

function handleSuccess(message) {
  const card = state.cards[state.currentIndex];
  progress.recordSuccess(card.id);
  updateProgress();
  scene.glow();
  ui.showSuccessFX();
  ui.showHint(message);
  if (state.mode === 'blend') {
    speechCoach.encourage(card.word);
  }
  setTimeout(() => nextCard(), 1200);
}

function showParent() {
  parentViewVisible = true;
  ui.showParent(true);
  ui.renderParentTable(progress.getAll(), state.cards);
}

function hideParent() {
  parentViewVisible = false;
  ui.showParent(false);
}

function resetProgress() {
  if (window.confirm('Reset all progress?')) {
    progress.reset();
    updateProgress();
  }
}

window.addEventListener('resize', () => scene.resize());
