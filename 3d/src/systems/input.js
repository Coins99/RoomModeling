export function setupInput(appState) {
  const { move, transformControls, furniture, THREE } = appState;

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Control') appState.isCtrlDown = true;
    
    const inInput = document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'SELECT' || document.activeElement.tagName === 'TEXTAREA');
    if (!inInput) {
      if (e.code === "KeyW") { 
        move.f = 1; 
        transformControls.setMode("translate"); 
      }
      if (e.code === "KeyS") move.b = 1;
      if (e.code === "KeyA") move.l = 1;
      if (e.code === "KeyD") move.r = 1;
      if (e.code === "Space") move.u = 1;
      if (e.code === "ShiftLeft" || e.code === "ShiftRight") move.d = 1;
      
      if (e.code === "KeyZ" && e.ctrlKey) {
        e.preventDefault();
        appState.undo();
      }
      if (e.code === "KeyY" && e.ctrlKey) {
        e.preventDefault();
        appState.redo();
      }

      // Transform hotkeys
      if (e.code === "KeyE") transformControls.setMode("rotate");
      if (e.code === "KeyR") transformControls.setMode("scale");
      
      // Delete with confirmation
      if (e.code === "Delete" && appState.selected) {
        if (confirm('Delete selected object?')) {
          furniture.remove(appState.selected);
          transformControls.detach();
          transformControls.visible = false;
          appState.setSelected(null);
          appState.updateInspector();
          appState.updateSelectedInfo();
          appState.saveState('Delete Object');
        }
      }
    }
  });
  
  document.addEventListener('keyup', (e) => {
    if (e.key === 'Control') appState.isCtrlDown = false;
    if (e.code === "KeyW") move.f = 0;
    if (e.code === "KeyS") move.b = 0;
    if (e.code === "KeyA") move.l = 0;
    if (e.code === "KeyD") move.r = 0;
    if (e.code === "Space") move.u = 0;
    if (e.code === "ShiftLeft" || e.code === "ShiftRight") move.d = 0;
  });
}
