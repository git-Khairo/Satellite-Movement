import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Satellite } from './Models/satallite';
import { Earth } from './Models/Earth';
import { PhysicsEngine } from './Physics/PhysicsEngine';
import { CameraManager } from './CameraManager.js';



// === SCENE SETUP ===
const scene = new THREE.Scene();

// === BACKGROUND SKYBOX ===
const cubeTextureLoader = new THREE.CubeTextureLoader();
cubeTextureLoader.setPath('/textures/cubeMap/');
scene.background = cubeTextureLoader.load([
  'px.png', 'nx.png',
  'py.png', 'ny.png',
  'pz.png', 'nz.png'
]);

// === OBJECTS ===
const earth = new Earth(new THREE.Vector3(0, 0, 0), 6371000);
scene.add(earth.getObject());

const satellite = new Satellite(new THREE.Vector3(0, 0,6371000 + 600000)); // 600km LEO
satellite.getObject().scale.set(50000, 50000, 50000);
scene.add(satellite.getObject());

console.log(satellite.getObject());

const physics = new PhysicsEngine(scene, earth, satellite);

// === CAMERA ===
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1e8
);

// === RENDERER ===
const canvas = document.querySelector('canvas.threejs');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// === ORBIT CONTROLS ===
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.rotateSpeed = 0.5;
controls.zoomSpeed = 0.8;
controls.enablePan = false;
controls.target.copy(earth.getObject().position);

// === CAMERA MANAGER ===
const cameraManager = new CameraManager(camera, satellite, earth);

// === LIGHTING ===
const ambientLight = new THREE.AmbientLight(0x222222);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
directionalLight.position.set(10, 10, 10);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(1024, 1024);
scene.add(directionalLight);

// === WINDOW RESIZE SUPPORT ===
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// === USER INPUT ===
document.addEventListener('keydown', (e) => {
  if (e.key === 'T') {
    physics.performOrbitalTransfer(1500000); // 1500km altitude
  }
  if (e.key === 'B') {
    physics.applyThrust(10); // Simple boost
  }
  if (['1', '2', '3'].includes(e.key)) {
    console.log(`Camera mode: ${cameraManager.mode}`);
  }
});

// === MAIN LOOP ===
const animate = () => {
  requestAnimationFrame(animate);

  const pos = satellite.getObject().position;
const vel = physics.velocity.length();
const alt = pos.distanceTo(earth.getObject().position) - physics.earthRadius;

document.getElementById('debug').innerHTML = `
  <strong>Altitude:</strong> ${(alt / 1000).toFixed(2)} km<br>
  <strong>Speed:</strong> ${vel.toFixed(2)} m/s
`;

  physics.update(10);         // update satellite physics
  //earth.update();              // rotate Earth slowly
  //satellite.update();          // optional satellite rotation
  cameraManager.update();      // apply camera mode logic
  controls.update();           // orbit controls (only for free mode)

  renderer.render(scene, camera);
};

animate();

