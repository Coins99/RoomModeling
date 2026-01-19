import * as CONST from '../../core/constants.js';
import { clampToRoom } from '../room/room.js';

export function snapObjectToGrid(appState, obj) {
  const snapSize = parseFloat(document.getElementById('snapSize').value);
  obj.position.x = Math.round(obj.position.x / snapSize) * snapSize;
  obj.position.y = Math.round(obj.position.y / snapSize) * snapSize;
  obj.position.z = Math.round(obj.position.z / snapSize) * snapSize;
  clampToRoom(appState, obj.position);
}

export function setupSnapping(appState) {
  const snapSizeEl = document.getElementById('snapSize');
  const snapSizeVal = document.getElementById('snapSizeVal');
  
  snapSizeEl.addEventListener('input', () => { 
    const snapSize = parseFloat(snapSizeEl.value);
    snapSizeVal.textContent = snapSize.toFixed(2);
  });
}

export function setupRotationSnapping(appState) {
  const { transformControls } = appState;
  const rotationSnapToggle = document.getElementById('rotationSnapToggle');
  
  rotationSnapToggle.addEventListener('change', () => {
    const enabled = rotationSnapToggle.checked;
    transformControls.setRotationSnap(enabled ? Math.PI / 4 : null);
  });
}
