import * as CONST from '../../core/constants.js';

export function buildRoomAssets(appState, width, depth, height) {
  const { THREE, roomAssets } = appState;
  const assets = CONST.ROOM_ASSETS;
  
  while (roomAssets.children.length) roomAssets.remove(roomAssets.children[0]);

  // Ceiling fixture
  const fixtureGeom = new THREE.CylinderGeometry(assets.fixture.radius, assets.fixture.radius, assets.fixture.height, 32);
  const fixtureMat = new THREE.MeshStandardMaterial({ color: assets.fixture.color || CONST.COLORS.fixture, roughness: 0.4 });
  const fixture = new THREE.Mesh(fixtureGeom, fixtureMat);
  fixture.position.set(0, height - 0.05, 0);
  fixture.rotation.x = Math.PI / 2;
  fixture.castShadow = false;
  roomAssets.add(fixture);

  // Bulb + Light
  const bulbGeom = new THREE.SphereGeometry(assets.bulb.radius, 32, 16);
  const bulbMat = new THREE.MeshStandardMaterial({
    emissive: 0xffffee,
    emissiveIntensity: 1.5,
    color: CONST.COLORS.bulb
  });
  const bulb = new THREE.Mesh(bulbGeom, bulbMat);
  bulb.position.set(0, height - 0.18, 0);
  bulb.castShadow = false;
  roomAssets.add(bulb);

  const bulbLight = new THREE.PointLight(0xffffff, 0.9, assets.bulb.lightRange(width, depth));
  bulbLight.position.set(0, height - 0.18, 0);
  bulbLight.castShadow = true;
  roomAssets.add(bulbLight);
}

export function addDoor(appState) {
  const { THREE, roomAssets } = appState;
  const door = CONST.ROOM_ASSETS.door;
  
  const geom = new THREE.BoxGeometry(door.width, door.height, door.thickness);
  const mat = new THREE.MeshStandardMaterial({ color: CONST.COLORS.door });
  const doorMesh = new THREE.Mesh(geom, mat);
  doorMesh.name = 'Door';
  doorMesh.castShadow = true;
  doorMesh.receiveShadow = true;
  
  const b = appState.room.userData.bounds || CONST.DEFAULT_ROOM;
  doorMesh.position.set(0, door.height/2, b.depth/2 - door.thickness/2 - 0.01);
  doorMesh.userData.wall = 'front';
  roomAssets.add(doorMesh);
  appState.saveState('Add Door');
}

export function addWindow(appState) {
  const { THREE, roomAssets } = appState;
  const window_ = CONST.ROOM_ASSETS.window;
  
  const windowGeom = new THREE.PlaneGeometry(window_.width, window_.height);
  const windowMat = new THREE.MeshStandardMaterial({ 
    color: CONST.COLORS.window, 
    transparent: true, 
    opacity: window_.opacity,
    side: THREE.DoubleSide
  });
  const windowMesh = new THREE.Mesh(windowGeom, windowMat);
  windowMesh.name = 'Window';
  const b = appState.room.userData.bounds || CONST.DEFAULT_ROOM;
  windowMesh.position.set(b.width/2 - window_.width/2 - 0.1, (b.height||3) * 0.65, -b.depth/4);
  windowMesh.rotation.y = Math.PI / 2;
  windowMesh.userData.wall = 'right';
  roomAssets.add(windowMesh);
  appState.saveState('Add Window');
}
