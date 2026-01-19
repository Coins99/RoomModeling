// Scene defaults
export const SCENE_BG_COLOR = 0xececec;
export const GRID_SIZE = 20;

// Room defaults
export const DEFAULT_ROOM = {
  width: 6,
  depth: 5,
  height: 3
};

export const ROOM_PADDING = 0.1;

// Colors
export const COLORS = {
  floor: 0x8b6b4b,
  wall: 0xf0f0f0,
  ceiling: 0xffffff,
  door: 0x6d4c41,
  window: 0x99caff,
  box: 0x8aa7f2,
  sphere: 0xf2a76b,
  chair: 0x8b4513,
  fixture: 0xffffff,
  bulb: 0xffffe0
};

export const TEXTURE_OPTIONS = {
  floor: ['#8b6b4b', '#d7ccc8', '#5d4037'],
  wall: ['#f0f0f0', '#e3f2fd', '#fff8e1']
};

// Materials
export const MATERIAL_DEFAULTS = {
  floor: { roughness: 0.8 },
  wall: { roughness: 0.95 },
  ceiling: { roughness: 0.9 }
};

// Physics / Bounds
export const BOUNDS = {
  minWidth: 2,
  maxWidth: 12,
  minDepth: 2,
  maxDepth: 12,
  minHeight: 2,
  maxHeight: 6,
  minY: 0.1,
  maxY: (height) => height - 0.1
};

// Camera
export const CAMERA_DEFAULTS = {
  fov: 60,
  near: 0.1,
  far: 1000,
  position: { x: 0, y: 1.6, z: 0 },
  lookAt: { x: 0, y: 1.5, z: 0 }
};

export const FPS_DEFAULTS = {
  sensitivity: 1.0,
  baseSpeed: 0.08,
  speedMultiplier: 1.0,
  movementDamping: 0.85,
  rotationLerp: 0.15,
  acceleration: 0.6,
  maxSpeed: (multiplier) => 2.0 * multiplier
};

export const ORBIT_DEFAULTS = {
  rotateSpeed: 1.0,
  panSpeed: 0.16,
  zoomSpeed: 1.0,
  minDistance: 1,
  maxDistance: 50,
  maxPolarAngle: Math.PI * 0.8
};

// UI
export const SNAP_DEFAULTS = {
  enabled: true,
  size: 0.25,
  minSize: 0.05,
  maxSize: 1.0,
  rotationSnap: 45
};

// History
export const HISTORY_DEFAULTS = {
  maxHistory: 50
};

// Furniture sizes
export const FURNITURE_SIZES = {
  box: { width: 1, height: 0.5, depth: 0.6 },
  sphere: { radius: 0.35 },
  chair: { width: 0.6, height: 0.5, depth: 0.6 }
};

// Room assets
export const ROOM_ASSETS = {
  door: {
    width: 1,
    height: 2,
    thickness: 0.08
  },
  window: {
    width: 1.6,
    height: 1,
    opacity: 0.45
  },
  fixture: {
    radius: 0.35,
    height: 0.1
  },
  bulb: {
    radius: 0.12,
    lightRange: (roomWidth, roomDepth) => Math.max(roomWidth, roomDepth) * 3
  }
};

// Lighting
export const LIGHTING = {
  hemisphere: {
    color: 0xffffff,
    groundColor: 0x444444,
    intensity: 0.6,
    position: { x: 0, y: 50, z: 0 }
  },
  directional: {
    color: 0xffffff,
    intensity: 0.8,
    position: { x: 5, y: 10, z: 7 },
    shadowMapSize: 1024,
    shadowNear: 0.5,
    shadowFar: 100
  },
  ambient: {
    color: 0xffffff,
    intensity: 0.3
  }
};

// Auto-save
export const AUTOSAVE_INTERVAL = 30000; // 30 seconds

// Animation
export const ANIMATION = {
  fpsRotationLerp: 0.15,
  fpsMovementDamping: 0.85,
  fpsAcceleration: 0.6
};
