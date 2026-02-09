import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { createCardTextures } from './card.js';

export function createScene(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#f6f4ff');

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0.2, 4);

  const light = new THREE.DirectionalLight('#ffffff', 1.1);
  light.position.set(2, 3, 4);
  scene.add(light);
  scene.add(new THREE.AmbientLight('#ffffff', 0.6));

  const cardGroup = new THREE.Group();
  scene.add(cardGroup);

  const geometry = createRoundedCardGeometry(2.4, 3.2, 0.2, 0.25);

  const baseFrontColor = new THREE.Color('#ffffff');
  const baseBackColor = new THREE.Color('#f9f7ff');
  const frontMaterial = new THREE.MeshBasicMaterial({ color: baseFrontColor.clone() });
  const backMaterial = new THREE.MeshBasicMaterial({ color: baseBackColor.clone() });
  const sideMaterial = new THREE.MeshStandardMaterial({ color: '#f3f1ff' });

  const shell = new THREE.Mesh(geometry, sideMaterial);
  cardGroup.add(shell);

  const faceGeometry = new THREE.PlaneGeometry(2.36, 3.16);
  const frontFace = new THREE.Mesh(faceGeometry, frontMaterial);
  frontFace.position.z = 0.12;
  frontFace.renderOrder = 2;
  frontMaterial.depthTest = false;
  frontMaterial.depthWrite = false;
  cardGroup.add(frontFace);

  const backFace = new THREE.Mesh(faceGeometry, backMaterial);
  backFace.position.z = -0.12;
  backFace.rotation.y = Math.PI;
  backFace.renderOrder = 2;
  backMaterial.depthTest = false;
  backMaterial.depthWrite = false;
  cardGroup.add(backFace);

  let targetRotation = 0;
  let glowStrength = 0;
  let wobbleTime = 0;
  let clock = new THREE.Clock();

  function updateCard(card, mode) {
    const { front, back } = createCardTextures(card, mode);
    frontMaterial.map = front;
    frontMaterial.needsUpdate = true;
    backMaterial.map = back;
    backMaterial.needsUpdate = true;
  }

  function flip(isFlipped) {
    targetRotation = isFlipped ? Math.PI : 0;
  }

  function glow() {
    glowStrength = 1;
  }

  function wobble() {
    wobbleTime = 1;
  }

  function resize() {
    const { clientWidth, clientHeight } = canvas;
    camera.aspect = clientWidth / clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(clientWidth, clientHeight, false);
  }

  function start() {
    resize();
    renderer.setAnimationLoop(render);
  }

  function render() {
    const elapsed = clock.getElapsedTime();
    cardGroup.position.y = Math.sin(elapsed * 1.5) * 0.05;
    cardGroup.rotation.y += (targetRotation - cardGroup.rotation.y) * 0.12;
    if (wobbleTime > 0) {
      cardGroup.rotation.z = Math.sin(elapsed * 20) * 0.08;
      wobbleTime -= 0.03;
    } else {
      cardGroup.rotation.z = 0;
    }
    frontMaterial.color.copy(baseFrontColor);
    backMaterial.color.copy(baseBackColor);
    if (glowStrength > 0) {
      frontMaterial.color.lerp(new THREE.Color('#fff2b0'), glowStrength * 0.4);
      backMaterial.color.lerp(new THREE.Color('#fff2b0'), glowStrength * 0.3);
      glowStrength -= 0.04;
    }
    renderer.render(scene, camera);
  }

  return {
    start,
    updateCard,
    flip,
    glow,
    wobble,
    resize,
  };
}

function createRoundedCardGeometry(width, height, depth, radius) {
  const shape = new THREE.Shape();
  const x = -width / 2;
  const y = -height / 2;
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);

  const extrudeSettings = {
    depth,
    bevelEnabled: true,
    bevelSegments: 4,
    steps: 2,
    bevelSize: 0.06,
    bevelThickness: 0.06,
    curveSegments: 12,
  };

  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geometry.center();
  return geometry;
}
