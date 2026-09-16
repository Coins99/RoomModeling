import { createId, millimetresToMetres } from '../model/document.js';

function makeMaterial(THREE, color) {
  return new THREE.MeshStandardMaterial({ color });
}

function makeChair(THREE, dimensions, color) {
  const width = millimetresToMetres(dimensions.width);
  const depth = millimetresToMetres(dimensions.depth);
  const height = millimetresToMetres(dimensions.height);
  const group = new THREE.Group();
  const material = makeMaterial(THREE, color);
  const seatHeight = Math.min(height * 0.56, 0.5);
  const seatThickness = Math.max(height * 0.055, 0.04);
  const legRadius = Math.max(Math.min(width, depth) * 0.035, 0.015);

  const seat = new THREE.Mesh(new THREE.BoxGeometry(width, seatThickness, depth), material);
  seat.position.y = seatHeight;
  group.add(seat);

  const backHeight = Math.max(height - seatHeight, seatThickness);
  const back = new THREE.Mesh(new THREE.BoxGeometry(width, backHeight, seatThickness), material);
  back.position.set(0, seatHeight + backHeight / 2, depth / 2 - seatThickness / 2);
  group.add(back);

  const legGeometry = new THREE.CylinderGeometry(legRadius, legRadius, seatHeight, 12);
  for (const x of [-width / 2 + legRadius * 2, width / 2 - legRadius * 2]) {
    for (const z of [-depth / 2 + legRadius * 2, depth / 2 - legRadius * 2]) {
      const leg = new THREE.Mesh(legGeometry, material);
      leg.position.set(x, seatHeight / 2, z);
      group.add(leg);
    }
  }
  return group;
}

export function createFurnitureFromModel(appState, model) {
  const { THREE } = appState;
  const dimensions = model.dimensions;
  const width = millimetresToMetres(dimensions.width);
  const depth = millimetresToMetres(dimensions.depth);
  const height = millimetresToMetres(dimensions.height);
  const material = makeMaterial(THREE, model.material.color);
  let object;

  switch (model.kind) {
    case 'box':
      object = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
      break;
    case 'sphere':
      object = new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 16), material);
      object.scale.set(width, height, depth);
      break;
    case 'cylinder':
      object = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1, 32), material);
      object.scale.set(width, height, depth);
      break;
    case 'cone':
      object = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1, 32), material);
      object.scale.set(width, height, depth);
      break;
    case 'chair':
      object = makeChair(THREE, dimensions, model.material.color);
      material.dispose();
      break;
    default:
      throw new Error(`No renderer factory for furniture kind "${model.kind}"`);
  }

  object.name = model.name;
  object.position.set(
    millimetresToMetres(model.transform.x),
    millimetresToMetres(model.transform.y) + (model.kind === 'chair' ? 0 : height / 2),
    millimetresToMetres(model.transform.z),
  );
  object.rotation.set(model.legacyTilt?.x ?? 0, model.transform.rotationY, model.legacyTilt?.z ?? 0);
  object.userData.modelId = model.id || createId('object');
  object.userData.kind = model.kind;
  object.userData.dimensionsMm = { ...dimensions };
  object.userData.modelScale = { x: object.scale.x, y: object.scale.y, z: object.scale.z };
  object.userData.locked = model.locked === true;
  object.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  return object;
}

export function disposeObject(object) {
  const geometries = new Set();
  const materials = new Set();
  object.traverse((child) => {
    if (child.geometry) geometries.add(child.geometry);
    const childMaterials = Array.isArray(child.material) ? child.material : [child.material];
    childMaterials.filter(Boolean).forEach((material) => materials.add(material));
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
}

export function firstObjectColor(object) {
  let color = '#ffffff';
  object.traverse((child) => {
    if (color === '#ffffff' && child.material?.color) color = `#${child.material.color.getHexString()}`;
  });
  return color;
}
