export const ASSETS = {
    models: {
        hand: './assets/hand.glb',
        room: './assets/room.glb',
        items: './assets/items.glb',
        sit2: './assets/sit2.glb',
        sit3: './assets/sit3.glb',
        sitwait: './assets/sitwait.glb',
        sleepsit: './assets/sleepsit.glb'
    }
};

export const CONFIG = {
    debug: true,

    roomScale: 1.0,
    roomPosition: { x: 0, y: 0, z: 0 },

    streamerPosition: { x: 0, y: 0, z: 0 },
    streamerRotationY: Math.PI,

    handScale: 0.3,
    handStartX: 1.8,
    handStartY: -0.5,
    handStartZ: 5.0,

    speedX: 4.0,
    speedY: 3.0,
    speedZ: 6.0,
    returnSpeed: 8.0,

    limitX: 4.0,
    limitYMin: -0.5,
    limitYMax: 3.5,
    limitZMin: -3.0,

    lootPositions: [
        { x: -2.5, y: 1.2, z: -1.0 },
        { x: -1.8, y: 1.2, z: -0.5 },
        { x: -3.0, y: 1.3, z: -1.5 },
        { x: 1.5, y: 1.6, z: -2.5 },
        { x: 2.5, y: 1.6, z: -2.0 },
        { x: 0.0, y: 0.1, z: 0.0 },
        { x: -1.0, y: 0.1, z: 1.0 },
        { x: 1.5, y: 0.1, z: -0.5 },
        { x: -3.5, y: 2.8, z: -2.5 },
        { x: -3.5, y: 3.5, z: -2.5 },
        { x: -3.5, y: 2.0, z: -2.0 },
        { x: 2.0, y: 0.8, z: -3.0 },
    ],

    itemsScale: 0.15,

    cameraPosition: { x: 0, y: 5, z: 10 },
    cameraLookAt: { x: 0, y: 2, z: 0 }
};

export const STATE = {
    LOADING: 'LOADING',
    READY: 'READY',
    PLAYING: 'PLAYING'
};

export const PHASE = {
    AIM_X: 'AIM_X',
    AIM_Y: 'AIM_Y',
    MOVE_Z: 'MOVE_Z',
    RETURN: 'RETURN'
};
