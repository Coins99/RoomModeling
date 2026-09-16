import * as CONST from '../core/constants.js';
import { applyDocumentToScene, sceneToDocument } from '../render/sceneDocument.js';

export function setupHistory(appState) {
  appState.history = {
    entries: [],
    index: -1,
    maxHistory: CONST.HISTORY_DEFAULTS.maxHistory,
  };
  appState.saveState = (description) => saveState(appState, description);
  appState.undo = () => undo(appState);
  appState.redo = () => redo(appState);
  appState.resetHistory = (document, description) => resetHistory(appState, document, description);
  appState.updateHistoryUI = () => updateHistoryUI(appState);

  document.getElementById('undoBtn')?.addEventListener('click', appState.undo);
  document.getElementById('redoBtn')?.addEventListener('click', appState.redo);
  window.setTimeout(() => saveState(appState, 'Initial state'), 100);
}

function snapshot(document) {
  return structuredClone(document);
}

export function saveState(appState, description = 'Action') {
  const { history } = appState;
  const document = sceneToDocument(appState);
  const current = history.entries[history.index];
  if (current && JSON.stringify(current.document) === JSON.stringify(document)) return;

  history.entries.splice(history.index + 1);
  history.entries.push({ description, document: snapshot(document) });
  if (history.entries.length > history.maxHistory) history.entries.shift();
  history.index = history.entries.length - 1;
  updateHistoryUI(appState);
}

export function resetHistory(appState, document, description = 'Loaded document') {
  appState.history.entries = [{ description, document: snapshot(document) }];
  appState.history.index = 0;
  updateHistoryUI(appState);
}

export function undo(appState) {
  if (appState.history.index <= 0) return;
  appState.history.index -= 1;
  applyDocumentToScene(appState, snapshot(appState.history.entries[appState.history.index].document));
  updateHistoryUI(appState);
}

export function redo(appState) {
  if (appState.history.index >= appState.history.entries.length - 1) return;
  appState.history.index += 1;
  applyDocumentToScene(appState, snapshot(appState.history.entries[appState.history.index].document));
  updateHistoryUI(appState);
}

function updateHistoryUI(appState) {
  const { entries, index } = appState.history;
  const count = document.getElementById('historyCount');
  if (count) count.textContent = entries.length ? `${entries.length} actions` : 'No actions yet';

  const list = document.getElementById('historyList');
  if (list) {
    list.textContent = entries.length
      ? entries.map((entry, itemIndex) => `${itemIndex === index ? '•' : ' '} ${entry.description}`).join('\n')
      : 'No actions yet';
    list.style.whiteSpace = 'pre-line';
  }
}
