import { createDefaultDocument, createId, metresToMillimetres, millimetresToMetres } from '../model/document.js';
import { assertValidDocument } from '../model/validate.js';
import { createFurnitureFromModel, disposeObject, firstObjectColor } from './objectRegistry.js';

function inferKind(object) {
  if (object.userData.kind) return object.userData.kind;
  if (object.userData.type && ['box', 'sphere', 'cylinder', 'cone', 'chair'].includes(object.userData.type)) {
    return object.userData.type;
  }
  if (object.isGroup) return 'chair';
  const type = object.geometry?.type;
  if (type === 'SphereGeometry') return 'sphere';
  if (type === 'CylinderGeometry') return 'cylinder';
  if (type === 'ConeGeometry') return 'cone';
  return 'box';
}

function inferDimensions(appState, object) {
  if (object.userData.dimensionsMm) {
    const baseScale = object.userData.modelScale ?? { x: 1, y: 1, z: 1 };
    return {
      width: object.userData.dimensionsMm.width * Math.abs(object.scale.x / baseScale.x),
      depth: object.userData.dimensionsMm.depth * Math.abs(object.scale.z / baseScale.z),
      height: object.userData.dimensionsMm.height * Math.abs(object.scale.y / baseScale.y),
    };
  }
  const geometry = object.geometry?.parameters;
  if (geometry) {
    const radius = geometry.radius ?? Math.max(geometry.radiusTop ?? 0, geometry.radiusBottom ?? 0);
    return {
      width: metresToMillimetres((geometry.width ?? radius * 2 ?? 1) * Math.abs(object.scale.x)),
      depth: metresToMillimetres((geometry.depth ?? radius * 2 ?? 1) * Math.abs(object.scale.z)),
      height: metresToMillimetres((geometry.height ?? radius * 2 ?? 1) * Math.abs(object.scale.y)),
    };
  }
  const bounds = new appState.THREE.Box3().setFromObject(object);
  const size = bounds.getSize(new appState.THREE.Vector3());
  return {
    width: metresToMillimetres(size.x),
    depth: metresToMillimetres(size.z),
    height: metresToMillimetres(size.y),
  };
}

function furnitureToModel(appState, object) {
  const dimensions = inferDimensions(appState, object);
  const baseY = object.isGroup
    ? object.position.y
    : object.position.y - millimetresToMetres(dimensions.height) / 2;
  const model = {
    id: object.userData.modelId || createId('object'),
    kind: inferKind(object),
    name: object.name || 'Unnamed object',
    dimensions,
    transform: {
      x: metresToMillimetres(object.position.x),
      y: metresToMillimetres(baseY),
      z: metresToMillimetres(object.position.z),
      rotationY: object.rotation.y,
    },
    material: { color: firstObjectColor(object) },
    locked: object.userData.locked === true,
  };
  object.userData.modelId = model.id;
  object.userData.kind = model.kind;
  object.userData.dimensionsMm = { ...model.dimensions };
  object.userData.modelScale = { x: object.scale.x, y: object.scale.y, z: object.scale.z };
  if (object.rotation.x !== 0 || object.rotation.z !== 0) {
    model.legacyTilt = { x: object.rotation.x, z: object.rotation.z };
  }
  return model;
}

function openingToModel(asset) {
  return asset.userData.opening ? structuredClone(asset.userData.opening) : null;
}

export function sceneToDocument(appState) {
  const roomDocument = createDefaultDocument();
  const bounds = appState.room.userData.bounds;
  roomDocument.room.width = metresToMillimetres(bounds.width);
  roomDocument.room.depth = metresToMillimetres(bounds.depth);
  roomDocument.room.height = metresToMillimetres(bounds.height);
  roomDocument.room.materials = {
    floor: `#${appState.floorMat.color.getHexString()}`,
    wall: `#${appState.wallMat.color.getHexString()}`,
    ceiling: `#${appState.ceilingMat.color.getHexString()}`,
  };
  roomDocument.room.openings = appState.roomAssets.children.map(openingToModel).filter(Boolean);
  roomDocument.objects = appState.furniture.children.map((object) => furnitureToModel(appState, object));
  const gridStep = Number.parseFloat(globalThis.document.getElementById('snapSize')?.value ?? '0.25');
  roomDocument.preferences.gridStep = metresToMillimetres(gridStep);
  return assertValidDocument(roomDocument);
}

function createOpening(appState, opening, room) {
  const { THREE } = appState;
  const roomWidth = millimetresToMetres(room.width);
  const roomDepth = millimetresToMetres(room.depth);
  const width = millimetresToMetres(opening.width);
  const height = millimetresToMetres(opening.height);
  const offset = millimetresToMetres(opening.offset);
  const thickness = 0.08;
  const geometry = opening.kind === 'door'
    ? new THREE.BoxGeometry(width, height, thickness)
    : new THREE.PlaneGeometry(width, height);
  const material = new THREE.MeshStandardMaterial({
    color: opening.kind === 'door' ? 0x6d4c41 : 0x99caff,
    transparent: opening.kind === 'window',
    opacity: opening.kind === 'window' ? 0.45 : 1,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = opening.kind === 'door' ? 'Door' : 'Window';
  const alongX = -roomWidth / 2 + offset + width / 2;
  const alongZ = -roomDepth / 2 + offset + width / 2;
  const y = opening.kind === 'door' ? height / 2 : opening.elevation ? millimetresToMetres(opening.elevation) : height;
  if (opening.wall === 'front') mesh.position.set(alongX, y, roomDepth / 2 - thickness / 2);
  if (opening.wall === 'back') mesh.position.set(-alongX, y, -roomDepth / 2 + thickness / 2);
  if (opening.wall === 'right') {
    mesh.position.set(roomWidth / 2 - thickness / 2, y, -alongZ);
    mesh.rotation.y = Math.PI / 2;
  }
  if (opening.wall === 'left') {
    mesh.position.set(-roomWidth / 2 + thickness / 2, y, alongZ);
    mesh.rotation.y = -Math.PI / 2;
  }
  mesh.userData.opening = structuredClone(opening);
  mesh.castShadow = opening.kind === 'door';
  mesh.receiveShadow = true;
  return mesh;
}

export function applyDocumentToScene(appState, roomDocument) {
  assertValidDocument(roomDocument);

  const stagedFurniture = [];
  const stagedOpenings = [];
  try {
    roomDocument.objects.forEach((object) => stagedFurniture.push(createFurnitureFromModel(appState, object)));
    roomDocument.room.openings.forEach((opening) => {
      stagedOpenings.push(createOpening(appState, opening, roomDocument.room));
    });
  } catch (error) {
    stagedFurniture.forEach(disposeObject);
    stagedOpenings.forEach(disposeObject);
    throw error;
  }

  appState.setSelected(null);
  appState.transformControls.detach();
  appState.transformControls.visible = false;
  appState.furniture.children.slice().forEach((object) => {
    appState.furniture.remove(object);
    disposeObject(object);
  });

  appState.floorMat.color.set(roomDocument.room.materials.floor);
  appState.wallMat.color.set(roomDocument.room.materials.wall);
  appState.ceilingMat.color.set(roomDocument.room.materials.ceiling);
  const width = millimetresToMetres(roomDocument.room.width);
  const depth = millimetresToMetres(roomDocument.room.depth);
  const height = millimetresToMetres(roomDocument.room.height);
  appState.buildRoom(width, depth, height);
  globalThis.document.getElementById('roomWidth').value = width;
  globalThis.document.getElementById('roomDepth').value = depth;
  globalThis.document.getElementById('roomHeight').value = height;
  globalThis.document.getElementById('snapSize').value = millimetresToMetres(roomDocument.preferences.gridStep);

  stagedFurniture.forEach((object) => appState.furniture.add(object));
  stagedOpenings.forEach((opening) => appState.roomAssets.add(opening));
  appState.updateInspector?.();
  appState.updateSelectedInfo?.();
}
