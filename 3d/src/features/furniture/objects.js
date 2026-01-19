import * as CONST from '../../core/constants.js';
import { clampToRoom } from '../room/room.js';

export function addBox(appState) {
  const { THREE, furniture, transformControls } = appState;
  const sizes = CONST.FURNITURE_SIZES.box;
  
  const geom = new THREE.BoxGeometry(sizes.width, sizes.height, sizes.depth);
  const mat = new THREE.MeshStandardMaterial({color: CONST.COLORS.box});
  const m = new THREE.Mesh(geom, mat);
  m.name = 'Box ' + (furniture.children.length + 1);
  m.castShadow = true;
  m.receiveShadow = true;
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
  
  const name = document.getElementById("objName").value || "Custom Object";
  const type = document.getElementById("objType").value;
  const color = document.getElementById("objColor").value;

  let geom;
  if (type === "box") {
    const w = parseFloat(document.getElementById("boxW").value) || 1;
    const h = parseFloat(document.getElementById("boxH").value) || 1;
    const d = parseFloat(document.getElementById("boxD").value) || 1;
    geom = new THREE.BoxGeometry(w, h, d);
  } else if (type === "sphere") {
    const r = parseFloat(document.getElementById("sphereR").value) || 0.5;
    geom = new THREE.SphereGeometry(r, 32, 16);
  } else if (type === "cylinder") {
    const r = parseFloat(document.getElementById("cylR").value) || 0.5;
    const h = parseFloat(document.getElementById("cylH").value) || 1;
    geom = new THREE.CylinderGeometry(r, r, h, 32);
  } else if (type === "cone") {
    const r = parseFloat(document.getElementById("coneR").value) || 0.5;
    const h = parseFloat(document.getElementById("coneH").value) || 1;
    geom = new THREE.ConeGeometry(r, h, 32);
  }

  const mat = new THREE.MeshStandardMaterial({ color });
  const obj = new THREE.Mesh(geom, mat);
  obj.name = name;
  obj.castShadow = true; 
  obj.receiveShadow = true;
  obj.position.set(0, geom.parameters.height ? geom.parameters.height/2 : 0.5, 0);
  clampToRoom(appState, obj.position);

  furniture.add(obj);
  appState.setSelected(obj);
  transformControls.attach(obj);
  transformControls.visible = true;
  appState.saveState('Create Custom Object');
}
