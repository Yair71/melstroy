// ============================================================
// config.js — All game constants in one place
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

// Set to true to enable fly camera + coordinate debug
export const DEBUG = true;

export const CONFIG = {
    // Hand (thief arm)
    handScale: 0.3,
    handStartX:  1.8,
    handStartY: -0.5,
    handStartZ:  5.0,

    speedX: 4.0,
    speedY: 3.0,
    speedZ: 6.0,
    returnSpeed: 8.0,

    limitX:    4.0,
    limitYMin: -0.5,
    limitYMax:  3.5,
    limitZMin: -3.0,

    // Streamer (Mel) — will be adjusted after you find the chair
    streamerPosition: { x: 0, y: 0, z: 0 },
    streamerRotationY: Math.PI,

    // Items scale
    itemsScale: 0.15,

    // Grab radius
    grabRadius: 1.5,

    // Camera (non-debug)
    cameraPosition: { x: 0, y: 5, z: 10 },
    cameraLookAt:   { x: 0, y: 2, z: 0 },

    // Fly camera (debug)
    flySpeed:     8,
    flySpeedFast: 20
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
