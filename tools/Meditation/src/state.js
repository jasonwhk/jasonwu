export const MODES = {
  RAINBOW_BREATHING: 'RAINBOW_BREATHING',
  PAINT_RAINBOW: 'PAINT_RAINBOW',
};

export const PHASES = ['inhale', 'hold', 'exhale', 'rest'];

const DEFAULT_PHASES = {
  inhale: 4,
  hold: 2,
  exhale: 5,
  rest: 0,
};

export function createState() {
  return {
    started: false,
    paused: false,
    mode: MODES.RAINBOW_BREATHING,
    phase: 'inhale',
    phaseTime: 0,
    cycleCount: 0,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    phases: { ...DEFAULT_PHASES },
  };
}

export function advanceBreath(state, dt) {
  if (state.paused || !state.started) {
    return;
  }

  const duration = state.phases[state.phase];
  state.phaseTime += dt;

  if (state.phaseTime < duration || duration === 0) {
    return;
  }

  state.phaseTime = 0;
  const currentIndex = PHASES.indexOf(state.phase);
  const nextIndex = (currentIndex + 1) % PHASES.length;
  state.phase = PHASES[nextIndex];

  if (state.phase === 'inhale') {
    state.cycleCount += 1;
  }
}

export function getPhaseProgress(state) {
  const duration = state.phases[state.phase] || 1;
  if (duration === 0) {
    return 1;
  }
  return Math.min(1, state.phaseTime / duration);
}
