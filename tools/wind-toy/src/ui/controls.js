export function initControls({
  onReset,
  onModeToggle,
  onQualityToggle,
  onFieldToggle,
  onWindMemoryToggle,
  onPhysicsToggle,
  onTempOverlayToggle,
  onBuoyancyChange,
  onShare,
}) {
  const resetButton = document.querySelector("#reset-btn");
  const modeButton = document.querySelector("#mode-btn");
  const qualityButton = document.querySelector("#quality-btn");
  const fieldButton = document.querySelector("#field-btn");
  const windMemoryButton = document.querySelector("#wind-memory-btn");
  const physicsButton = document.querySelector("#physics-btn");
  const tempOverlayButton = document.querySelector("#temp-overlay-btn");
  const buoyancySlider = document.querySelector("#buoyancy-slider");
  const buoyancyValue = document.querySelector("#buoyancy-value");
  const shareButton = document.querySelector("#share-btn");

  const state = {
    mode: "Particles",
    quality: "High",
    field: false,
    windMemory: false,
    physicsMode: "Wind",
    tempOverlay: false,
    buoyancyStrength: 0.5,
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

  const updateFieldLabel = (fieldEnabled, label) => {
    if (!fieldButton) {
      return;
    }
    const nextLabel = label ?? `Field: ${fieldEnabled ? "On" : "Off"}`;
    fieldButton.textContent = nextLabel;
    fieldButton.setAttribute("aria-pressed", fieldEnabled ? "true" : "false");
  };

  const updateWindMemoryLabel = (enabled, label) => {
    if (!windMemoryButton) {
      return;
    }
    const nextLabel = label ?? `Wind Memory: ${enabled ? "On" : "Off"}`;
    windMemoryButton.textContent = nextLabel;
    windMemoryButton.setAttribute("aria-pressed", enabled ? "true" : "false");
  };

  const updatePhysicsLabel = (mode, label) => {
    if (!physicsButton) {
      return;
    }
    const nextLabel = label ?? `Physics: ${mode}`;
    physicsButton.textContent = nextLabel;
    physicsButton.setAttribute("aria-pressed", mode === "Wind+Temperature" ? "true" : "false");
  };

  const updateTempOverlayLabel = (enabled, label) => {
    if (!tempOverlayButton) {
      return;
    }
    const nextLabel = label ?? `Temp Overlay: ${enabled ? "On" : "Off"}`;
    tempOverlayButton.textContent = nextLabel;
    tempOverlayButton.setAttribute("aria-pressed", enabled ? "true" : "false");
  };

  const updateBuoyancyLabel = (strength, label) => {
    if (!buoyancySlider || !buoyancyValue) {
      return;
    }
    const percent = Math.round(strength * 100);
    buoyancyValue.textContent = label ?? `${percent}%`;
    buoyancySlider.value = String(strength);
  };

  const updateShareLabel = (label = "Share") => {
    if (!shareButton) {
      return;
    }
    shareButton.textContent = label;
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

  fieldButton?.addEventListener("click", () => {
    state.field = !state.field;
    updateFieldLabel(state.field);
    onFieldToggle?.(state.field);
  });

  windMemoryButton?.addEventListener("click", () => {
    state.windMemory = !state.windMemory;
    updateWindMemoryLabel(state.windMemory);
    onWindMemoryToggle?.(state.windMemory);
  });

  physicsButton?.addEventListener("click", () => {
    state.physicsMode = state.physicsMode === "Wind" ? "Wind+Temperature" : "Wind";
    updatePhysicsLabel(state.physicsMode);
    onPhysicsToggle?.(state.physicsMode);
  });

  tempOverlayButton?.addEventListener("click", () => {
    state.tempOverlay = !state.tempOverlay;
    updateTempOverlayLabel(state.tempOverlay);
    onTempOverlayToggle?.(state.tempOverlay);
  });

  buoyancySlider?.addEventListener("input", (event) => {
    const value = Number(event.target.value);
    state.buoyancyStrength = value;
    updateBuoyancyLabel(value);
    onBuoyancyChange?.(value);
  });

  shareButton?.addEventListener("click", () => {
    onShare?.();
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
    setField: (fieldEnabled, label) => {
      state.field = fieldEnabled;
      updateFieldLabel(fieldEnabled, label);
    },
    setWindMemory: (enabled, label) => {
      state.windMemory = enabled;
      updateWindMemoryLabel(enabled, label);
    },
    setPhysics: (mode, label) => {
      state.physicsMode = mode;
      updatePhysicsLabel(mode, label);
    },
    setTempOverlay: (enabled, label) => {
      state.tempOverlay = enabled;
      updateTempOverlayLabel(enabled, label);
    },
    setBuoyancy: (strength, label) => {
      state.buoyancyStrength = strength;
      updateBuoyancyLabel(strength, label);
    },
    setShareLabel: (label) => {
      updateShareLabel(label);
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
