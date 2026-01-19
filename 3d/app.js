import { createScene } from './src/core/scene.js';
import { setupAnimation } from './src/systems/animation.js';
import { setupCamera } from './src/systems/camera.js';
import { setupInput } from './src/systems/input.js';
import { setupHistory } from './src/systems/history.js';
import { setupRoom } from './src/features/room/room.js';
import { setupMaterials } from './src/features/room/materials.js';
import { setupFurniture } from './src/features/furniture/furniture.js';
import { setupInspector } from './src/features/ui/inspector.js';
import { setupInteraction } from './src/features/ui/interaction.js';
import { setupUIEvents } from './src/features/ui/events.js';
import { setupSaveLoad } from './src/features/ui/save-load.js';

// Initialize the 3D room designer
async function initializeApp() {
  // Create core scene and THREE.js setup
  const sceneData = createScene();
  
  // Create app state object - this will be passed to all setup functions
  const appState = {
    // Scene objects from createScene
    scene: sceneData.scene,
    renderer: sceneData.renderer,
    camera: sceneData.camera,
    container: sceneData.container,
    room: sceneData.room,
    roomAssets: sceneData.roomAssets,
    furniture: sceneData.furniture,
    
    // Materials
    floorMat: sceneData.floorMat,
    wallMat: sceneData.wallMat,
    ceilingMat: sceneData.ceilingMat,
    
    // Controls
    transformControls: sceneData.transformControls,
    orbitControls: sceneData.orbitControls,
    
    // Three.js reference
    THREE: sceneData.THREE,
    
    // UI state
    selected: null,
    lastSelected: null,
    isFPSMode: false,
    inInput: false,
    transformControlsDragging: false,
    
    // Camera/FPS state
    moveDirection: { forward: 0, back: 0, left: 0, right: 0, up: 0, down: 0 },
    fpsVelocity: { x: 0, y: 0, z: 0 },
    fpsRotation: { yaw: 0, pitch: 0, targetYaw: 0, targetPitch: 0 },
    
    // Helper functions that will be populated by setup functions
    setSelected: null,
    updateInspector: null,
    updateSelectedInfo: null,
    buildRoom: null,
    addBox: null,
    addSphere: null,
    addChair: null,
    createCustomObject: null,
    clampToRoom: null,
    snapObjectToGrid: null,
    saveState: null,
    undo: null,
    redo: null,
    updateHistoryUI: null,
    startAnimation: null,
    stopAnimation: null,
    animateFPSCamera: null,
  };

  // Helper function for setSelected
  appState.setSelected = function(obj) {
    if (appState.selected && appState.selected.material && appState.selected.material.emissive) {
      appState.selected.material.emissive.setHex(0x000000);
    }
    appState.selected = obj;
    appState.lastSelected = obj;
    if (appState.selected && appState.selected.material && appState.selected.material.emissive) {
      appState.selected.material.emissive.setHex(0x333333);
    }
    if (appState.updateInspector) appState.updateInspector();
    if (appState.updateSelectedInfo) appState.updateSelectedInfo();
  };

  // Setup all systems and features
  setupRoom(appState);
  setupMaterials(appState);
  setupHistory(appState);
  setupCamera(appState);
  setupInput(appState);
  setupFurniture(appState);
  setupInspector(appState);
  setupInteraction(appState);
  setupUIEvents(appState);
  setupSaveLoad(appState);
  setupAnimation(appState);
  
  // Export for debugging
  window.__ROOM__ = appState;
  console.log('Room Designer initialized. Access appState via window.__ROOM__');
  
  return appState;
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
