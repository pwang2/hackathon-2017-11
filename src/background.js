import {
  WebGLRenderer,
  PerspectiveCamera,
  Scene,
  SpotLight,
  TextureLoader,
  SphereGeometry,
  MeshBasicMaterial,
  BackSide,
  Mesh,
  MOUSE,
  Vector3,
  Vector2,
  Quaternion,
  Spherical,
  EventDispatcher
} from 'three';

const OrbitControls = require('three-orbit-controls')({
  Vector3,
  MOUSE,
  Quaternion,
  Spherical,
  Vector2,
  EventDispatcher,
  PerspectiveCamera
});

const aspect = window.innerWidth / window.innerHeight;
const renderer = new WebGLRenderer();
const camera = new PerspectiveCamera(45, aspect, 0.1, 1500);
const orbitControls = new OrbitControls(camera);
const scene = new Scene();
const cameraRotationSpeed = 0.001;
const cameraAutoRotation = true;
const spotLight = new SpotLight(0xffffff, 1, 0, 10, 2);
const textureLoader = new TextureLoader();
const galaxyGeometry = new SphereGeometry(100, 32, 32);
const galaxyMaterial = new MeshBasicMaterial({ side: BackSide });
const galaxy = new Mesh(galaxyGeometry, galaxyMaterial);

let cameraRotation = 0;

renderer.setSize(window.innerWidth, window.innerHeight);
scene.add(camera);
scene.add(spotLight);
spotLight.position.set(2, 0, 1);
camera.position.set(1, 1, 1);
orbitControls.enabled = !cameraAutoRotation;
textureLoader.crossOrigin = true;
textureLoader.load(
  'https://s3-us-west-2.amazonaws.com/s.cdpn.io/141228/starfield.png',
  texture => {
    galaxyMaterial.map = texture;
    scene.add(galaxy);
  }
);

document.body.appendChild(renderer.domElement);

const render = function() {
  if (cameraAutoRotation) {
    cameraRotation += cameraRotationSpeed;
    camera.position.y = 0;
    camera.position.x = 2 * Math.sin(cameraRotation);
    camera.position.z = 2 * Math.cos(cameraRotation);
    camera.lookAt(new Vector3(0, 0, 0));
  }
  requestAnimationFrame(render);
  renderer.render(scene, camera);
};

render();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
