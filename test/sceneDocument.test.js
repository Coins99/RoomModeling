import test from 'node:test';
import assert from 'node:assert/strict';

import { createDefaultDocument } from '../3d/src/model/document.js';
import { applyDocumentToScene, sceneToDocument } from '../3d/src/render/sceneDocument.js';

function color(hex) {
  return { getHexString: () => hex };
}

test('scene adapter converts renderer metres and centre origins to canonical millimetres', () => {
  const previousDocument = globalThis.document;
  globalThis.document = {
    getElementById: (id) => (id === 'snapSize' ? { value: '0.05' } : null),
  };
  try {
    const furniture = {
      isGroup: false,
      name: 'Scaled desk',
      position: { x: 1.2, y: 0.75, z: -0.4 },
      rotation: { x: 0, y: Math.PI / 2, z: 0 },
      scale: { x: 2, y: 1, z: 1 },
      userData: {
        modelId: 'desk-1',
        kind: 'box',
        dimensionsMm: { width: 1000, depth: 500, height: 500 },
        modelScale: { x: 1, y: 1, z: 1 },
        locked: false,
      },
      traverse(callback) {
        callback({ material: { color: color('445566') } });
      },
    };
    const opening = {
      userData: {
        opening: {
          id: 'door-1', kind: 'door', wall: 'front', offset: 500,
          width: 900, height: 2100, hingeSide: 'left',
          swingDirection: 'inward', swingAngle: Math.PI / 2,
        },
      },
    };
    const appState = {
      room: { userData: { bounds: { width: 6, depth: 5, height: 3 } } },
      floorMat: { color: color('111111') },
      wallMat: { color: color('222222') },
      ceilingMat: { color: color('333333') },
      roomAssets: { children: [opening] },
      furniture: { children: [furniture] },
    };

    const first = sceneToDocument(appState);
    assert.deepEqual(first.objects[0].dimensions, { width: 2000, depth: 500, height: 500 });
    assert.deepEqual(first.objects[0].transform, {
      x: 1200, y: 500, z: -400, rotationY: Math.PI / 2,
    });
    assert.equal(first.preferences.gridStep, 50);
    assert.deepEqual(first.room.openings, [opening.userData.opening]);

    // Capturing the same scene twice must not compound renderer scale.
    assert.deepEqual(sceneToDocument(appState).objects[0].dimensions, first.objects[0].dimensions);
  } finally {
    globalThis.document = previousDocument;
  }
});

test('validated documents stage renderer objects against the incoming room dimensions', () => {
  class Transform {
    constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
    set(x, y, z) { this.x = x; this.y = y; this.z = z; }
  }
  class Geometry {
    constructor(...parameters) { this.parameters = parameters; }
    dispose() {}
  }
  class Material {
    constructor(options) { this.options = options; this.color = color('abcdef'); }
    dispose() {}
  }
  class Node {
    constructor() {
      this.children = [];
      this.userData = {};
      this.position = new Transform();
      this.rotation = new Transform();
      this.scale = new Transform(1, 1, 1);
    }
    add(child) { this.children.push(child); }
    remove(child) { this.children = this.children.filter((item) => item !== child); }
    traverse(callback) { callback(this); this.children.forEach((child) => child.traverse(callback)); }
  }
  class Mesh extends Node {
    constructor(geometry, material) { super(); this.geometry = geometry; this.material = material; this.isMesh = true; }
  }
  class Group extends Node { constructor() { super(); this.isGroup = true; } }

  const controls = new Map([
    ['roomWidth', { value: '' }], ['roomDepth', { value: '' }],
    ['roomHeight', { value: '' }], ['snapSize', { value: '' }],
  ]);
  const previousDocument = globalThis.document;
  globalThis.document = { getElementById: (id) => controls.get(id) };
  try {
    const THREE = {
      Mesh, Group, MeshStandardMaterial: Material,
      BoxGeometry: Geometry, SphereGeometry: Geometry,
      CylinderGeometry: Geometry, ConeGeometry: Geometry, PlaneGeometry: Geometry,
      DoubleSide: 2,
    };
    const furniture = new Group();
    const roomAssets = new Group();
    const appState = {
      THREE,
      room: { userData: { bounds: { width: 5, depth: 5, height: 3 } } },
      furniture,
      roomAssets,
      floorMat: { color: { set() {} } }, wallMat: { color: { set() {} } },
      ceilingMat: { color: { set() {} } },
      transformControls: { detach() {}, visible: true },
      setSelected() {},
      buildRoom(width, depth, height) {
        this.room.userData.bounds = { width, depth, height };
        this.roomAssets.children = [];
      },
    };
    const model = createDefaultDocument();
    model.room.depth = 6000;
    model.room.openings.push({
      id: 'window-1', kind: 'window', wall: 'right', offset: 0,
      width: 1000, height: 1000, elevation: 1400,
    });
    model.objects.push({
      id: 'box-1', kind: 'box', name: 'Box',
      dimensions: { width: 1000, depth: 500, height: 600 },
      transform: { x: 500, y: 100, z: -250, rotationY: 0 },
      material: { color: '#112233' }, locked: false,
    });

    applyDocumentToScene(appState, model);

    assert.equal(furniture.children[0].position.y, 0.4);
    assert.equal(roomAssets.children[0].position.z, 2.5);
    assert.equal(controls.get('roomDepth').value, 6);
    assert.equal(controls.get('snapSize').value, 0.25);
  } finally {
    globalThis.document = previousDocument;
  }
});
