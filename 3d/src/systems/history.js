import * as CONST from '../core/constants.js';

export function setupHistory(appState) {
  const undoBtn = document.getElementById('undoBtn');
  const redoBtn = document.getElementById('redoBtn');

  undoBtn.addEventListener('click', () => undo(appState));
  redoBtn.addEventListener('click', () => redo(appState));

  // Initial state
  setTimeout(() => saveState(appState, 'Initial State'), 100);
}

export function saveState(appState, description) {
  const { furniture, roomAssets, THREE } = appState;
  const { undoStack, redoStack, historyIndex, maxHistory } = appState.history;

  // Remove future states if we're not at the latest
  if (historyIndex < undoStack.length - 1) {
    undoStack.length = historyIndex + 1;
  }
  
  const state = {
    description: description || 'Action',
    timestamp: Date.now(),
    furniture: furniture.children.map(obj => ({
      uuid: obj.uuid,
      type: obj.type,
      geometry: obj.geometry.parameters,
      material: { color: obj.material.color.getHex() },
      position: obj.position.clone(),
      rotation: obj.rotation.clone(),
      scale: obj.scale.clone(),
      name: obj.name,
      userData: JSON.parse(JSON.stringify(obj.userData || {}))
    })),
    roomAssets: roomAssets.children.map(obj => ({
      uuid: obj.uuid,
      type: obj.type,
      geometry: obj.geometry.parameters,
      material: { color: obj.material.color ? obj.material.color.getHex() : 0xffffff },
      position: obj.position.clone(),
      rotation: obj.rotation.clone(),
      scale: obj.scale.clone(),
      name: obj.name
    }))
  };
  
  undoStack.push(state);
  if (undoStack.length > maxHistory) undoStack.shift();
  appState.history.historyIndex = undoStack.length - 1;
  updateHistoryUI(appState);
}

export function undo(appState) {
  const { undoStack, redoStack } = appState.history;
  const { historyIndex } = appState.history;
  
  if (historyIndex <= 0) return;
  appState.history.historyIndex--;
  redoStack.push(undoStack[historyIndex + 1]);
  restoreState(appState, undoStack[appState.history.historyIndex]);
}

export function redo(appState) {
  const { undoStack, redoStack } = appState.history;
  
  if (redoStack.length === 0) return;
  const state = redoStack.pop();
  undoStack.push(state);
  appState.history.historyIndex++;
  restoreState(appState, state);
}

export function restoreState(appState, state) {
  const { furniture, roomAssets, THREE } = appState;
  
  // Clear current furniture
  while(furniture.children.length) {
    furniture.remove(furniture.children[0]);
  }
  
  // Restore furniture
  state.furniture.forEach(item => {
    let geom;
    if (item.type === 'BoxGeometry') {
      geom = new THREE.BoxGeometry(item.geometry.width, item.geometry.height, item.geometry.depth);
    } else if (item.type === 'SphereGeometry') {
      geom = new THREE.SphereGeometry(item.geometry.radius, 32, 16);
    } else if (item.type === 'CylinderGeometry') {
      geom = new THREE.CylinderGeometry(item.geometry.radiusTop, item.geometry.radiusBottom, item.geometry.height, 32);
    }
    
    const mat = new THREE.MeshStandardMaterial({ color: item.material.color });
    const obj = new THREE.Mesh(geom, mat);
    obj.position.copy(item.position);
    obj.rotation.copy(item.rotation);
    obj.scale.copy(item.scale);
    obj.name = item.name;
    obj.uuid = item.uuid;
    obj.userData = item.userData;
    obj.castShadow = true;
    obj.receiveShadow = true;
    furniture.add(obj);
  });
  
  // Restore room assets
  while(roomAssets.children.length) {
    roomAssets.remove(roomAssets.children[0]);
  }

  state.roomAssets.forEach(item => {
    if (item.type && item.type.toLowerCase().includes('light')) {
      const light = new THREE.PointLight(0xffffff, 0.9);
      if (item.position && item.position.toArray) {
        light.position.copy(item.position);
      } else if (item.position && Array.isArray(item.position)) {
        light.position.fromArray(item.position);
      }
      light.name = item.name || 'Light';
      roomAssets.add(light);
      return;
    }

    let geom;
    const g = item.geometry || {};
    if (g.width && g.height && g.depth) {
      geom = new THREE.BoxGeometry(g.width, g.height, g.depth);
    } else if (g.radius) {
      geom = new THREE.SphereGeometry(g.radius, 32, 16);
    } else if (typeof g.radiusTop !== 'undefined' && typeof g.radiusBottom !== 'undefined' && g.height) {
      geom = new THREE.CylinderGeometry(g.radiusTop, g.radiusBottom, g.height, 32);
    }

    if (geom) {
      const mat = new THREE.MeshStandardMaterial({ color: item.material && item.material.color ? item.material.color : 0xffffff });
      const obj = new THREE.Mesh(geom, mat);
      if (Array.isArray(item.position)) obj.position.fromArray(item.position);
      if (Array.isArray(item.rotation)) obj.rotation.fromArray(item.rotation);
      if (Array.isArray(item.scale)) obj.scale.fromArray(item.scale);
      obj.name = item.name || 'Asset';
      obj.castShadow = true;
      obj.receiveShadow = true;
      roomAssets.add(obj);
    }
  });
  
  updateHistoryUI(appState);
}

function updateHistoryUI(appState) {
  const count = document.getElementById('historyCount');
  const { undoStack } = appState.history;
  if (undoStack.length === 0) {
    count.textContent = 'No actions yet';
  } else {
    count.textContent = `${undoStack.length} actions`;
  }
}
