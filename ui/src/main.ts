import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Get the container element
const container = document.getElementById('three-container')!;

// Scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000); // Use container dimensions
const renderer = new THREE.WebGLRenderer();

// Set renderer size to container dimensions
renderer.setSize(container.clientWidth, container.clientHeight);
container.appendChild(renderer.domElement); // Append to the container

// Geometry and material
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

camera.position.z = 5;

// OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  controls.update();

  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;

  renderer.render(scene, camera);
}

// Handle window resizing
function onWindowResize() {
  camera.aspect = container.clientWidth / container.clientHeight; // Use container dimensions
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight); // Use container dimensions
}

window.addEventListener('resize', onWindowResize, false);

animate();