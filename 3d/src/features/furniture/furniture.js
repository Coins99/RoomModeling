import { addBox, addSphere, addChair, createCustomObject } from './objects.js';
import { setupSnapping, setupRotationSnapping, snapObjectToGrid } from './utils.js';
import { clampToRoom } from '../room/room.js';

export function setupFurniture(appState) {
  setupFurnitureButtons(appState);
  setupTransforms(appState);
  setupSnapping(appState);
  setupRotationSnapping(appState);
  setupCustomObjects();
  
  // Attach methods to appState
  appState.addBox = () => addBox(appState);
  appState.addSphere = () => addSphere(appState);
  appState.addChair = () => addChair(appState);
  appState.createCustomObject = () => createCustomObject(appState);
  appState.clampToRoom = (pos) => clampToRoom(appState, pos);
  appState.snapObjectToGrid = (obj) => snapObjectToGrid(appState, obj);
}

function setupFurnitureButtons(appState) {
  document.getElementById('addBoxBtn').addEventListener('click', () => addBox(appState));
  document.getElementById('addSphereBtn').addEventListener('click', () => addSphere(appState));
  document.getElementById('addChairBtn').addEventListener('click', () => addChair(appState));
  
  document.getElementById('clearFurnitureBtn').addEventListener('click', () => {
    if (confirm('Clear all furniture?')) {
      while(appState.furniture.children.length) {
        appState.furniture.remove(appState.furniture.children[0]);
      }
      appState.transformControls.detach();
      appState.transformControls.visible = false;
      appState.setSelected(null);
      appState.updateInspector();
      appState.updateSelectedInfo();
      appState.saveState('Clear Furniture');
    }
  });
}

function setupTransforms(appState) {
  const { transformControls } = appState;

  transformControls.addEventListener('dragging-changed', ev => {
    appState.transformControlsDragging = ev.value;
    if (ev.value) {
      if (document.pointerLockElement === appState.renderer.domElement) {
        document.exitPointerLock();
      }
      appState.orbitControls.enabled = false;
    } else {
      if (!appState.isFPSMode) appState.orbitControls.enabled = true;
      
      if (appState.selected && document.getElementById('enableSnapping').checked) {
        snapObjectToGrid(appState, appState.selected);
      }
      appState.saveState('Transform Object');
    }
  });
}

function setupCustomObjects() {
  const objType = document.getElementById("objType");
  const boxParams = document.getElementById("boxParams");
  const sphereParams = document.getElementById("sphereParams");
  const cylinderParams = document.getElementById("cylinderParams");
  const coneParams = document.getElementById("coneParams");

  objType.addEventListener("change", () => {
    boxParams.style.display = objType.value === "box" ? "block" : "none";
    sphereParams.style.display = objType.value === "sphere" ? "block" : "none";
    cylinderParams.style.display = objType.value === "cylinder" ? "block" : "none";
    coneParams.style.display = objType.value === "cone" ? "block" : "none";
  });

  document.getElementById('createObj').addEventListener('click', function() {
    // Will be called via appState after initialization
  });
}
