import { parseRoomDocument, serializeRoomDocument } from '../../model/persistence.js';
import { applyDocumentToScene, sceneToDocument } from '../../render/sceneDocument.js';

const AUTOSAVE_KEY = 'room-autosave';
const AUTOSAVE_INTERVAL = 30000;

function downloadText(text, filename, type) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function describeError(error) {
  return error instanceof Error ? error.message : String(error);
}

function loadText(appState, text, sourceLabel) {
  // Parsing, migration, and validation finish before the active scene is touched.
  const documentModel = parseRoomDocument(text);
  applyDocumentToScene(appState, documentModel);
  appState.resetHistory?.(documentModel, `Load ${sourceLabel}`);
}

function saveCurrentDocument(appState) {
  return serializeRoomDocument(sceneToDocument(appState));
}

export function setupSaveLoad(appState) {
  document.getElementById('saveBtn')?.addEventListener('click', () => {
    try {
      downloadText(
        saveCurrentDocument(appState),
        `room-${new Date().toISOString().slice(0, 10)}.json`,
        'application/json',
      );
    } catch (error) {
      console.error('Could not save room:', error);
      alert(`Could not save room: ${describeError(error)}`);
    }
  });

  document.getElementById('loadBtn')?.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        loadText(appState, await file.text(), file.name);
        alert('Room loaded successfully.');
      } catch (error) {
        console.error('Could not load room:', error);
        alert(`Room was not changed: ${describeError(error)}`);
      }
    });
    input.click();
  });

  const autoSave = () => {
    try {
      localStorage.setItem(AUTOSAVE_KEY, saveCurrentDocument(appState));
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  };
  window.setInterval(autoSave, AUTOSAVE_INTERVAL);

  document.getElementById('loadAutoSave')?.addEventListener('click', () => {
    const saved = localStorage.getItem(AUTOSAVE_KEY);
    if (!saved) {
      alert('No auto-save found.');
      return;
    }
    try {
      loadText(appState, saved, 'auto-save');
      alert('Auto-save loaded successfully.');
    } catch (error) {
      console.error('Could not load auto-save:', error);
      alert(`Room was not changed: ${describeError(error)}`);
    }
  });

  document.getElementById('exportImg')?.addEventListener('click', () => {
    appState.renderer.render(appState.scene, appState.camera);
    appState.renderer.domElement.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `room-${new Date().toISOString().slice(0, 10)}.png`;
      anchor.click();
      URL.revokeObjectURL(url);
    });
  });

  appState.serializeDocument = () => saveCurrentDocument(appState);
  appState.loadDocument = (text) => loadText(appState, text, 'document');
}
