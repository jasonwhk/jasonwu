export function initControls({
  onReset,
  onModeToggle,
  onBrushToggle,
  onQualityToggle,
  onFieldToggle,
  onWindMemoryToggle,
  onPhysicsToggle,
  onTempOverlayToggle,
  onBuoyancyChange,
  onThemeChange,
  onToolToggle,
  onObstacleOverlayToggle,
  onClearObstacles,
  onSoundToggle,
  onSoundVolumeChange,
  onShare,
}) {
  const resetButton = document.querySelector("#reset-btn");
  const modeButton = document.querySelector("#mode-btn");
  const brushButton = document.querySelector("#brush-btn");
  const qualityButton = document.querySelector("#quality-btn");
  const fieldButton = document.querySelector("#field-btn");
  const windMemoryButton = document.querySelector("#wind-memory-btn");
  const physicsButton = document.querySelector("#physics-btn");
  const tempOverlayButton = document.querySelector("#temp-overlay-btn");
  const buoyancySlider = document.querySelector("#buoyancy-slider");
  const buoyancyValue = document.querySelector("#buoyancy-value");
  const themeSelect = document.querySelector("#theme-select");
  const toolButton = document.querySelector("#tool-btn");
  const obstacleOverlayButton = document.querySelector("#obstacle-overlay-btn");
  const clearObstaclesButton = document.querySelector("#clear-obstacles-btn");
  const soundButton = document.querySelector("#sound-btn");
  const soundSlider = document.querySelector("#sound-slider");
  const soundValue = document.querySelector("#sound-value");
  const shareButton = document.querySelector("#share-btn");

  const state = {
    mode: "Particles",
    brushMode: "Push",
    quality: "High",
    field: false,
    windMemory: false,
    physicsMode: "Wind",
    tempOverlay: false,
    buoyancyStrength: 0.5,
    theme: "Classic",
    toolMode: "Wind",
    obstacleOverlay: false,
    soundEnabled: false,
    soundVolume: 0.25,
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

  const updateBrushLabel = (mode, label) => {
    if (!brushButton) {
      return;
    }
    const nextLabel = label ?? `Brush: ${mode}`;
    brushButton.textContent = nextLabel;
    brushButton.setAttribute("aria-pressed", mode === "Vortex" ? "true" : "false");
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

  const updateToolLabel = (mode, label) => {
    if (!toolButton) {
      return;
    }
    const nextLabel = label ?? `Tool: ${mode}`;
    toolButton.textContent = nextLabel;
    toolButton.setAttribute("aria-pressed", mode === "Obstacles" ? "true" : "false");
  };

  const updateObstacleOverlayLabel = (enabled, label) => {
    if (!obstacleOverlayButton) {
      return;
    }
    const nextLabel = label ?? `Obstacles: ${enabled ? "On" : "Off"}`;
    obstacleOverlayButton.textContent = nextLabel;
    obstacleOverlayButton.setAttribute("aria-pressed", enabled ? "true" : "false");
  };

  const updateSoundLabel = (enabled, label) => {
    if (!soundButton) {
      return;
    }
    const nextLabel = label ?? `Sound: ${enabled ? "On" : "Off"}`;
    soundButton.textContent = nextLabel;
    soundButton.setAttribute("aria-pressed", enabled ? "true" : "false");
  };

  const updateSoundVolumeLabel = (volume, label) => {
    if (!soundSlider || !soundValue) {
      return;
    }
    const percent = Math.round(volume * 100);
    soundValue.textContent = label ?? `${percent}%`;
    soundSlider.value = String(volume);
  };

  const updateThemeLabel = (theme) => {
    if (!themeSelect) {
      return;
    }
    themeSelect.value = theme;
  };

  resetButton?.addEventListener("click", () => {
    onReset?.();
  });

  modeButton?.addEventListener("click", () => {
    state.mode = state.mode === "Particles" ? "Smoke" : "Particles";
    updateModeLabel(state.mode);
    onModeToggle?.(state.mode);
  });

  brushButton?.addEventListener("click", () => {
    state.brushMode = state.brushMode === "Push" ? "Vortex" : "Push";
    updateBrushLabel(state.brushMode);
    onBrushToggle?.(state.brushMode);
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

  themeSelect?.addEventListener("change", (event) => {
    const value = event.target.value;
    state.theme = value;
    updateThemeLabel(value);
    onThemeChange?.(value);
  });

  shareButton?.addEventListener("click", () => {
    onShare?.();
  });

  toolButton?.addEventListener("click", () => {
    state.toolMode = state.toolMode === "Wind" ? "Obstacles" : "Wind";
    updateToolLabel(state.toolMode);
    onToolToggle?.(state.toolMode);
  });

  obstacleOverlayButton?.addEventListener("click", () => {
    state.obstacleOverlay = !state.obstacleOverlay;
    updateObstacleOverlayLabel(state.obstacleOverlay);
    onObstacleOverlayToggle?.(state.obstacleOverlay);
  });

  soundButton?.addEventListener("click", () => {
    state.soundEnabled = !state.soundEnabled;
    updateSoundLabel(state.soundEnabled);
    onSoundToggle?.(state.soundEnabled);
  });

  soundSlider?.addEventListener("input", (event) => {
    const value = Number(event.target.value);
    state.soundVolume = value;
    updateSoundVolumeLabel(value);
    onSoundVolumeChange?.(value);
  });

  clearObstaclesButton?.addEventListener("click", () => {
    onClearObstacles?.();
  });

  return {
    setMode: (mode, label) => {
      state.mode = mode;
      updateModeLabel(mode, label);
    },
    setBrush: (mode, label) => {
      state.brushMode = mode;
      updateBrushLabel(mode, label);
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
    setTheme: (theme) => {
      state.theme = theme;
      updateThemeLabel(theme);
    },
    setTool: (mode, label) => {
      state.toolMode = mode;
      updateToolLabel(mode, label);
    },
    setObstacleOverlay: (enabled, label) => {
      state.obstacleOverlay = enabled;
      updateObstacleOverlayLabel(enabled, label);
    },
    setSound: (enabled, label) => {
      state.soundEnabled = enabled;
      updateSoundLabel(enabled, label);
    },
    setSoundVolume: (volume, label) => {
      state.soundVolume = volume;
      updateSoundVolumeLabel(volume, label);
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
