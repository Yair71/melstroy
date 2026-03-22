// ============================================================
// config.js — All game constants
// ============================================================

export const ASSETS = {
    models: {
        hand:     './assets/hand.glb',
        room:     './assets/room.glb',
        items:    './assets/items.glb',
        sit2:     './assets/sit2.glb',
        sit3:     './assets/sit3.glb',
        sitwait:  './assets/sitwait.glb',
        sleepsit: './assets/sleepsit.glb'
    }
};

export const DEBUG = true;

export const CONFIG = {
    // ===== HAND =====
    handScale: 0.3,
    handStartX: -4.25,
    handStartY:  8.07,
    handStartZ: -25.31,

    speedX: 4.0,
    speedY: 3.0,
    speedZ: 6.0,
    returnSpeed: 8.0,

    limitXMin: -10.0,
    limitXMax:   2.0,
    limitYMin:   4.0,
    limitYMax:  12.0,
    limitZMin: -42.0,

    // ===== CAMERA (exact from your screenshot) =====
    cameraStartX: -4.79,
    cameraStartY: 12.18,
    cameraStartZ: -34.58,
    cameraYaw: 179.2,    // degrees
    cameraPitch: 0.0,

    // Non-debug gameplay camera
    cameraPosition: { x: -4.79, y: 12.18, z: -34.58 },
    cameraLookAt:   { x: -4.79, y: 8.0,   z: -44.0 },

    // ===== STREAMER (Mel) =====
    // Same approach as murino-run: modelHeight controls final size
    modelHeight: 4.5,    // Same as murino-run!
    streamerPosition: { x: -4.0, y: 0, z: -38.0 },

    // ===== ITEMS =====
    itemsScale: 0.8,
    grabRadius: 2.5,

    // ===== CHAIR =====
    chairSeatHeight: 2.2,
    chairScale: 2.0,

    // ===== FLY CAMERA =====
    flySpeed:     8,
    flySpeedFast: 20,

    // ===== FLOOR =====
    floorY: 0,
    floorSize: 200
};

export const STATE = {
    LOADING:  'LOADING',
    INTRO:    'INTRO',
    PLAYING:  'PLAYING'
};

export const PHASE = {
    AIM_X:  'AIM_X',
    AIM_Y:  'AIM_Y',
    MOVE_Z: 'MOVE_Z',
    RETURN: 'RETURN'
};
