// ============================================================
// config.js — All game constants
// ============================================================

export const ASSETS = {
    models: {
        hand:     './assets/hand.glb',
        room:     './assets/room.glb',
        items:    './assets/items.glb',
        chair:    './assets/chair.glb',
        sit2:     './assets/sit2.glb',
        sit3:     './assets/sit3.glb',
        sitwait:  './assets/sitwait.glb',
        sleepsit: './assets/sleepsit.glb'
    }
};

// ===== DEBUG OFF — fly camera removed =====
export const DEBUG = false;

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

    // ===== CAMERA (exact from your fly camera screenshot) =====
    cameraPosition: { x: -4.79, y: 12.18, z: -34.58 },
    cameraYaw: 179.2,      // degrees — looking in +Z direction
    cameraPitch: 0.0,      // degrees

    // ===== STREAMER (Mel) =====
    modelHeight: 4.5,
    streamerPosition: { x: -4.0, y: 0, z: -38.0 },

    // ===== ITEMS =====
    itemScale: 0.8,
    grabRadius: 2.5,

    // ===== CHAIR =====
    chairScale: 2.0,
    chairSeatHeight: 2.2,

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
