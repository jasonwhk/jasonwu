export const MODES = {
  RAINBOW_BREATHING: 'RAINBOW_BREATHING',
  PAINT_RAINBOW: 'PAINT_RAINBOW',
};

export const PRESETS = {
  SHORT: 'short',
  MEDIUM: 'medium',
  FREE: 'free',
};

export const PRESET_CYCLES = {
  [PRESETS.SHORT]: 1,
  [PRESETS.MEDIUM]: 7,
  [PRESETS.FREE]: Infinity,
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
    completed: false,
    mode: MODES.RAINBOW_BREATHING,
    preset: PRESETS.MEDIUM,
    phase: 'inhale',
    phaseTime: 0,
    cycleCount: 0,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    phases: { ...DEFAULT_PHASES },
  };
}

export function resetSession(state) {
  state.phase = 'inhale';
  state.phaseTime = 0;
  state.cycleCount = 1;
  state.completed = false;
  state.paused = false;
}

function getPresetTarget(preset) {
  return PRESET_CYCLES[preset] ?? Infinity;
}

function transitionPhase(state) {
  const currentIndex = PHASES.indexOf(state.phase);
  const nextIndex = (currentIndex + 1) % PHASES.length;
  const nextPhase = PHASES[nextIndex];
  const targetCycles = getPresetTarget(state.preset);

  if (nextPhase === 'inhale' && targetCycles !== Infinity && state.cycleCount >= targetCycles) {
    state.completed = true;
    state.paused = true;
    return;
  }

  state.phase = nextPhase;
  if (state.phase === 'inhale') {
    state.cycleCount += 1;
  }
}

export function advanceBreath(state, dt) {
  if (state.paused || !state.started || state.completed) {
    return;
  }

  const duration = state.phases[state.phase];
  if (duration === 0) {
    transitionPhase(state);
    return;
  }

  state.phaseTime += dt;

  if (state.phaseTime < duration) {
    return;
  }

  state.phaseTime = 0;
  transitionPhase(state);
}

export function getPhaseProgress(state) {
  const duration = state.phases[state.phase] || 1;
  if (duration === 0) {
    return 1;
  }
  return Math.min(1, state.phaseTime / duration);
}
