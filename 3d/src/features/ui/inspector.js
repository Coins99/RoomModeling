import * as CONST from '../../core/constants.js';
import { clampToRoom } from '../room/room.js';

export function setupInspector(appState) {
  setupInspectorUI(appState);
  setupInspectorActions(appState);
}

function setupInspectorUI(appState) {
  // Will be updated when selection changes
}

function setupInspectorActions(appState) {
  const { furniture, transformControls } = appState;
  
  document.getElementById('deleteObj').addEventListener('click', () => {
    if (appState.selected) {
      furniture.remove(appState.selected);
      transformControls.detach();
      transformControls.visible = false;
      appState.setSelected(null);
      appState.updateInspector();
      appState.updateSelectedInfo();
      appState.saveState('Delete Object');
    }
  });

  document.getElementById('duplicateObj').addEventListener('click', () => {
    if (appState.selected) {
      const clone = appState.selected.clone();
      clone.position.x += 0.5;
      clone.name = appState.selected.name + ' Copy';
      furniture.add(clone);
      appState.setSelected(clone);
      transformControls.attach(clone);
      transformControls.visible = true;
      appState.saveState('Duplicate Object');
    }
  });
}

export function updateSelectedInfo(appState) {
  const nameEl = document.getElementById('selectedName');
  const typeEl = document.getElementById('selectedType');
  
  if (appState.selected) {
    nameEl.textContent = appState.selected.name || 'Unnamed Object';
    typeEl.textContent = `${appState.selected.geometry.type} • ${appState.selected.uuid.substring(0,8)}`;
    document.getElementById('inspectorActions').style.display = 'block';
  } else {
    nameEl.textContent = 'None';
    typeEl.textContent = 'Click an object to select';
    document.getElementById('inspectorActions').style.display = 'none';
  }
}

export function updateInspector(appState) {
  const { selected, transformControls, THREE } = appState;
  const inspector = document.getElementById('inspector');
  
  inspector.innerHTML = '';
  if (!selected) {
    inspector.innerHTML = '<div class="small" style="text-align:center;color:#999;padding:20px">Click an object to inspect</div>';
    return;
  }
  
  // Name
  const nameRow = document.createElement('div');
  nameRow.className = 'inspector-row';
  nameRow.style.marginBottom = '12px';
  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.value = selected.name || '';
  nameInput.placeholder = 'Object name';
  nameInput.style.flex = '2';
  nameInput.addEventListener('change', () => {
    selected.name = nameInput.value;
    updateSelectedInfo(appState);
    appState.saveState('Rename Object');
  });
  nameRow.appendChild(nameInput);
  inspector.appendChild(nameRow);
  
  // Color picker
  if (selected.material) {
    const colorRow = document.createElement('div');
    colorRow.className = 'inspector-row';
    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    try {
      colorInput.value = '#' + selected.material.color.getHexString();
    } catch(e) {
      colorInput.value = '#ffffff';
    }
    colorInput.addEventListener('input', () => {
      selected.material.color.set(colorInput.value);
      appState.saveState('Change Object Color');
    });
    colorRow.appendChild(colorInput);
    inspector.appendChild(colorRow);
  }
  
  // Transform controls
  const transformHeader = document.createElement('div');
  transformHeader.className = 'small';
  transformHeader.style.marginTop = '16px';
  transformHeader.style.marginBottom = '8px';
  transformHeader.style.color = '#666';
  transformHeader.textContent = 'Transform';
  inspector.appendChild(transformHeader);
  
  // Position
  const posRow = document.createElement('div');
  posRow.className = 'inspector-row';
  const px = createNumberInput('X', selected.position.x, (v) => { selected.position.x = v; clampToRoom(appState, selected.position); });
  const py = createNumberInput('Y', selected.position.y, (v) => { selected.position.y = v; clampToRoom(appState, selected.position); });
  const pz = createNumberInput('Z', selected.position.z, (v) => { selected.position.z = v; clampToRoom(appState, selected.position); });
  posRow.appendChild(px); posRow.appendChild(py); posRow.appendChild(pz);
  inspector.appendChild(posRow);
  
  // Rotation (degrees)
  const rotRow = document.createElement('div');
  rotRow.className = 'inspector-row';
  const rx = createNumberInput('X°', THREE.MathUtils.radToDeg(selected.rotation.x), (v) => { selected.rotation.x = THREE.MathUtils.degToRad(v); });
  const ry = createNumberInput('Y°', THREE.MathUtils.radToDeg(selected.rotation.y), (v) => { selected.rotation.y = THREE.MathUtils.degToRad(v); });
  const rz = createNumberInput('Z°', THREE.MathUtils.radToDeg(selected.rotation.z), (v) => { selected.rotation.z = THREE.MathUtils.degToRad(v); });
  rotRow.appendChild(rx); rotRow.appendChild(ry); rotRow.appendChild(rz);
  inspector.appendChild(rotRow);
  
  // Scale
  const scaleRow = document.createElement('div');
  scaleRow.className = 'inspector-row';
  const sx = createNumberInput('X', selected.scale.x, (v) => { selected.scale.x = v; });
  const sy = createNumberInput('Y', selected.scale.y, (v) => { selected.scale.y = v; });
  const sz = createNumberInput('Z', selected.scale.z, (v) => { selected.scale.z = v; });
  scaleRow.appendChild(sx); scaleRow.appendChild(sy); scaleRow.appendChild(sz);
  inspector.appendChild(scaleRow);
  
  // Apply button
  const applyBtn = document.createElement('button');
  applyBtn.textContent = 'Apply Changes';
  applyBtn.style.width = '100%';
  applyBtn.style.marginTop = '12px';
  applyBtn.addEventListener('click', () => {
    transformControls.update();
    appState.saveState('Modify Object');
  });
  inspector.appendChild(applyBtn);
}

function createNumberInput(label, value, onChange) {
  const container = document.createElement('div');
  container.style.flex = '1';
  
  const input = document.createElement('input');
  input.type = 'number';
  input.step = '0.01';
  input.value = value.toFixed(2);
  input.style.width = '100%';
  input.style.padding = '6px';
  input.style.border = '1px solid #ddd';
  input.style.borderRadius = '4px';
  input.style.fontSize = '12px';
  
  const labelEl = document.createElement('div');
  labelEl.className = 'small';
  labelEl.textContent = label;
  labelEl.style.marginBottom = '4px';
  labelEl.style.color = '#666';
  
  input.addEventListener('change', () => {
    onChange(parseFloat(input.value));
  });
  
  container.appendChild(labelEl);
  container.appendChild(input);
  return container;
}
