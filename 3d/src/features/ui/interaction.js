export function setupInteraction(appState) {
  const { renderer, scene, furniture, roomAssets, camera, THREE, transformControls } = appState;
  
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  function isEventOverCanvas(e) {
    const rect = renderer.domElement.getBoundingClientRect();
    return e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
  }

  // Click to select objects
  renderer.domElement.addEventListener('click', (e) => {
    if (!isEventOverCanvas(e)) return;
    if (appState.transformControlsDragging) return;
    
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );
    raycaster.setFromCamera(mouse, camera);
    
    // Check furniture first
    let hits = raycaster.intersectObjects(furniture.children, true);
    if (hits.length) {
      let picked = hits[0].object;
      while (picked.parent && picked.parent !== furniture) picked = picked.parent;
      appState.setSelected(picked);
      transformControls.attach(picked);
      transformControls.visible = true;
      return;
    }
    
    // Check room assets
    hits = raycaster.intersectObjects(roomAssets.children, true);
    if (hits.length) {
      let picked = hits[0].object;
      appState.setSelected(picked);
      transformControls.attach(picked);
      transformControls.visible = true;
      return;
    }
    
    // Clicked empty space
    if (appState.selected) {
      transformControls.detach();
      transformControls.visible = false;
      appState.setSelected(null);
    }
  });

  // Right-click to delete
  renderer.domElement.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (!isEventOverCanvas(e)) return;
    
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(furniture.children, true);
    
    if (hits.length) {
      let obj = hits[0].object;
      while (obj.parent && obj.parent !== furniture) obj = obj.parent;
      
      if (confirm(`Delete "${obj.name || 'object'}"?`)) {
        furniture.remove(obj);
        if (appState.selected === obj) {
          transformControls.detach();
          transformControls.visible = false;
          appState.setSelected(null);
          appState.updateInspector();
          appState.updateSelectedInfo();
        }
        appState.saveState('Delete Object');
      }
    }
  });
}
