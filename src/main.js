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

const satellite = new Satellite(new THREE.Vector3(0, 0, 6371000+600000 )); // 600km LEO
satellite.getObject().scale.set(100000, 100000, 100000);
scene.add(satellite.getObject());

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

// === CONTROL PANEL ===
const planetData = {
  Earth: { mass: 5.972e24, G: 6.67430e-11 },
  Mars: { mass: 6.417e23, G: 6.67430e-11 },
  Moon: { mass: 7.346e22, G: 6.67430e-11 }
};

// Track if simulation has started
let hasStarted = false;

// Toggle inclination input visibility
const orbitTypeSelect = document.getElementById('orbitType');
const inclinationDiv = document.getElementById('inclinationDiv');
orbitTypeSelect.addEventListener('change', () => {
  inclinationDiv.style.display = orbitTypeSelect.value === 'inclined' ? 'block' : 'none';
});

// Handle form submission
document.getElementById('apply').addEventListener('click', () => {
  satellite.getObject().visible = true;
  const planet = document.getElementById('planet').value;
  const altitude = parseFloat(document.getElementById('altitude').value) * 1000; // Convert km to m
  const orbitType = document.getElementById('orbitType').value;
  const inclination = parseFloat(document.getElementById('inclination').value) || 0;

  // Update physics engine parameters
  physics.earthMass = planetData[planet].mass;
  physics.G = planetData[planet].G;

  // Validate altitude
  if (isNaN(altitude) || altitude < 100000 || altitude > 10000000) {
    console.warn('Invalid altitude: Must be between 100 and 10000 km.');
    return;
  }

  // If simulation hasn't started, set initial orbit
  if (!hasStarted) {
    if (orbitType === 'equatorial') {
      physics.createInclinedOrbit(90, altitude, 'circular');
    } else if (orbitType === 'polar') {
      physics.createInclinedOrbit(0, altitude, 'circular');
    } else if (orbitType === 'inclined') {
      physics.createInclinedOrbit(inclination, altitude, 'elliptical');
    }
    hasStarted = true; // Mark simulation as started
  } else {
    // If simulation is running, perform orbital transfer to new altitude
    physics.performOrbitalTransfer(altitude);
    console.log(`Initiating orbital transfer to ${altitude / 1000} km`);
  }
});

let speed = 1;

document.getElementById('speed').addEventListener('change', () => {
  speed = document.getElementById('speed').value;
});

// Handle reset button
document.getElementById('reset').addEventListener('click', () => {
  hasStarted = false; // Reset simulation state
  window.location.reload();
});

// === USER INPUT ===
document.addEventListener('keydown', (e) => {
  if (e.key === 'R') {
    physics.applyThrust(100); // Try to rescue
    hidePopup();
  }
  if (e.key === 'C') {
    console.log('🛰️ No rescue — satellite will continue descent.');
    hidePopup();
  }

  switch (e.key.toUpperCase()) {
    case 'X': // Escape trajectory
      physics.changeOrbitType('escape');
      break;
    case 'T': // Orbital transfer to 1500 km
      physics.performOrbitalTransfer(1500000);
      break;
    case 'B': // Boost thrust
      physics.applyThrust(100);
      break;
    case 'A':
      physics.createInclinedOrbit(0, 600_000, 'circular');
      break; // Equatorial
    case 'Z':
      physics.createInclinedOrbit(90, 700_000, 'circular');
      break; // Polar
    case 'S':
      physics.createInclinedOrbit(45, 800_000, 'elliptical');
      break; // Inclined
  }
});

let paused = false;
let countdownTimer = null;

export function showCrashWarning() {
    const popup = document.getElementById('popup');
    const countdown = document.getElementById('countdown');
    popup.style.display = 'block';
    paused = true;

    let seconds = 10;
    countdown.textContent = `Crash in: ${seconds}s`;

    countdownTimer = setInterval(() => {
        seconds--;
        countdown.textContent = `Crash in: ${seconds}s`;
        if (seconds <= 0) {
            clearInterval(countdownTimer);
            popup.style.display = 'none';
            playCrashSound();
            paused = false;
        }
    }, 1000);
}

function hidePopup() {
    document.getElementById('popup').style.display = 'none';
    if (countdownTimer) clearInterval(countdownTimer);
    paused = false;
}

function playCrashSound() {
    const audio = document.getElementById('crash-sound');
    if (audio) audio.play();
}

// === MAIN LOOP ===
const animate = () => {
  requestAnimationFrame(animate);

  const pos = satellite.getObject().position;
  const vel = physics.velocity;
  const acc = physics.getAcceleration();
  const alt = pos.distanceTo(earth.getObject().position) - physics.earthRadius;
  const gravityForce = physics.getGravityForce();
  const dragForce = physics.getDragForce();

  document.getElementById('output').innerHTML = `
    <strong>Altitude:</strong> ${(alt / 1000).toFixed(2)} km<br>
    <strong>Speed:</strong> ${vel.length().toFixed(2)} m/s
  `;

  document.getElementById('sidebar').innerHTML = `
    <strong>Position (m):</strong><br>
    X: ${pos.x.toFixed(0)}<br>
    Y: ${pos.y.toFixed(0)}<br>
    Z: ${pos.z.toFixed(0)}<br>
    <strong>Velocity (m/s):</strong><br>
    X: ${vel.x.toFixed(2)}<br>
    Y: ${vel.y.toFixed(2)}<br>
    Z: ${vel.z.toFixed(2)}<br>
    <strong>Acceleration (m/s²):</strong><br>
    X: ${acc.x.toFixed(2)}<br>
    Y: ${acc.y.toFixed(2)}<br>
    Z: ${acc.z.toFixed(2)}<br>
    <strong>Forces (N):</strong><br>
    Gravity: ${gravityForce.length().toFixed(2)}<br>
    Drag: ${dragForce.length().toFixed(10)}<br>
    <strong>Altitude:</strong><br>
    ${(alt / 1000).toFixed(2)} km
  `;

  if (!paused) {
    physics.update(speed);         // update satellite physics
    earth.update();           // rotate Earth slowly
    //satellite.update();       // optional satellite rotation
    cameraManager.update();     // apply camera mode logic
    controls.update();          // orbit controls (only for free mode)
  }
  renderer.render(scene, camera);
};

animate();