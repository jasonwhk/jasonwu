export function initControls({ onReset, onModeToggle, onQualityToggle }) {
  const resetButton = document.querySelector("#reset-btn");
  const modeButton = document.querySelector("#mode-btn");
  const qualityButton = document.querySelector("#quality-btn");

  const state = {
    mode: "Particles",
    quality: "High",
  };

  const updateModeLabel = (mode, label) => {
    const nextLabel = label ?? `Mode: ${mode}`;
    modeButton.textContent = nextLabel;
    modeButton.setAttribute("aria-pressed", mode === "Smoke");
  };

  const updateQualityLabel = (quality, label) => {
    const nextLabel = label ?? `Quality: ${quality}`;
    qualityButton.textContent = nextLabel;
    qualityButton.setAttribute("aria-pressed", quality === "Low");
  };

  resetButton?.addEventListener("click", () => {
    onReset?.();
  });

  modeButton?.addEventListener("click", () => {
    state.mode = state.mode === "Particles" ? "Smoke" : "Particles";
    updateModeLabel(state.mode);
    onModeToggle?.(state.mode);
  });

  qualityButton?.addEventListener("click", () => {
    state.quality = state.quality === "High" ? "Low" : "High";
    updateQualityLabel(state.quality);
    onQualityToggle?.(state.quality);
  });

  return {
    setMode: (mode, label) => {
      state.mode = mode;
      updateModeLabel(mode, label);
    },
    setQuality: (quality, label) => {
      state.quality = quality;
      updateQualityLabel(quality, label);
    },
    setStatus: (modeLabel, qualityLabel) => {
      if (modeLabel) {
        updateModeLabel(state.mode, modeLabel);
      }
      if (qualityLabel) {
        updateQualityLabel(state.quality, qualityLabel);
      }
    },
  };
}
