export const SCHEMA_VERSION = 2;
export const MAX_DOCUMENT_BYTES = 2 * 1024 * 1024;
export const MAX_OBJECTS = 1000;
export const MM_PER_METRE = 1000;

export const SUPPORTED_OBJECT_KINDS = Object.freeze([
  'box',
  'sphere',
  'cylinder',
  'cone',
  'chair',
]);

export const SUPPORTED_OPENING_KINDS = Object.freeze(['door', 'window']);
export const SUPPORTED_WALLS = Object.freeze(['front', 'right', 'back', 'left']);

export function metresToMillimetres(value) {
  return value * MM_PER_METRE;
}

export function millimetresToMetres(value) {
  return value / MM_PER_METRE;
}

export function createId(prefix = 'item') {
  if (globalThis.crypto?.randomUUID) return `${prefix}-${globalThis.crypto.randomUUID()}`;
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export function createDefaultDocument() {
  return {
    schemaVersion: SCHEMA_VERSION,
    units: 'millimetres',
    coordinateSystem: {
      upAxis: 'y',
      floorPlane: 'xz',
      origin: 'room-centre-floor',
      objectOrigin: 'footprint-centre-base',
      rotationUnit: 'radians',
      wallOffsetDirections: {
        front: 'left-to-right',
        right: 'front-to-back',
        back: 'right-to-left',
        left: 'back-to-front',
      },
    },
    room: {
      id: 'room',
      width: 6000,
      depth: 5000,
      height: 3000,
      wallThickness: 0,
      materials: {
        floor: '#8b6b4b',
        wall: '#f0f0f0',
        ceiling: '#ffffff',
      },
      openings: [],
    },
    objects: [],
    preferences: {
      displayUnits: 'metric',
      gridStep: 250,
    },
  };
}

export function cloneDocument(document) {
  return structuredClone(document);
}
