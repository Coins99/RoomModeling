import * as THREE from 'https://unpkg.com/three@0.161.0/build/three.module.js';
import { TransformControls } from 'https://unpkg.com/three@0.161.0/examples/jsm/controls/TransformControls.js';
import { OrbitControls } from 'https://unpkg.com/three@0.161.0/examples/jsm/controls/OrbitControls.js';
import * as CONST from './constants.js';

export function createScene() {
  const container = document.getElementById('canvas-container');
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(CONST.SCENE_BG_COLOR);

  const renderer = new THREE.WebGLRenderer({antialias:true});
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.style.outline = 'none';
  renderer.domElement.tabIndex = 0;
  container.appendChild(renderer.domElement);

  // Camera setup
  const cam = CONST.CAMERA_DEFAULTS;
  const camera = new THREE.PerspectiveCamera(cam.fov, 1, cam.near, cam.far);
  camera.position.set(cam.position.x, cam.position.y, cam.position.z);
  camera.lookAt(cam.lookAt.x, cam.lookAt.y, cam.lookAt.z);

  // Lighting
  const lighting = CONST.LIGHTING;
  const hemi = new THREE.HemisphereLight(lighting.hemisphere.color, lighting.hemisphere.groundColor, lighting.hemisphere.intensity);
  hemi.position.set(lighting.hemisphere.position.x, lighting.hemisphere.position.y, lighting.hemisphere.position.z);
  scene.add(hemi);

  const dir = new THREE.DirectionalLight(lighting.directional.color, lighting.directional.intensity);
  dir.position.set(lighting.directional.position.x, lighting.directional.position.y, lighting.directional.position.z);
  dir.castShadow = true;
  dir.shadow.mapSize.set(lighting.directional.shadowMapSize, lighting.directional.shadowMapSize);
  dir.shadow.camera.near = lighting.directional.shadowNear;
  dir.shadow.camera.far = lighting.directional.shadowFar;
  scene.add(dir);

  const ambient = new THREE.AmbientLight(lighting.ambient.color, lighting.ambient.intensity);
  scene.add(ambient);

  // Room group
  const room = new THREE.Group();
  scene.add(room);

  // Material setup
  const floorMat   = new THREE.MeshStandardMaterial({
    color: CONST.COLORS.floor,
    ...CONST.MATERIAL_DEFAULTS.floor,
    side: THREE.DoubleSide
  });
  const wallMat    = new THREE.MeshStandardMaterial({
    color: CONST.COLORS.wall,
    ...CONST.MATERIAL_DEFAULTS.wall,
    side: THREE.DoubleSide
  });
  const ceilingMat = new THREE.MeshStandardMaterial({
    color: CONST.COLORS.ceiling,
    ...CONST.MATERIAL_DEFAULTS.ceiling,
    side: THREE.DoubleSide
  });

  const roomAssets = new THREE.Group();
  room.add(roomAssets);

  const furniture = new THREE.Group();
  scene.add(furniture);

  // Transform controls
  const transformControls = new TransformControls(camera, renderer.domElement);
  scene.add(transformControls);
  transformControls.setSize(0.9);
  transformControls.visible = false;

  // Orbit controls
  const orbit = CONST.ORBIT_DEFAULTS;
  const orbitControls = new OrbitControls(camera, renderer.domElement);
  orbitControls.enableDamping = true;
  orbitControls.dampingFactor = 0.05;
  orbitControls.enablePan = true;
  orbitControls.enableZoom = true;
  orbitControls.minDistance = orbit.minDistance;
  orbitControls.maxDistance = orbit.maxDistance;
  orbitControls.maxPolarAngle = orbit.maxPolarAngle;

  // Window resize handler
  function onResize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', onResize);
  onResize();

  // Animation loop setup
  let animationFrameId;
  const startAnimation = (animate) => {
    function loop() {
      animationFrameId = requestAnimationFrame(loop);
      animate();
      renderer.render(scene, camera);
    }
    loop();
  };

  return {
    scene,
    renderer,
    camera,
    container,
    room,
    roomAssets,
    furniture,
    floorMat,
    wallMat,
    ceilingMat,
    transformControls,
    orbitControls,
    THREE,
    startAnimation,
    stopAnimation: () => cancelAnimationFrame(animationFrameId)
  };
}
