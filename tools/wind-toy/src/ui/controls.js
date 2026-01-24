export function initControls({ onReset, onModeToggle, onQualityToggle }) {
  const resetButton = document.querySelector("#reset-btn");
  const modeButton = document.querySelector("#mode-btn");
  const qualityButton = document.querySelector("#quality-btn");

  const state = {
    mode: "Particles",
    quality: "High",
  };

  resetButton?.addEventListener("click", () => {
    onReset?.();
  });

  modeButton?.addEventListener("click", () => {
    state.mode = state.mode === "Particles" ? "Smoke" : "Particles";
    modeButton.textContent = `Mode: ${state.mode}`;
    modeButton.setAttribute("aria-pressed", state.mode === "Smoke");
    onModeToggle?.(state.mode);
  });

  qualityButton?.addEventListener("click", () => {
    state.quality = state.quality === "High" ? "Low" : "High";
    qualityButton.textContent = `Quality: ${state.quality}`;
    qualityButton.setAttribute("aria-pressed", state.quality === "Low");
    onQualityToggle?.(state.quality);
  });

  return {
    setStatus: (modeLabel, qualityLabel) => {
      if (modeLabel) {
        modeButton.textContent = modeLabel;
      }
      if (qualityLabel) {
        qualityButton.textContent = qualityLabel;
      }
    },
  };
}
