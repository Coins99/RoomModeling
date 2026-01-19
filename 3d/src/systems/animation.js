export function setupAnimation(appState) {
  const { scene, renderer, camera, orbitControls } = appState;
  
  let isAnimating = false;
  let animationId = null;

  function animationLoop() {
    animationId = requestAnimationFrame(animationLoop);
    
    // Update FPS camera if in FPS mode
    if (appState.isFPSMode && appState.animateFPSCamera) {
      appState.animateFPSCamera(appState);
    }
    
    // Update orbit controls damping
    if (orbitControls && orbitControls.enabled) {
      orbitControls.autoRotate = false;
      orbitControls.dampingFactor = 0.05;
    }
    
    // Render scene
    renderer.render(scene, camera);
  }

  function startAnimation() {
    if (isAnimating) return;
    isAnimating = true;
    animationLoop();
  }

  function stopAnimation() {
    if (!isAnimating) return;
    isAnimating = false;
    if (animationId) cancelAnimationFrame(animationId);
  }

  // Attach to appState
  appState.startAnimation = startAnimation;
  appState.stopAnimation = stopAnimation;
  appState.isAnimating = isAnimating;

  // Start by default
  startAnimation();
}
