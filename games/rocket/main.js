const ROUND_DURATION_MS = 4500;
const MISSION_DURATION_MS = 90000;
const COOLDOWN_MS = 800;
const LANDING_DURATION_MS = 3000;

const elements = {
  missionTimer: document.getElementById("missionTimer"),
  streakCount: document.getElementById("streakCount"),
  numberDisplay: document.getElementById("numberDisplay"),
  ringProgress: document.querySelector(".ring-progress"),
  fuelButton: document.getElementById("fuelButton"),
  message: document.getElementById("message"),
  menu: document.getElementById("menu"),
  summary: document.getElementById("summary"),
  startButton: document.getElementById("startButton"),
  playAgainButton: document.getElementById("playAgainButton"),
  totalSuccess: document.getElementById("totalSuccess"),
  bestStreak: document.getElementById("bestStreak"),
  pauseOverlay: document.getElementById("pauseOverlay"),
  parentTrigger: document.getElementById("parentTrigger"),
  parentBar: document.getElementById("parentBar"),
  pauseButton: document.getElementById("pauseButton"),
  landButton: document.getElementById("landButton"),
  starfield: document.getElementById("starfield"),
  rewardLayer: document.getElementById("rewardLayer"),
  trailLayer: document.getElementById("trailLayer"),
};

const state = {
  mode: "MENU",
  missionRemaining: MISSION_DURATION_MS,
  roundRemaining: ROUND_DURATION_MS,
  streak: 0,
  bestStreak: 0,
  successes: 0,
  lastTick: 0,
  cooldownUntil: 0,
  landingUntil: 0,
  parentHoldId: null,
  previousMode: null,
};

const ringCircumference = 2 * Math.PI * 52;
const rewardTrails = ["comet", "rainbow"];
const rewardMessages = ["Nice boost!", "Great job!", "Woohoo!", "Blast off!"];
const stickerPhrases = ["SUPER LAUNCH!", "RAD!", "ZOOM!", "STAR POWER!"];

function clearRewardLayer() {
  elements.rewardLayer.innerHTML = "";
  elements.trailLayer.className = "trail-layer";
}

function spawnSparkles(count) {
  const bounds = elements.rewardLayer.getBoundingClientRect();
  for (let i = 0; i < count; i += 1) {
    const sparkle = document.createElement("span");
    sparkle.className = "sparkle";
    sparkle.style.left = `${Math.random() * bounds.width}px`;
    sparkle.style.top = `${Math.random() * bounds.height * 0.6 + bounds.height * 0.1}px`;
    sparkle.style.background = `hsl(${Math.random() * 60 + 180}, 90%, 70%)`;
    sparkle.style.animationDelay = `${Math.random() * 0.2}s`;
    elements.rewardLayer.appendChild(sparkle);
  }
}

function spawnMeteors(count) {
  const bounds = elements.rewardLayer.getBoundingClientRect();
  for (let i = 0; i < count; i += 1) {
    const meteor = document.createElement("span");
    meteor.className = "meteor";
    meteor.style.left = `${Math.random() * bounds.width * 0.6}px`;
    meteor.style.top = `${Math.random() * bounds.height * 0.5}px`;
    meteor.style.animationDelay = `${Math.random() * 0.3}s`;
    elements.rewardLayer.appendChild(meteor);
  }
}

function spawnStickerBurst() {
  const sticker = document.createElement("span");
  sticker.className = "sticker";
  sticker.textContent = stickerPhrases[Math.floor(Math.random() * stickerPhrases.length)];
  sticker.style.left = "50%";
  sticker.style.top = "25%";
  sticker.style.transform = "translateX(-50%)";
  elements.rewardLayer.appendChild(sticker);
}

function showRewardMessage(text) {
  const message = document.createElement("div");
  message.className = "reward-message";
  message.textContent = text;
  elements.rewardLayer.appendChild(message);
}

function applyTrail(tier) {
  const trailClass = tier >= 4 ? "rainbow" : rewardTrails[Math.floor(Math.random() * rewardTrails.length)];
  elements.trailLayer.className = `trail-layer active ${trailClass}`;
}

function triggerRewardTier(tier) {
  clearRewardLayer();
  if (tier >= 1) {
    spawnSparkles(6 + tier * 2);
  }
  if (tier >= 2) {
    spawnSparkles(6);
  }
  if (tier >= 3) {
    spawnMeteors(4);
  }
  if (tier >= 4) {
    applyTrail(tier);
  }
  if (tier >= 5) {
    spawnStickerBurst();
    showRewardMessage("SUPER LAUNCH!");
  } else {
    showRewardMessage(rewardMessages[Math.floor(Math.random() * rewardMessages.length)]);
  }
  window.setTimeout(() => {
    elements.trailLayer.classList.remove("active");
  }, 1200);
}

function setRingProgress(progress) {
  const offset = ringCircumference * (1 - progress);
  elements.ringProgress.style.strokeDasharray = `${ringCircumference}`;
  elements.ringProgress.style.strokeDashoffset = `${offset}`;
  if (progress < 0.2) {
    elements.ringProgress.style.stroke = "#ff8b7a";
  } else {
    elements.ringProgress.style.stroke = "#6cf0ff";
  }
}

function randomNumber() {
  return Math.floor(Math.random() * 20) + 1;
}

function updateNumber() {
  elements.numberDisplay.textContent = randomNumber();
}

function showMessage(text, className) {
  elements.message.textContent = text;
  elements.message.classList.remove("success", "miss");
  if (className) {
    elements.message.classList.add(className);
  }
}

function setOverlay(element, visible) {
  element.classList.toggle("hidden", !visible);
  element.setAttribute("aria-hidden", String(!visible));
}

function resetMission() {
  state.missionRemaining = MISSION_DURATION_MS;
  state.roundRemaining = ROUND_DURATION_MS;
  state.streak = 0;
  state.bestStreak = 0;
  state.successes = 0;
  state.cooldownUntil = 0;
  state.landingUntil = 0;
  updateNumber();
  showMessage("", "");
  clearRewardLayer();
}

function startMission() {
  resetMission();
  state.mode = "COUNTDOWN";
  state.lastTick = performance.now();
  setOverlay(elements.menu, false);
  setOverlay(elements.summary, false);
  setOverlay(elements.pauseOverlay, false);
  setOverlay(elements.parentBar, false);
  state.previousMode = null;
  setPauseLabel();
}

function finishMission() {
  state.mode = "SUMMARY";
  elements.totalSuccess.textContent = state.successes;
  elements.bestStreak.textContent = state.bestStreak;
  setOverlay(elements.summary, true);
  setOverlay(elements.pauseOverlay, false);
  setPauseLabel();
}

function succeed() {
  if (state.mode !== "COUNTDOWN") {
    return;
  }
  state.successes += 1;
  state.streak += 1;
  state.bestStreak = Math.max(state.bestStreak, state.streak);
  const rewardTier = Math.min(5, state.streak);
  showMessage("Boost!", "success");
  triggerRewardTier(rewardTier);
  state.mode = "SUCCESS";
  state.cooldownUntil = performance.now() + COOLDOWN_MS;
}

function miss() {
  showMessage("Oops! Try again!", "miss");
  state.streak = Math.max(0, state.streak - 1);
  clearRewardLayer();
  state.mode = "MISS";
  state.cooldownUntil = performance.now() + COOLDOWN_MS;
}

function startRound() {
  state.roundRemaining = ROUND_DURATION_MS;
  updateNumber();
  showMessage("", "");
  clearRewardLayer();
  state.mode = "COUNTDOWN";
}

function triggerLanding() {
  if (state.mode === "SUMMARY" || state.mode === "MENU") {
    return;
  }
  state.mode = "LANDING";
  state.landingUntil = performance.now() + LANDING_DURATION_MS;
  showMessage("Landing sequence...", "");
  setOverlay(elements.parentBar, false);
  setOverlay(elements.pauseOverlay, false);
  setPauseLabel();
}

function setPauseLabel() {
  if (!elements.pauseButton) {
    return;
  }
  elements.pauseButton.textContent = state.mode === "PAUSED" ? "Resume" : "Pause";
}

function togglePause() {
  if (state.mode === "PAUSED") {
    state.mode = state.previousMode || "COUNTDOWN";
    state.previousMode = null;
    setOverlay(elements.pauseOverlay, false);
    state.lastTick = performance.now();
    setPauseLabel();
    return;
  }

  if (["COUNTDOWN", "SUCCESS", "MISS"].includes(state.mode)) {
    state.previousMode = state.mode;
    state.mode = "PAUSED";
    setOverlay(elements.pauseOverlay, true);
    showMessage("Paused", "");
    setPauseLabel();
  }
}

function tick(now) {
  const delta = now - state.lastTick;
  state.lastTick = now;

  if (state.mode === "PAUSED") {
    requestAnimationFrame(tick);
    return;
  }

  if (state.mode === "COUNTDOWN") {
    state.roundRemaining -= delta;
    state.missionRemaining -= delta;
    if (state.roundRemaining <= 0) {
      miss();
    }
    if (state.missionRemaining <= 0) {
      finishMission();
    }
  }

  if (state.mode === "SUCCESS" || state.mode === "MISS") {
    if (now >= state.cooldownUntil) {
      if (state.missionRemaining <= 0) {
        finishMission();
      } else {
        startRound();
      }
    }
  }

  if (state.mode === "LANDING") {
    if (now >= state.landingUntil) {
      finishMission();
    }
  }

  const missionSeconds = Math.max(0, Math.ceil(state.missionRemaining / 1000));
  elements.missionTimer.textContent = missionSeconds;
  elements.streakCount.textContent = state.streak;

  const progress = Math.max(0, state.roundRemaining / ROUND_DURATION_MS);
  setRingProgress(progress);

  requestAnimationFrame(tick);
}

function resizeCanvas() {
  const { width, height } = elements.starfield.getBoundingClientRect();
  const scale = window.devicePixelRatio || 1;
  elements.starfield.width = Math.floor(width * scale);
  elements.starfield.height = Math.floor(height * scale);
  drawStars();
}

function drawStars() {
  const ctx = elements.starfield.getContext("2d");
  if (!ctx) {
    return;
  }
  const scale = window.devicePixelRatio || 1;
  const width = elements.starfield.width;
  const height = elements.starfield.height;
  ctx.clearRect(0, 0, width, height);
  for (let i = 0; i < 120; i += 1) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const radius = (Math.random() * 1.8 + 0.4) * scale;
    ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.8 + 0.2})`;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function attachEvents() {
  elements.startButton.addEventListener("click", startMission);
  elements.playAgainButton.addEventListener("click", startMission);
  elements.fuelButton.addEventListener("click", succeed);
  elements.numberDisplay.addEventListener("click", succeed);

  const parentHoldDuration = 2000;
  elements.parentTrigger.addEventListener("pointerdown", () => {
    if (state.parentHoldId) {
      return;
    }
    state.parentHoldId = window.setTimeout(() => {
      setOverlay(elements.parentBar, true);
      state.parentHoldId = null;
    }, parentHoldDuration);
  });

  const clearParentHold = () => {
    if (state.parentHoldId) {
      window.clearTimeout(state.parentHoldId);
      state.parentHoldId = null;
    }
  };

  elements.parentTrigger.addEventListener("pointerup", clearParentHold);
  elements.parentTrigger.addEventListener("pointerleave", clearParentHold);
  elements.parentTrigger.addEventListener("pointercancel", clearParentHold);

  elements.pauseButton.addEventListener("click", togglePause);
  elements.landButton.addEventListener("click", triggerLanding);

  window.addEventListener("resize", resizeCanvas);
}

function init() {
  updateNumber();
  resizeCanvas();
  attachEvents();
  state.lastTick = performance.now();
  requestAnimationFrame(tick);
}

init();
