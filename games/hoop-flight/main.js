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
  lastCheckpoint: 0
};

const ui = {
  score: document.getElementById('score'),
  total: document.getElementById('total'),
  timer: document.getElementById('timer'),
  speed: document.getElementById('speed'),
  finish: document.getElementById('finish')
};
ui.total.textContent = `${HOOP_COUNT}`;

const keys = new Set();
const inputKeys = new Set(['KeyW', 'KeyS', 'KeyA', 'KeyD', 'KeyQ', 'KeyE', 'ShiftLeft', 'ShiftRight', 'ControlLeft', 'ControlRight']);

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
});
window.addEventListener('keyup', (event) => keys.delete(event.code));

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

function resetRun() {
  state.throttle = 26;
  state.speed = 26;
  state.started = false;
  state.finished = false;
  state.startTime = 0;
  state.elapsed = 0;
  state.currentHoop = 0;
  state.lastCheckpoint = 0;
  ui.finish.classList.add('hidden');
  ui.finish.textContent = '';
  hoops.forEach((hoop) => {
    hoop.passed = false;
    hoop.prevSide = null;
    hoop.mesh.material = hoopMaterial.clone();
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
  const pitch = (keys.has('KeyW') ? 1 : 0) - (keys.has('KeyS') ? 1 : 0);
  const yaw = (keys.has('KeyD') ? 1 : 0) - (keys.has('KeyA') ? 1 : 0);
  const roll = (keys.has('KeyE') ? 1 : 0) - (keys.has('KeyQ') ? 1 : 0);

  const pitchRate = 1.4;
  const yawRate = 1.25;
  const rollRate = 1.9;

  const deltaQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch * pitchRate * dt, yaw * yawRate * dt, -roll * rollRate * dt, 'XYZ'));
  plane.quaternion.multiply(deltaQ).normalize();

  if (keys.has('ShiftLeft') || keys.has('ShiftRight')) state.throttle += state.accel * dt;
  if (keys.has('ControlLeft') || keys.has('ControlRight')) state.throttle -= state.accel * dt;
  state.throttle = THREE.MathUtils.clamp(state.throttle, state.minSpeed, state.maxSpeed);

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
