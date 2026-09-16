import * as CONST from '../../core/constants.js';
import { createId, metresToMillimetres } from '../../model/document.js';
import { clampToRoom } from '../room/room.js';

function markModelObject(object, kind, width, depth, height) {
  object.userData.modelId = createId('object');
  object.userData.kind = kind;
  object.userData.dimensionsMm = {
    width: metresToMillimetres(width),
    depth: metresToMillimetres(depth),
    height: metresToMillimetres(height),
  };
  object.userData.modelScale = { x: object.scale.x, y: object.scale.y, z: object.scale.z };
  object.userData.locked = false;
}

export function addBox(appState) {
  const { THREE, furniture, transformControls } = appState;
  const sizes = CONST.FURNITURE_SIZES.box;
  
  const geom = new THREE.BoxGeometry(sizes.width, sizes.height, sizes.depth);
  const mat = new THREE.MeshStandardMaterial({color: CONST.COLORS.box});
  const m = new THREE.Mesh(geom, mat);
  m.name = 'Box ' + (furniture.children.length + 1);
  m.castShadow = true;
  m.receiveShadow = true;
  markModelObject(m, 'box', sizes.width, sizes.depth, sizes.height);
  m.position.set((Math.random()-0.5)*3, 0.25, (Math.random()-0.5)*3);
  clampToRoom(appState, m.position);
  furniture.add(m);
  appState.setSelected(m);
  transformControls.attach(m);
  transformControls.visible = true;
  appState.saveState('Add Box');
}

export function addSphere(appState) {
  const { THREE, furniture, transformControls } = appState;
  const radius = CONST.FURNITURE_SIZES.sphere.radius;
  
  const geom = new THREE.SphereGeometry(radius, 24, 16);
  const mat = new THREE.MeshStandardMaterial({color: CONST.COLORS.sphere});
  const m = new THREE.Mesh(geom, mat);
  m.name = 'Sphere ' + (furniture.children.length + 1);
  m.castShadow = true;
  m.receiveShadow = true;
  markModelObject(m, 'sphere', radius * 2, radius * 2, radius * 2);
  m.position.set((Math.random()-0.5)*3, radius, (Math.random()-0.5)*3);
  clampToRoom(appState, m.position);
  furniture.add(m);
  appState.setSelected(m);
  transformControls.attach(m);
  transformControls.visible = true;
  appState.saveState('Add Sphere');
}

export function addChair(appState) {
  const { THREE, furniture, transformControls } = appState;
  const chair = CONST.FURNITURE_SIZES.chair;
  const color = CONST.COLORS.chair;
  
  const chairGroup = new THREE.Group();
  chairGroup.name = 'Chair ' + (furniture.children.length + 1);
  
  // Seat
  const seatGeom = new THREE.BoxGeometry(chair.width, 0.05, chair.depth);
  const seatMat = new THREE.MeshStandardMaterial({color});
  const seat = new THREE.Mesh(seatGeom, seatMat);
  seat.position.y = 0.5;
  seat.castShadow = true;
  
  // Back
  const backGeom = new THREE.BoxGeometry(chair.width, 0.4, 0.05);
  const backMat = new THREE.MeshStandardMaterial({color});
  const back = new THREE.Mesh(backGeom, backMat);
  back.position.set(0, 0.7, chair.depth/2 + 0.025);
  back.castShadow = true;
  
  // Legs
  const legGeom = new THREE.CylinderGeometry(0.02, 0.02, 0.5);
  const legMat = new THREE.MeshStandardMaterial({color});
  
  for(let i = 0; i < 4; i++) {
    const leg = new THREE.Mesh(legGeom, legMat);
    const x = i % 2 ? chair.width/2 - 0.05 : -chair.width/2 + 0.05;
    const z = i < 2 ? chair.depth/2 - 0.05 : -chair.depth/2 + 0.05;
    leg.position.set(x, 0.25, z);
    leg.castShadow = true;
    chairGroup.add(leg);
  }
  
  chairGroup.add(seat);
  chairGroup.add(back);
  markModelObject(chairGroup, 'chair', chair.width, chair.depth, 0.9);
  chairGroup.position.set((Math.random()-0.5)*3, 0, (Math.random()-0.5)*3);
  clampToRoom(appState, chairGroup.position);
  furniture.add(chairGroup);
  appState.setSelected(chairGroup);
  transformControls.attach(chairGroup);
  transformControls.visible = true;
  appState.saveState('Add Chair');
}

export function createCustomObject(appState) {
  const { THREE, furniture, transformControls } = appState;
  
  const name = `${document.getElementById("objType").value} object`;
  const type = document.getElementById("objType").value;
  const color = document.getElementById("customColor").value;

  let geom;
  let dimensions;
  if (type === "box") {
    const w = parseFloat(document.getElementById("boxWidth").value) || 1;
    const h = parseFloat(document.getElementById("boxHeight").value) || 1;
    const d = parseFloat(document.getElementById("boxDepth").value) || 1;
    geom = new THREE.BoxGeometry(w, h, d);
    dimensions = { width: w, depth: d, height: h };
  } else if (type === "sphere") {
    const r = parseFloat(document.getElementById("sphereRadius").value) || 0.5;
    geom = new THREE.SphereGeometry(r, 32, 16);
    dimensions = { width: r * 2, depth: r * 2, height: r * 2 };
  } else if (type === "cylinder") {
    const r = parseFloat(document.getElementById("cylinderRadius").value) || 0.5;
    const h = parseFloat(document.getElementById("cylinderHeight").value) || 1;
    geom = new THREE.CylinderGeometry(r, r, h, 32);
    dimensions = { width: r * 2, depth: r * 2, height: h };
  } else if (type === "cone") {
    const r = parseFloat(document.getElementById("coneRadius").value) || 0.5;
    const h = parseFloat(document.getElementById("coneHeight").value) || 1;
    geom = new THREE.ConeGeometry(r, h, 32);
    dimensions = { width: r * 2, depth: r * 2, height: h };
  }

  const mat = new THREE.MeshStandardMaterial({ color });
  const obj = new THREE.Mesh(geom, mat);
  obj.name = name;
  obj.castShadow = true; 
  obj.receiveShadow = true;
  obj.position.set(0, geom.parameters.height ? geom.parameters.height/2 : 0.5, 0);
  markModelObject(obj, type, dimensions.width, dimensions.depth, dimensions.height);
  clampToRoom(appState, obj.position);

  furniture.add(obj);
  appState.setSelected(obj);
  transformControls.attach(obj);
  transformControls.visible = true;
  appState.saveState('Create Custom Object');
}
