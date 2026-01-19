import * as CONST from '../../core/constants.js';

export function setupMaterials(appState) {
  const { floorMat, wallMat, ceilingMat } = appState;
  
  const floorColor = document.getElementById('floorColor');
  const wallColor = document.getElementById('wallColor');
  const ceilingColor = document.getElementById('ceilingColor');

  // Texture preview selection
  document.querySelectorAll('.texture-option').forEach(option => {
    option.addEventListener('click', () => {
      const type = option.dataset.type;
      const color = option.dataset.color;
      
      document.querySelectorAll(`.texture-option[data-type="${type}"]`).forEach(opt => {
        opt.classList.remove('selected');
      });
      option.classList.add('selected');
      
      if (type === 'floor') {
        floorColor.value = color;
        floorMat.color.set(color);
      } else if (type === 'wall') {
        wallColor.value = color;
        wallMat.color.set(color);
      }
      appState.saveState('Change Texture');
    });
  });

  floorColor.addEventListener('input', () => { 
    floorMat.color.set(floorColor.value);
    appState.saveState('Change Floor Color');
  });
  
  wallColor.addEventListener('input', () => { 
    wallMat.color.set(wallColor.value);
    appState.saveState('Change Wall Color');
  });
  
  ceilingColor.addEventListener('input', () => { 
    ceilingMat.color.set(ceilingColor.value);
    appState.saveState('Change Ceiling Color');
  });
}
