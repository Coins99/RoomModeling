import * as CONST from '../core/constants.js';

export function setupCamera(appState) {
  const { orbitControls } = appState;
  
  const sensitivityEl = document.getElementById('sensitivity');
  const sensVal = document.getElementById('sensVal');
  const baseSpeedEl = document.getElementById('baseSpeed');
  const speedValEl = document.getElementById('speedVal');
  const zoomSpeedEl = document.getElementById('zoomSpeed');
  const zoomVal = document.getElementById('zoomVal');
  const resetCamBtn = document.getElementById('resetCam');

  // Initialize orbit controls
  orbitControls.rotateSpeed = parseFloat(sensitivityEl.value);
  orbitControls.panSpeed = parseFloat(baseSpeedEl.value) * 2;
  orbitControls.zoomSpeed = parseFloat(zoomSpeedEl.value);

  sensitivityEl.addEventListener('input', () => {
    appState.sensitivity = parseFloat(sensitivityEl.value);
    sensVal.textContent = appState.sensitivity.toFixed(2);
    orbitControls.rotateSpeed = appState.sensitivity;
  });
  
  baseSpeedEl.addEventListener('input', () => {
    appState.baseSpeed = parseFloat(baseSpeedEl.value);
    speedValEl.textContent = appState.baseSpeed.toFixed(2);
    orbitControls.panSpeed = appState.baseSpeed * 2;
  });
  
  zoomSpeedEl.addEventListener('input', () => {
    const zoomSpeed = parseFloat(zoomSpeedEl.value);
    zoomVal.textContent = zoomSpeed.toFixed(1);
    orbitControls.zoomSpeed = zoomSpeed;
  });

  resetCamBtn.addEventListener('click', () => {
    const cam = CONST.CAMERA_DEFAULTS;
    appState.camera.position.set(cam.position.x, cam.position.y, cam.position.z * 8);
    appState.camera.lookAt(cam.lookAt.x, cam.lookAt.y, cam.lookAt.z);
    appState.yaw = 0;
    appState.pitch = 0;
    appState.targetYaw = 0;
    appState.targetPitch = 0;
    appState.velocity.set(0, 0, 0);
    orbitControls.update();
  });
}

export function setupFPSControls(appState) {
  const { camera, renderer } = appState;
  
  const fpsToggle = document.getElementById('fpsToggle');
  const fpsStatus = document.getElementById('fpsStatus');
  const hud = document.getElementById('hud');

  fpsToggle.addEventListener('change', () => {
    appState.fpsMode = fpsToggle.checked;
    if (appState.fpsMode) {
      fpsStatus.textContent = 'ON';
      fpsStatus.style.background = '#e8f5e9';
      fpsStatus.style.color = '#2e7d32';
      appState.orbitControls.enabled = false;
    } else {
      fpsStatus.textContent = 'OFF';
      fpsStatus.style.background = '#ffebee';
      fpsStatus.style.color = '#c62828';
      appState.orbitControls.enabled = true;
      document.exitPointerLock();
    }
  });

  let fpsTooltipShown = false;
  renderer.domElement.addEventListener("click", (ev) => {
    if (!appState.fpsMode || appState.isPointerLocked) return;
    if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'SELECT' || document.activeElement.tagName === 'TEXTAREA')) {
      return;
    }
    renderer.domElement.requestPointerLock();
    
    if (!fpsTooltipShown) {
      hud.classList.add('active');
      setTimeout(() => hud.classList.remove('active'), 3000);
      fpsTooltipShown = true;
    }
  });

  document.addEventListener("pointerlockchange", () => {
    appState.isPointerLocked = document.pointerLockElement === renderer.domElement;
    appState.container.style.cursor = appState.isPointerLocked ? 'none' : 'grab';
    hud.classList.toggle('active', appState.isPointerLocked);
  });

  document.addEventListener('mousemove', (e) => {
    if (!appState.transformControlsDragging && appState.isPointerLocked) {
      appState.targetYaw -= e.movementX * 0.002 * appState.sensitivity;
      appState.targetPitch -= e.movementY * 0.002 * appState.sensitivity;
      const maxPitch = Math.PI / 2 - 0.01;
      appState.targetPitch = Math.max(-maxPitch, Math.min(maxPitch, appState.targetPitch));
    }
  });

  // Wheel to change speed multiplier
  renderer.domElement.addEventListener('wheel', (e) => {
    if (!isEventOverCanvas(e, renderer)) return;
    e.preventDefault();
    appState.speedMultiplier *= (e.deltaY > 0) ? 0.9 : 1.1;
    appState.speedMultiplier = Math.min(Math.max(appState.speedMultiplier, 0.1), 6);
  }, { passive: false });
}

function isEventOverCanvas(e, renderer) {
  const rect = renderer.domElement.getBoundingClientRect();
  return e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
}

export function animateFPSCamera(appState) {
  const { camera, move, velocity, baseSpeed, speedMultiplier, isPointerLocked, fpsMode, transformControlsDragging, orbitControls, THREE } = appState;
  const anim = CONST.ANIMATION;
  
  if (fpsMode && isPointerLocked && !transformControlsDragging) {
    // Rotation smoothing
    appState.yaw += (appState.targetYaw - appState.yaw) * anim.fpsRotationLerp;
    appState.pitch += (appState.targetPitch - appState.pitch) * anim.fpsRotationLerp;
    camera.rotation.order = "YXZ";
    camera.rotation.y = appState.yaw;
    camera.rotation.x = appState.pitch;

    // Movement smoothing
    const speed = baseSpeed * speedMultiplier;
    const forwardVec = new THREE.Vector3(0, 0, -1).applyEuler(camera.rotation);
    const rightVec = new THREE.Vector3(1, 0, 0).applyEuler(camera.rotation);

    const desired = new THREE.Vector3(0, 0, 0);
    if (move.f) desired.add(forwardVec);
    if (move.b) desired.addScaledVector(forwardVec, -1);
    if (move.r) desired.add(rightVec);
    if (move.l) desired.addScaledVector(rightVec, -1);
    if (move.u) desired.y += 1;
    if (move.d) desired.y -= 1;

    if (desired.lengthSq() > 0) {
      desired.normalize().multiplyScalar(speed * anim.fpsAcceleration);
      velocity.add(desired);
    }

    velocity.multiplyScalar(anim.fpsMovementDamping);
    const maxSpeed = CONST.FPS_DEFAULTS.maxSpeed(speedMultiplier);
    if (velocity.length() > maxSpeed) velocity.setLength(maxSpeed);

    camera.position.add(velocity);
  } else if (!fpsMode && !transformControlsDragging) {
    orbitControls.update();
  }
}
