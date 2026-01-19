import * as CONST from '../../core/constants.js';
import { buildRoomAssets } from './assets.js';

export function setupRoom(appState) {
  const buildRoomBtn = document.getElementById('buildRoomBtn');
  
  if (buildRoomBtn) {
    buildRoomBtn.addEventListener('click', () => {
      const w = parseFloat(document.getElementById('roomWidth')?.value || CONST.DEFAULT_ROOM.width);
      const d = parseFloat(document.getElementById('roomDepth')?.value || CONST.DEFAULT_ROOM.depth);
      const h = parseFloat(document.getElementById('roomHeight')?.value || CONST.DEFAULT_ROOM.height);
      
      buildRoom(appState, w, d, h);
      appState.saveState('Resize Room');
    });
  }
  
  // Attach buildRoom to appState
  appState.buildRoom = (w, d, h) => buildRoom(appState, w, d, h);
}

export function buildRoom(appState, width = CONST.DEFAULT_ROOM.width, depth = CONST.DEFAULT_ROOM.depth, height = CONST.DEFAULT_ROOM.height) {
  const { THREE, room, roomAssets, furniture, floorMat, wallMat, ceilingMat } = appState;
  
  room.children
    .filter(c => c !== roomAssets)
    .forEach(c => room.remove(c));

  document.getElementById('roomSize').textContent = (width * depth * height).toFixed(1);

  // Floor
  const floorGeom = new THREE.PlaneGeometry(width, depth);
  const floorMesh = new THREE.Mesh(floorGeom, floorMat);
  floorMesh.rotation.x = -Math.PI/2;
  floorMesh.receiveShadow = true;
  floorMesh.name = 'floor';
  room.add(floorMesh);

  // Ceiling
  const ceilGeom = new THREE.PlaneGeometry(width, depth);
  const ceilingMesh = new THREE.Mesh(ceilGeom, ceilingMat);
  ceilingMesh.position.y = height;
  ceilingMesh.rotation.x = -Math.PI/2;
  ceilingMesh.receiveShadow = true;
  room.add(ceilingMesh);

  // Walls
  const wallGeom1 = new THREE.PlaneGeometry(width, height);
  const back = new THREE.Mesh(wallGeom1, wallMat);
  back.position.z = -depth/2;
  back.position.y = height/2;
  back.receiveShadow = true;
  back.userData.wall = 'back';
  room.add(back);

  const front = new THREE.Mesh(wallGeom1, wallMat);
  front.position.z = depth/2;
  front.position.y = height/2;
  front.rotation.y = Math.PI;
  front.receiveShadow = true;
  front.userData.wall = 'front';
  room.add(front);

  const wallGeom2 = new THREE.PlaneGeometry(depth, height);
  const left = new THREE.Mesh(wallGeom2, wallMat);
  left.position.x = -width/2;
  left.position.y = height/2;
  left.rotation.y = -Math.PI/2;
  left.receiveShadow = true;
  left.userData.wall = 'left';
  room.add(left);

  const right = new THREE.Mesh(wallGeom2, wallMat);
  right.position.x = width/2;
  right.position.y = height/2;
  right.rotation.y = Math.PI/2;
  right.receiveShadow = true;
  right.userData.wall = 'right';
  room.add(right);

  // Grid helper
  const grid = new THREE.GridHelper(Math.max(width,depth)*2, Math.max(width,depth)*2, 0x444444, 0x888888);
  grid.material.opacity = 0.15;
  grid.material.transparent = true;
  grid.position.y = 0.01;
  room.add(grid);

  room.add(roomAssets);
  buildRoomAssets(appState, width, depth, height);

  furniture.children.forEach(obj => clampToRoom(appState, obj.position));

  room.userData.bounds = { width, depth, height };
}

export function clampToRoom(appState, pos) {
  const b = appState.room.userData.bounds || CONST.DEFAULT_ROOM;
  const halfW = b.width/2 - CONST.ROOM_PADDING;
  const halfD = b.depth/2 - CONST.ROOM_PADDING;
  const maxY = b.height - CONST.ROOM_PADDING;
  
  pos.x = Math.max(-halfW, Math.min(halfW, pos.x));
  pos.z = Math.max(-halfD, Math.min(halfD, pos.z));
  pos.y = Math.max(CONST.BOUNDS.minY, Math.min(maxY, pos.y));
}
