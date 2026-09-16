import test from 'node:test';
import assert from 'node:assert/strict';

import { createDefaultDocument } from '../3d/src/model/document.js';
import { migrateDocument } from '../3d/src/model/migrate.js';
import { parseRoomDocument, serializeRoomDocument } from '../3d/src/model/persistence.js';
import { validateDocument } from '../3d/src/model/validate.js';

test('default document is valid and round-trips exactly', () => {
  const document = createDefaultDocument();
  assert.deepEqual(parseRoomDocument(serializeRoomDocument(document)), document);
});

test('legacy metre-based saves migrate to canonical millimetres', () => {
  const migrated = migrateDocument({
    version: '1.0',
    room: { width: 4.2, depth: 3.5, height: 2.4 },
    materials: { floor: '112233', wall: '#abcdef', ceiling: '#ffffff' },
    furniture: [{
      uuid: 'box-1',
      name: 'Box 1',
      type: 'unknown',
      position: { x: 1.25, y: 0.4, z: -0.5 },
      rotation: { x: 0.1, y: Math.PI / 2, z: 0 },
      scale: { x: 1.2, y: 0.75, z: 0.6 },
      color: '445566',
    }],
  });

  assert.equal(migrated.room.width, 4200);
  assert.deepEqual(migrated.objects[0].dimensions, { width: 1200, depth: 360, height: 375 });
  assert.deepEqual(migrated.objects[0].transform, {
    x: 1250,
    y: 212.5,
    z: -500,
    rotationY: Math.PI / 2,
  });
  assert.deepEqual(migrated.objects[0].legacyTilt, { x: 0.1, z: 0 });
  assert.equal(validateDocument(migrated).valid, true);
});

test('legacy unknown custom objects retain the unit-cube fallback', () => {
  const migrated = migrateDocument({
    version: '1.0',
    room: { width: 6, depth: 5, height: 3 },
    furniture: [{
      uuid: 'custom-1',
      name: 'Custom Object',
      type: 'unknown',
      position: { x: 0, y: 0.5, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 2, y: 0.5, z: 0.75 },
      color: '#ffffff',
    }],
  });

  assert.deepEqual(migrated.objects[0].dimensions, { width: 2000, depth: 750, height: 500 });
  assert.equal(migrated.objects[0].transform.y, 250);
});

test('validation rejects duplicate IDs and non-finite geometry', () => {
  const document = createDefaultDocument();
  document.objects = [{
    id: 'room',
    kind: 'box',
    name: 'Invalid',
    dimensions: { width: Infinity, depth: 500, height: 500 },
    transform: { x: 0, y: 0, z: 0, rotationY: 0 },
    material: { color: '#ffffff' },
    locked: false,
  }];
  const result = validateDocument(document);
  assert.equal(result.valid, false);
  assert.match(result.errors.join('\n'), /duplicate "room"/);
  assert.match(result.errors.join('\n'), /dimensions\.width/);
});

test('failed parsing reports malformed JSON without exposing parser details', () => {
  assert.throws(() => parseRoomDocument('{'), /not valid JSON/);
});

test('unknown schema versions fail instead of being guessed', () => {
  assert.throws(() => parseRoomDocument('{"schemaVersion":99}'), /Unsupported room document version/);
});

test('semantic furniture and door data survive persistence', () => {
  const document = createDefaultDocument();
  document.room.openings.push({
    id: 'door-1',
    kind: 'door',
    wall: 'front',
    offset: 800,
    width: 900,
    height: 2100,
    hingeSide: 'left',
    swingDirection: 'inward',
    swingAngle: Math.PI / 2,
  });
  document.objects.push({
    id: 'chair-1',
    kind: 'chair',
    name: 'Desk chair',
    dimensions: { width: 600, depth: 600, height: 900 },
    transform: { x: 1200, y: 0, z: -400, rotationY: Math.PI / 4 },
    material: { color: '#8b4513' },
    locked: false,
  });

  assert.deepEqual(parseRoomDocument(serializeRoomDocument(document)), document);
});

test('openings cannot extend past their host wall', () => {
  const document = createDefaultDocument();
  document.room.openings.push({
    id: 'window-1',
    kind: 'window',
    wall: 'right',
    offset: 4900,
    width: 500,
    height: 900,
    elevation: 1200,
  });
  const result = validateDocument(document);
  assert.equal(result.valid, false);
  assert.match(result.errors.join('\n'), /extends beyond its wall/);
});
