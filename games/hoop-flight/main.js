import * as THREE from 'three';

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x9ecfff, 130, 700);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 2000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

scene.background = new THREE.Color(0x8dc8ff);

scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const sun = new THREE.DirectionalLight(0xfff2da, 1.05);
sun.position.set(80, 120, 40);
scene.add(sun);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(2000, 2000),
  new THREE.MeshStandardMaterial({ color: 0xd6e6af, roughness: 0.95 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -45;
scene.add(ground);

const plane = new THREE.Group();
const body = new THREE.Mesh(
  new THREE.BoxGeometry(1.2, 0.35, 2.6),
  new THREE.MeshStandardMaterial({ color: 0xe43939, metalness: 0.2, roughness: 0.5 })
);
const wing = new THREE.Mesh(
  new THREE.BoxGeometry(3.3, 0.12, 0.8),
  new THREE.MeshStandardMaterial({ color: 0xd6d6d6, metalness: 0.3, roughness: 0.45 })
);
wing.position.set(0, -0.02, 0.2);
const tail = new THREE.Mesh(
  new THREE.BoxGeometry(0.2, 0.6, 0.45),
  new THREE.MeshStandardMaterial({ color: 0xd6d6d6, metalness: 0.3, roughness: 0.45 })
);
tail.position.set(0, 0.35, 1.0);
plane.add(body, wing, tail);
scene.add(plane);

const hoopMaterial = new THREE.MeshStandardMaterial({ color: 0xffd400, emissive: 0x5e4c00, metalness: 0.15, roughness: 0.35 });
const passedMaterial = new THREE.MeshStandardMaterial({ color: 0x66f07b, emissive: 0x123e1a, metalness: 0.15, roughness: 0.45 });

const HOOP_COUNT = 28;
const HOOP_RADIUS = 5;
const hoops = [];

const pathPoints = [];
for (let i = 0; i < 20; i += 1) {
  const a = i * 0.62;
  pathPoints.push(
    new THREE.Vector3(
      Math.sin(a) * (55 + (i % 5) * 8),
      24 + Math.cos(a * 1.5) * 14 + i * 1.8,
      -i * 37
    )
  );
}
const curve = new THREE.CatmullRomCurve3(pathPoints, false, 'catmullrom', 0.5);

for (let i = 0; i < HOOP_COUNT; i += 1) {
  const t = i / (HOOP_COUNT - 1);
  const p = curve.getPointAt(t);
  const tangent = curve.getTangentAt(t).normalize();
  const mesh = new THREE.Mesh(new THREE.TorusGeometry(HOOP_RADIUS, 0.5, 16, 42), hoopMaterial.clone());

  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);
  mesh.quaternion.copy(q);
  mesh.position.copy(p);

  scene.add(mesh);
  hoops.push({ mesh, center: p.clone(), normal: tangent.clone(), radius: HOOP_RADIUS, passed: false, prevSide: null });
}

const starGeo = new THREE.BufferGeometry();
const stars = [];
for (let i = 0; i < 650; i += 1) {
  stars.push((Math.random() - 0.5) * 1900, Math.random() * 900 + 50, (Math.random() - 0.5) * 1900);
}
starGeo.setAttribute('position', new THREE.Float32BufferAttribute(stars, 3));
scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: true })));

const SMOKE_COUNT = 120;
const smokeParticles = Array.from({ length: SMOKE_COUNT }, () => ({
  mesh: null,
  velocity: new THREE.Vector3(),
  life: 0,
  maxLife: 1,
  active: false
}));
const smokeGroup = new THREE.Group();
const smokeGeometry = new THREE.SphereGeometry(0.45, 8, 8);
for (let i = 0; i < SMOKE_COUNT; i += 1) {
  const mat = new THREE.MeshStandardMaterial({
    color: 0xd8d8d8,
    emissive: 0x2e2e2e,
    roughness: 1,
    metalness: 0,
    transparent: true,
    opacity: 0,
    depthWrite: false
  });
  const puff = new THREE.Mesh(smokeGeometry, mat);
  puff.visible = false;
  smokeGroup.add(puff);
  smokeParticles[i].mesh = puff;
}
scene.add(smokeGroup);
let smokeCursor = 0;

const state = {
  throttle: 26,
  speed: 26,
  minSpeed: 10,
  maxSpeed: 60,
  accel: 23,
  drag: 0.65,
  started: false,
  finished: false,
  startTime: 0,
  elapsed: 0,
  currentHoop: 0,
  lastCheckpoint: 0,
  invertPitch: localStorage.getItem('hoopFlightInvertPitch') === 'true',
  mouseSteer: localStorage.getItem('hoopFlightMouseSteer') === 'true'
};

const ui = {
  score: document.getElementById('score'),
  total: document.getElementById('total'),
  timer: document.getElementById('timer'),
  speed: document.getElementById('speed'),
  finish: document.getElementById('finish'),
  invertPitchToggle: document.getElementById('invertPitchToggle'),
  mouseSteerToggle: document.getElementById('mouseSteerToggle'),
  mouseModeHint: document.getElementById('mouseModeHint')
};
ui.total.textContent = `${HOOP_COUNT}`;
ui.invertPitchToggle.checked = state.invertPitch;
ui.invertPitchToggle.addEventListener('change', () => {
  state.invertPitch = ui.invertPitchToggle.checked;
  localStorage.setItem('hoopFlightInvertPitch', String(state.invertPitch));
});
ui.mouseSteerToggle.checked = state.mouseSteer;
ui.mouseSteerToggle.addEventListener('change', () => {
  state.mouseSteer = ui.mouseSteerToggle.checked;
  localStorage.setItem('hoopFlightMouseSteer', String(state.mouseSteer));
  if (!state.mouseSteer && document.pointerLockElement === renderer.domElement) {
    document.exitPointerLock();
  }
  ui.mouseModeHint.classList.add('hidden');
});

const keys = new Set();
const inputKeys = new Set(['KeyW', 'KeyS', 'KeyA', 'KeyD', 'KeyQ', 'KeyE', 'ShiftLeft', 'ShiftRight', 'ControlLeft', 'ControlRight']);
const mouseInput = { pitch: 0, yaw: 0 };
const mouseSettings = { pitchScale: 0.0028, yawScale: 0.0024, returnSpeed: 3.2, maxAxis: 1.5 };
const flightTuning = {
  pitchSensitivity: 2.3,
  yawSensitivity: 1.9,
  rollSensitivity: 2.05,
  angularResponse: 7.2,
  angularDamping: 2.15,
  autoRollStrength: 0.9,
  autoRollMax: 0.2,
  autoRollDeadzone: 0.03,
  noseDropStrength: 0.32,
  noseDropStart: 0.52
};

window.addEventListener('keydown', (event) => {
  keys.add(event.code);
  if (inputKeys.has(event.code) && !state.started && !state.finished) {
    state.started = true;
    state.startTime = performance.now();
  }
  if (event.code === 'KeyR') {
    resetRun();
  }
  if (event.code === 'Space') {
    respawnAtCheckpoint();
  }
  if (event.code === 'KeyM') {
    state.mouseSteer = false;
    ui.mouseSteerToggle.checked = false;
    localStorage.setItem('hoopFlightMouseSteer', 'false');
    if (document.pointerLockElement === renderer.domElement) {
      document.exitPointerLock();
    }
  }
});
window.addEventListener('keyup', (event) => keys.delete(event.code));

renderer.domElement.addEventListener('click', () => {
  if (!state.mouseSteer || state.finished) return;
  renderer.domElement.requestPointerLock();
});

document.addEventListener('pointerlockchange', () => {
  if (document.pointerLockElement !== renderer.domElement) {
    mouseInput.pitch = 0;
    mouseInput.yaw = 0;
    ui.mouseModeHint.classList.add('hidden');
  } else {
    ui.mouseModeHint.classList.remove('hidden');
  }
});

window.addEventListener('mousemove', (event) => {
  if (!state.mouseSteer || document.pointerLockElement !== renderer.domElement) return;

  mouseInput.pitch = THREE.MathUtils.clamp(
    mouseInput.pitch - event.movementY * mouseSettings.pitchScale,
    -mouseSettings.maxAxis,
    mouseSettings.maxAxis
  );
  mouseInput.yaw = THREE.MathUtils.clamp(
    mouseInput.yaw - event.movementX * mouseSettings.yawScale,
    -mouseSettings.maxAxis,
    mouseSettings.maxAxis
  );

  if (!state.started && !state.finished) {
    state.started = true;
    state.startTime = performance.now();
  }
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const audioContext = new (window.AudioContext || window.webkitAudioContext)();
function playDing() {
  if (audioContext.state === 'suspended') audioContext.resume();
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  osc.frequency.value = 520;
  osc.type = 'triangle';
  gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.2, audioContext.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.15);
  osc.connect(gain).connect(audioContext.destination);
  osc.start();
  osc.stop(audioContext.currentTime + 0.16);
}

const worldForward = new THREE.Vector3();
const worldUp = new THREE.Vector3();
const moveStep = new THREE.Vector3();
const toPlane = new THREE.Vector3();
const local = new THREE.Vector3();
const camTarget = new THREE.Vector3();
const camDesired = new THREE.Vector3();
const smokeOrigin = new THREE.Vector3();
const smokeVel = new THREE.Vector3();
const worldRight = new THREE.Vector3();
const angularVelocity = new THREE.Vector3();

function resetRun() {
  state.throttle = 26;
  state.speed = 26;
  state.started = false;
  state.finished = false;
  state.startTime = 0;
  state.elapsed = 0;
  state.currentHoop = 0;
  state.lastCheckpoint = 0;
  mouseInput.pitch = 0;
  mouseInput.yaw = 0;
  angularVelocity.set(0, 0, 0);
  if (document.pointerLockElement === renderer.domElement) {
    document.exitPointerLock();
  }
  ui.finish.classList.add('hidden');
  ui.finish.textContent = '';
  hoops.forEach((hoop) => {
    hoop.passed = false;
    hoop.prevSide = null;
    hoop.mesh.material = hoopMaterial.clone();
  });
  smokeParticles.forEach((particle) => {
    particle.active = false;
    particle.mesh.visible = false;
    particle.mesh.material.opacity = 0;
  });
  const startPos = hoops[0].center.clone().add(new THREE.Vector3(0, 0, 18));
  plane.position.copy(startPos);
  plane.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), hoops[0].normal.clone().multiplyScalar(-1).normalize());
}

function respawnAtCheckpoint() {
  const idx = Math.min(state.lastCheckpoint, hoops.length - 1);
  const hoop = hoops[idx];
  plane.position.copy(hoop.center).addScaledVector(hoop.normal, -16);
  plane.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), hoop.normal.clone().multiplyScalar(-1).normalize());
  state.speed = state.throttle;
}

function updatePlane(dt) {
  const keyboardPitch = (keys.has('KeyW') ? 1 : 0) - (keys.has('KeyS') ? 1 : 0);
  const keyboardYaw = (keys.has('KeyD') ? 1 : 0) - (keys.has('KeyA') ? 1 : 0);
  const keyboardRoll = (keys.has('KeyE') ? 1 : 0) - (keys.has('KeyQ') ? 1 : 0);

  if (!state.mouseSteer || document.pointerLockElement !== renderer.domElement) {
    const damp = Math.max(0, 1 - dt * mouseSettings.returnSpeed);
    mouseInput.pitch *= damp;
    mouseInput.yaw *= damp;
  }

  if (keys.has('ShiftLeft') || keys.has('ShiftRight')) state.throttle += state.accel * dt;
  if (keys.has('ControlLeft') || keys.has('ControlRight')) state.throttle -= state.accel * dt;
  state.throttle = THREE.MathUtils.clamp(state.throttle, state.minSpeed, state.maxSpeed);

  const combinedPitch = keyboardPitch + mouseInput.pitch;
  const pitchInput = state.invertPitch ? -combinedPitch : combinedPitch;
  const yawInput = keyboardYaw + mouseInput.yaw;

  let rollAssist = 0;
  if (Math.abs(keyboardRoll) < 0.001) {
    worldRight.set(1, 0, 0).applyQuaternion(plane.quaternion).normalize();
    if (Math.abs(worldRight.y) > flightTuning.autoRollDeadzone) {
      rollAssist = THREE.MathUtils.clamp(worldRight.y * flightTuning.autoRollStrength, -flightTuning.autoRollMax, flightTuning.autoRollMax);
    }
  }
  const rollInput = keyboardRoll + rollAssist;

  const throttleNorm = (state.throttle - state.minSpeed) / (state.maxSpeed - state.minSpeed);
  const lowThrottleFactor = THREE.MathUtils.clamp((flightTuning.noseDropStart - throttleNorm) / flightTuning.noseDropStart, 0, 1);
  const pitchWithNoseDrop = pitchInput - lowThrottleFactor * flightTuning.noseDropStrength;

  const targetPitchRate = pitchWithNoseDrop * flightTuning.pitchSensitivity;
  const targetYawRate = yawInput * flightTuning.yawSensitivity;
  const targetRollRate = rollInput * flightTuning.rollSensitivity;

  const response = 1 - Math.exp(-flightTuning.angularResponse * dt);
  angularVelocity.x += (targetPitchRate - angularVelocity.x) * response;
  angularVelocity.y += (targetYawRate - angularVelocity.y) * response;
  angularVelocity.z += (targetRollRate - angularVelocity.z) * response;

  const decay = Math.exp(-flightTuning.angularDamping * dt);
  angularVelocity.multiplyScalar(decay);
  if (Math.abs(keyboardRoll) < 0.001) {
    angularVelocity.z *= Math.exp(-3.5 * dt);
  }

  const deltaQ = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(
      angularVelocity.x * dt,
      angularVelocity.y * dt,
      -angularVelocity.z * dt,
      'XYZ'
    )
  );
  plane.quaternion.multiply(deltaQ).normalize();

  state.speed += (state.throttle - state.speed) * Math.min(1, state.drag * dt * 4.5);

  worldForward.set(0, 0, -1).applyQuaternion(plane.quaternion).normalize();
  moveStep.copy(worldForward).multiplyScalar(state.speed * dt);
  plane.position.add(moveStep);

  ui.speed.textContent = `${state.speed.toFixed(1)}`;
}

function updateHoops() {
  if (state.finished) return;
  const current = hoops[state.currentHoop];
  if (!current) return;

  toPlane.copy(plane.position).sub(current.center);
  const side = Math.sign(toPlane.dot(current.normal));

  if (current.prevSide === null) {
    current.prevSide = side;
    return;
  }

  const crossed = current.prevSide > 0 && side <= 0;
  current.prevSide = side;

  if (!crossed || current.passed) return;

  local.copy(toPlane).projectOnPlane(current.normal);
  if (local.length() <= current.radius) {
    current.passed = true;
    current.mesh.material = passedMaterial.clone();
    state.currentHoop += 1;
    state.lastCheckpoint = Math.min(state.currentHoop, hoops.length - 1);
    ui.score.textContent = `${state.currentHoop}`;
    playDing();

    if (state.currentHoop >= hoops.length) {
      state.finished = true;
      state.elapsed = (performance.now() - state.startTime) / 1000;
      ui.finish.textContent = `FINISHED!\nFinal Time: ${state.elapsed.toFixed(2)}s`;
      ui.finish.classList.remove('hidden');
    }
  }
}


function spawnSmoke(dt) {
  if (state.finished) return;
  const spawnCount = Math.max(1, Math.round(dt * 70));
  worldForward.set(0, 0, -1).applyQuaternion(plane.quaternion).normalize();
  worldUp.set(0, 1, 0).applyQuaternion(plane.quaternion).normalize();

  for (let i = 0; i < spawnCount; i += 1) {
    const particle = smokeParticles[smokeCursor];
    smokeCursor = (smokeCursor + 1) % SMOKE_COUNT;

    smokeOrigin.copy(plane.position)
      .addScaledVector(worldForward, 1.8)
      .addScaledVector(worldUp, 0.15);

    const jitter = 0.4;
    particle.mesh.position.set(
      smokeOrigin.x + (Math.random() - 0.5) * jitter,
      smokeOrigin.y + (Math.random() - 0.5) * jitter,
      smokeOrigin.z + (Math.random() - 0.5) * jitter
    );
    smokeVel.copy(worldForward).multiplyScalar(4 + Math.random() * 4);
    smokeVel.y += 2 + Math.random() * 1.2;
    smokeVel.x += (Math.random() - 0.5) * 1.3;
    smokeVel.z += (Math.random() - 0.5) * 1.3;
    particle.velocity.copy(smokeVel);
    particle.life = 0;
    particle.maxLife = 0.9 + Math.random() * 0.7;
    particle.active = true;
    particle.mesh.visible = true;
    particle.mesh.scale.setScalar(0.45);
    particle.mesh.material.opacity = 0.35;
  }
}

function updateSmoke(dt) {
  for (let i = 0; i < SMOKE_COUNT; i += 1) {
    const particle = smokeParticles[i];
    if (!particle.active) continue;

    particle.life += dt;
    if (particle.life >= particle.maxLife) {
      particle.active = false;
      particle.mesh.visible = false;
      particle.mesh.material.opacity = 0;
      continue;
    }

    const t = particle.life / particle.maxLife;
    particle.velocity.y += 0.7 * dt;
    particle.mesh.position.addScaledVector(particle.velocity, dt);
    const scale = 0.45 + t * 1.9;
    particle.mesh.scale.setScalar(scale);
    particle.mesh.material.opacity = (1 - t) * 0.35;
  }
}

function updateCamera(dt) {
  worldForward.set(0, 0, -1).applyQuaternion(plane.quaternion).normalize();
  worldUp.set(0, 1, 0).applyQuaternion(plane.quaternion).normalize();

  camDesired.copy(plane.position)
    .addScaledVector(worldForward, -16)
    .addScaledVector(worldUp, 6);

  camera.position.lerp(camDesired, Math.min(1, dt * 4.8));
  camTarget.copy(plane.position).addScaledVector(worldForward, 10);
  camera.lookAt(camTarget);
}

let prev = performance.now();
function tick(now) {
  const dt = Math.min(0.033, (now - prev) / 1000);
  prev = now;

  updatePlane(dt);
  spawnSmoke(dt);
  updateSmoke(dt);
  updateHoops();
  updateCamera(dt);

  if (state.started && !state.finished) {
    state.elapsed = (now - state.startTime) / 1000;
  }
  ui.timer.textContent = `${state.elapsed.toFixed(2)}`;

  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

resetRun();
requestAnimationFrame(tick);
