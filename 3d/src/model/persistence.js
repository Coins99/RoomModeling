import { MAX_DOCUMENT_BYTES } from './document.js';
import { migrateDocument } from './migrate.js';
import { assertValidDocument } from './validate.js';

export function parseRoomDocument(json) {
  if (typeof json !== 'string') throw new TypeError('Room document input must be text');
  if (new TextEncoder().encode(json).byteLength > MAX_DOCUMENT_BYTES) {
    throw new Error(`Room document exceeds the ${MAX_DOCUMENT_BYTES} byte limit`);
  }

  let parsed;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('Room document is not valid JSON');
  }
  return assertValidDocument(migrateDocument(parsed));
}

export function serializeRoomDocument(document, spacing = 2) {
  return JSON.stringify(assertValidDocument(structuredClone(document)), null, spacing);
}
