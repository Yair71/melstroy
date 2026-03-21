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
    // ===== HAND (thief arm) =====
    // Spawn exactly at your saved coordinates
    handScale: 0.3,
    handStartX: -4.25,
    handStartY:  8.07,
    handStartZ: -25.31,

    // Movement speeds
    speedX: 4.0,
    speedY: 3.0,
    speedZ: 6.0,
    returnSpeed: 8.0,

    // Movement limits (room-space coordinates)
    limitXMin: -10.0,
    limitXMax:   2.0,
    limitYMin:   4.0,
    limitYMax:  12.0,
    limitZMin: -42.0,   // how far forward (toward table)

    // ===== STREAMER (Mel) — near the table =====
    streamerPosition: { x: -4.0, y: 0, z: -32.0 },
    streamerRotationY: 0,

    // ===== ITEMS (loot on table) =====
    itemsScale: 0.8,   // MUCH bigger (was 0.15)

    // Grab radius
    grabRadius: 2.5,

    // ===== CAMERA (non-debug gameplay) =====
    // Behind the hand, higher, looking toward table
    cameraPosition: { x: -4.25, y: 12.0, z: -20.0 },
    cameraLookAt:   { x: -4.25, y: 6.0,  z: -35.0 },

    // ===== CHAIR =====
    chairSeatHeight: 2.5,
    chairScale: 1.8,

    // ===== FLY CAMERA (debug) =====
    flySpeed:     8,
    flySpeedFast: 20,

    // ===== FLOOR =====
    floorY: 0,
    floorSize: 100
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
