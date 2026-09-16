import {
  createDefaultDocument,
  createId,
  metresToMillimetres,
  SCHEMA_VERSION,
} from './document.js';

function numberOr(value, fallback) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function normalizeColor(value, fallback) {
  if (typeof value !== 'string') return fallback;
  const color = value.startsWith('#') ? value : `#${value}`;
  return /^#[0-9a-f]{6}$/i.test(color) ? color.toLowerCase() : fallback;
}

function legacyDimensions(item, kind, usesStandardBoxDimensions) {
  const scale = item.scale ?? {};
  const x = Math.abs(numberOr(scale.x, 1));
  const y = Math.abs(numberOr(scale.y, 1));
  const z = Math.abs(numberOr(scale.z, 1));

  if (kind === 'box' && usesStandardBoxDimensions) {
    return { width: 1000 * x, depth: 600 * z, height: 500 * y };
  }
  if (kind === 'sphere') {
    return { width: 700 * x, depth: 700 * z, height: 700 * y };
  }
  if (kind === 'chair') {
    return { width: 600 * x, depth: 600 * z, height: 900 * y };
  }
  return { width: 1000 * x, depth: 1000 * z, height: 1000 * y };
}

function migrateLegacy(document) {
  const migrated = createDefaultDocument();
  const room = document.room ?? {};
  const materials = document.materials ?? {};
  migrated.room.width = metresToMillimetres(numberOr(room.width, 6));
  migrated.room.depth = metresToMillimetres(numberOr(room.depth, 5));
  migrated.room.height = metresToMillimetres(numberOr(room.height, 3));
  migrated.room.materials = {
    floor: normalizeColor(materials.floor, migrated.room.materials.floor),
    wall: normalizeColor(materials.wall, migrated.room.materials.wall),
    ceiling: normalizeColor(materials.ceiling, migrated.room.materials.ceiling),
  };

  migrated.objects = (Array.isArray(document.furniture) ? document.furniture : []).map((item) => {
    const position = item.position ?? {};
    const rotation = item.rotation ?? {};
    const name = String(item.name ?? '').trim();
    const nameKind = ['box', 'sphere', 'chair', 'cylinder', 'cone']
      .find((kind) => name.toLowerCase().startsWith(kind));
    const knownKind = ['box', 'sphere', 'chair', 'cylinder', 'cone'].includes(item.type)
      ? item.type
      : nameKind ?? 'box';
    const usesStandardBoxDimensions = item.type === 'box' || /^box\s+\d+$/i.test(name);
    const dimensions = legacyDimensions(item, knownKind, usesStandardBoxDimensions);
    const rendererY = numberOr(position.y, knownKind === 'chair' ? 0 : dimensions.height / 2000);
    const baseY = knownKind === 'chair'
      ? metresToMillimetres(rendererY)
      : metresToMillimetres(rendererY) - dimensions.height / 2;
    const result = {
      id: typeof item.uuid === 'string' && item.uuid ? item.uuid : createId('object'),
      kind: knownKind,
      name: typeof item.name === 'string' ? item.name : 'Imported object',
      dimensions,
      transform: {
        x: metresToMillimetres(numberOr(position.x, 0)),
        y: baseY,
        z: metresToMillimetres(numberOr(position.z, 0)),
        rotationY: numberOr(rotation.y, 0),
      },
      material: { color: normalizeColor(item.color, '#ffffff') },
      locked: false,
    };
    const tiltX = numberOr(rotation.x, 0);
    const tiltZ = numberOr(rotation.z, 0);
    if (tiltX !== 0 || tiltZ !== 0) result.legacyTilt = { x: tiltX, z: tiltZ };
    return result;
  });

  return migrated;
}

export function migrateDocument(document) {
  if (document?.schemaVersion === SCHEMA_VERSION) return structuredClone(document);
  if (document?.version === '1.0' || (document?.schemaVersion === undefined && document?.room)) {
    return migrateLegacy(document);
  }
  throw new Error(`Unsupported room document version: ${document?.schemaVersion ?? document?.version ?? 'missing'}`);
}
