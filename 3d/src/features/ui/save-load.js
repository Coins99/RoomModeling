export function setupSaveLoad(appState) {
  const { scene, furniture, roomAssets, renderer } = appState;

  // Save scene to JSON file
  const saveBtn = document.getElementById('saveBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const data = {
        timestamp: new Date().toISOString(),
        version: '1.0',
        room: {
          width: parseFloat(document.getElementById('roomWidth')?.value || 6),
          depth: parseFloat(document.getElementById('roomDepth')?.value || 5),
          height: parseFloat(document.getElementById('roomHeight')?.value || 3),
        },
        materials: {
          floor: appState.floorMat?.color?.getHexString?.() || '#888888',
          wall: appState.wallMat?.color?.getHexString?.() || '#cccccc',
          ceiling: appState.ceilingMat?.color?.getHexString?.() || '#ffffff',
        },
        furniture: furniture.children.map(obj => ({
          uuid: obj.uuid,
          name: obj.name,
          type: obj.userData.type || 'unknown',
          position: { x: obj.position.x, y: obj.position.y, z: obj.position.z },
          rotation: { x: obj.rotation.x, y: obj.rotation.y, z: obj.rotation.z },
          scale: { x: obj.scale.x, y: obj.scale.y, z: obj.scale.z },
          color: obj.material?.color?.getHexString?.() || '#ffffff',
        })),
      };

      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `room-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  // Load scene from JSON file
  const loadBtn = document.getElementById('loadBtn');
  if (loadBtn) {
    loadBtn.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = JSON.parse(event.target.result);
            
            // Restore room dimensions
            if (data.room) {
              if (document.getElementById('roomWidth')) document.getElementById('roomWidth').value = data.room.width;
              if (document.getElementById('roomDepth')) document.getElementById('roomDepth').value = data.room.depth;
              if (document.getElementById('roomHeight')) document.getElementById('roomHeight').value = data.room.height;
              appState.buildRoom(data.room.width, data.room.depth, data.room.height);
            }
            
            // Restore materials
            if (data.materials) {
              if (appState.floorMat) appState.floorMat.color.setStyle(data.materials.floor);
              if (appState.wallMat) appState.wallMat.color.setStyle(data.materials.wall);
              if (appState.ceilingMat) appState.ceilingMat.color.setStyle(data.materials.ceiling);
            }
            
            // Clear old furniture
            while (furniture.children.length) {
              furniture.remove(furniture.children[0]);
            }
            
            // Restore furniture
            if (data.furniture && Array.isArray(data.furniture)) {
              data.furniture.forEach(objData => {
                const geometry = new appState.THREE.BoxGeometry(1, 1, 1);
                const material = new appState.THREE.MeshStandardMaterial({ color: objData.color });
                const mesh = new appState.THREE.Mesh(geometry, material);
                mesh.uuid = objData.uuid;
                mesh.name = objData.name;
                mesh.userData.type = objData.type;
                mesh.position.set(objData.position.x, objData.position.y, objData.position.z);
                mesh.rotation.set(objData.rotation.x, objData.rotation.y, objData.rotation.z);
                mesh.scale.set(objData.scale.x, objData.scale.y, objData.scale.z);
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                furniture.add(mesh);
              });
            }
            
            appState.updateInspector?.();
            appState.updateSelectedInfo?.();
            alert('Scene loaded successfully!');
          } catch (error) {
            console.error('Error loading scene:', error);
            alert('Failed to load scene. Check console for details.');
          }
        };
        reader.readAsText(file);
      });
      input.click();
    });
  }

  // Export screenshot
  const exportImgBtn = document.getElementById('exportImg');
  if (exportImgBtn) {
    exportImgBtn.addEventListener('click', () => {
      renderer.render(scene, appState.camera);
      renderer.domElement.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `room-${new Date().toISOString().slice(0, 10)}.png`;
        a.click();
        URL.revokeObjectURL(url);
      });
    });
  }

  // Auto-save to localStorage
  const AUTOSAVE_KEY = 'room-autosave';
  const AUTOSAVE_INTERVAL = 30000; // 30 seconds

  function autoSave() {
    try {
      const data = {
        timestamp: Date.now(),
        room: {
          width: parseFloat(document.getElementById('roomWidth')?.value || 6),
          depth: parseFloat(document.getElementById('roomDepth')?.value || 5),
          height: parseFloat(document.getElementById('roomHeight')?.value || 3),
        },
        materials: {
          floor: appState.floorMat?.color?.getHexString?.() || '#888888',
          wall: appState.wallMat?.color?.getHexString?.() || '#cccccc',
          ceiling: appState.ceilingMat?.color?.getHexString?.() || '#ffffff',
        },
        furniture: furniture.children.map(obj => ({
          uuid: obj.uuid,
          name: obj.name,
          type: obj.userData.type || 'unknown',
          position: { x: obj.position.x, y: obj.position.y, z: obj.position.z },
          rotation: { x: obj.rotation.x, y: obj.rotation.y, z: obj.rotation.z },
          scale: { x: obj.scale.x, y: obj.scale.y, z: obj.scale.z },
          color: obj.material?.color?.getHexString?.() || '#ffffff',
        })),
      };
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(data));
      console.log('Auto-saved at', new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }

  setInterval(autoSave, AUTOSAVE_INTERVAL);

  // Load auto-save if available
  const loadAutoSaveBtn = document.getElementById('loadAutoSave');
  if (loadAutoSaveBtn) {
    loadAutoSaveBtn.addEventListener('click', () => {
      try {
        const data = JSON.parse(localStorage.getItem(AUTOSAVE_KEY));
        if (!data) {
          alert('No auto-save found');
          return;
        }
        
        // Same restore logic as manual load
        if (data.room) {
          if (document.getElementById('roomWidth')) document.getElementById('roomWidth').value = data.room.width;
          if (document.getElementById('roomDepth')) document.getElementById('roomDepth').value = data.room.depth;
          if (document.getElementById('roomHeight')) document.getElementById('roomHeight').value = data.room.height;
          appState.buildRoom(data.room.width, data.room.depth, data.room.height);
        }
        
        if (data.materials) {
          if (appState.floorMat) appState.floorMat.color.setStyle(data.materials.floor);
          if (appState.wallMat) appState.wallMat.color.setStyle(data.materials.wall);
          if (appState.ceilingMat) appState.ceilingMat.color.setStyle(data.materials.ceiling);
        }
        
        while (furniture.children.length) {
          furniture.remove(furniture.children[0]);
        }
        
        if (data.furniture && Array.isArray(data.furniture)) {
          data.furniture.forEach(objData => {
            const geometry = new appState.THREE.BoxGeometry(1, 1, 1);
            const material = new appState.THREE.MeshStandardMaterial({ color: objData.color });
            const mesh = new appState.THREE.Mesh(geometry, material);
            mesh.uuid = objData.uuid;
            mesh.name = objData.name;
            mesh.userData.type = objData.type;
            mesh.position.set(objData.position.x, objData.position.y, objData.position.z);
            mesh.rotation.set(objData.rotation.x, objData.rotation.y, objData.rotation.z);
            mesh.scale.set(objData.scale.x, objData.scale.y, objData.scale.z);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            furniture.add(mesh);
          });
        }
        
        appState.updateInspector?.();
        appState.updateSelectedInfo?.();
        alert('Auto-save loaded successfully!');
      } catch (error) {
        console.error('Error loading auto-save:', error);
        alert('Failed to load auto-save. Check console for details.');
      }
    });
  }
}
