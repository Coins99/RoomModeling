import {
  MAX_OBJECTS,
  SCHEMA_VERSION,
  SUPPORTED_OBJECT_KINDS,
  SUPPORTED_OPENING_KINDS,
  SUPPORTED_WALLS,
} from './document.js';

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function finite(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function positive(value) {
  return finite(value) && value > 0;
}

function validateVector(errors, value, path, keys) {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return;
  }
  for (const key of keys) {
    if (!finite(value[key])) errors.push(`${path}.${key} must be a finite number`);
  }
}

function validateId(errors, value, path, ids) {
  if (typeof value !== 'string' || value.trim() === '') {
    errors.push(`${path} must be a non-empty string`);
  } else if (ids.has(value)) {
    errors.push(`${path} must be unique; duplicate "${value}"`);
  } else {
    ids.add(value);
  }
}

function validateColor(errors, value, path) {
  if (typeof value !== 'string' || !HEX_COLOR.test(value)) {
    errors.push(`${path} must be a six-digit hex color`);
  }
}

export function validateDocument(document) {
  const errors = [];
  const ids = new Set();

  if (!isRecord(document)) return { valid: false, errors: ['document must be an object'] };
  if (document.schemaVersion !== SCHEMA_VERSION) {
    errors.push(`schemaVersion must be ${SCHEMA_VERSION}`);
  }
  if (document.units !== 'millimetres') errors.push('units must be "millimetres"');

  const coordinates = document.coordinateSystem;
  if (!isRecord(coordinates)
    || coordinates.upAxis !== 'y'
    || coordinates.floorPlane !== 'xz'
    || coordinates.origin !== 'room-centre-floor'
    || coordinates.objectOrigin !== 'footprint-centre-base'
    || coordinates.rotationUnit !== 'radians') {
    errors.push('coordinateSystem must use Y-up, the X/Z floor plane, documented room/object origins and radians');
  }
  const wallDirections = coordinates?.wallOffsetDirections;
  if (!isRecord(wallDirections)
    || wallDirections.front !== 'left-to-right'
    || wallDirections.right !== 'front-to-back'
    || wallDirections.back !== 'right-to-left'
    || wallDirections.left !== 'back-to-front') {
    errors.push('coordinateSystem.wallOffsetDirections must use the canonical wall directions');
  }

  const room = document.room;
  if (!isRecord(room)) {
    errors.push('room must be an object');
  } else {
    validateId(errors, room.id, 'room.id', ids);
    for (const key of ['width', 'depth', 'height']) {
      if (!positive(room[key])) errors.push(`room.${key} must be a positive finite number`);
    }
    if (!finite(room.wallThickness) || room.wallThickness < 0) {
      errors.push('room.wallThickness must be a non-negative finite number');
    }
    if (!isRecord(room.materials)) {
      errors.push('room.materials must be an object');
    } else {
      for (const key of ['floor', 'wall', 'ceiling']) {
        validateColor(errors, room.materials[key], `room.materials.${key}`);
      }
    }
    if (!Array.isArray(room.openings)) {
      errors.push('room.openings must be an array');
    } else {
      room.openings.forEach((opening, index) => {
        const path = `room.openings[${index}]`;
        if (!isRecord(opening)) {
          errors.push(`${path} must be an object`);
          return;
        }
        validateId(errors, opening.id, `${path}.id`, ids);
        if (!SUPPORTED_OPENING_KINDS.includes(opening.kind)) errors.push(`${path}.kind is unsupported`);
        if (!SUPPORTED_WALLS.includes(opening.wall)) errors.push(`${path}.wall is unsupported`);
        if (!finite(opening.offset) || opening.offset < 0) errors.push(`${path}.offset must be non-negative`);
        if (!positive(opening.width) || !positive(opening.height)) errors.push(`${path} dimensions must be positive`);
        if (opening.elevation !== undefined && (!finite(opening.elevation) || opening.elevation < 0)) {
          errors.push(`${path}.elevation must be non-negative`);
        }
        const wallLength = ['front', 'back'].includes(opening.wall) ? room.width : room.depth;
        if (finite(opening.offset) && positive(opening.width) && finite(wallLength)
          && opening.offset + opening.width > wallLength) {
          errors.push(`${path} extends beyond its wall`);
        }
        if (opening.kind === 'door') {
          if (!['left', 'right'].includes(opening.hingeSide)) errors.push(`${path}.hingeSide is unsupported`);
          if (!['inward', 'outward'].includes(opening.swingDirection)) errors.push(`${path}.swingDirection is unsupported`);
          if (!finite(opening.swingAngle) || opening.swingAngle <= 0 || opening.swingAngle > Math.PI) {
            errors.push(`${path}.swingAngle must be between 0 and pi radians`);
          }
        }
      });
    }
  }

  if (!Array.isArray(document.objects)) {
    errors.push('objects must be an array');
  } else {
    if (document.objects.length > MAX_OBJECTS) errors.push(`objects cannot contain more than ${MAX_OBJECTS} entries`);
    document.objects.forEach((object, index) => {
      const path = `objects[${index}]`;
      if (!isRecord(object)) {
        errors.push(`${path} must be an object`);
        return;
      }
      validateId(errors, object.id, `${path}.id`, ids);
      if (!SUPPORTED_OBJECT_KINDS.includes(object.kind)) errors.push(`${path}.kind is unsupported`);
      if (typeof object.name !== 'string') errors.push(`${path}.name must be a string`);
      validateVector(errors, object.dimensions, `${path}.dimensions`, ['width', 'depth', 'height']);
      if (isRecord(object.dimensions)) {
        for (const key of ['width', 'depth', 'height']) {
          if (!positive(object.dimensions[key])) errors.push(`${path}.dimensions.${key} must be positive`);
        }
      }
      validateVector(errors, object.transform, `${path}.transform`, ['x', 'y', 'z', 'rotationY']);
      if (object.legacyTilt !== undefined) validateVector(errors, object.legacyTilt, `${path}.legacyTilt`, ['x', 'z']);
      validateColor(errors, object.material?.color, `${path}.material.color`);
      if (object.locked !== undefined && typeof object.locked !== 'boolean') errors.push(`${path}.locked must be a boolean`);
    });
  }

  if (!isRecord(document.preferences)) {
    errors.push('preferences must be an object');
  } else {
    if (!['metric', 'imperial'].includes(document.preferences.displayUnits)) {
      errors.push('preferences.displayUnits is unsupported');
    }
    if (!positive(document.preferences.gridStep)) errors.push('preferences.gridStep must be positive');
  }

  return { valid: errors.length === 0, errors };
}

export function assertValidDocument(document) {
  const result = validateDocument(document);
  if (!result.valid) throw new Error(`Invalid room document:\n- ${result.errors.join('\n- ')}`);
  return document;
}
