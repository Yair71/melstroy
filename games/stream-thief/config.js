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
    // Room - matches Blender scene
    roomScale: 1.0,
    roomPosition: { x: 0, y: 0, z: 0 },

    // Streamer sits at the desk (ONE position, anims swap in place)
    // From Blender: the character (Armature) sits at the desk facing the monitor
    streamerPosition: { x: 0, y: 0, z: -2 },
    streamerRotationY: Math.PI, // Facing away from camera (toward monitor)

    // Hand - near camera, bottom-right like in Blender screenshot
    // Blender pos: X:5.77, Y:0.44, Z:4.37 (relative to scene)
    // In game coords: hand is close to camera, offset to the right and low
    handScale: 0.3,
    handStartX: 1.8,
    handStartY: -0.5,
    handStartZ: 5.0,

    // Hand speeds
    speedX: 4.0,
    speedY: 3.0,
    speedZ: 6.0,
    returnSpeed: 8.0,

    // Hand movement limits - can reach across the room
    limitX: 4.0,
    limitYMin: -0.5,
    limitYMax: 3.5,
    limitZMin: -3.0,

    // Loot scatter positions (bed, table, floor, shelves)
    // These match the Blender room layout
    lootPositions: [
        // On the bed (left side of room)
        { x: -2.5, y: 1.2, z: -1.0 },
        { x: -1.8, y: 1.2, z: -0.5 },
        { x: -3.0, y: 1.3, z: -1.5 },
        // On the desk (right side, near monitor)
        { x: 1.5, y: 1.6, z: -2.5 },
        { x: 2.5, y: 1.6, z: -2.0 },
        // On the floor
        { x: 0.0, y: 0.1, z: 0.0 },
        { x: -1.0, y: 0.1, z: 1.0 },
        { x: 1.5, y: 0.1, z: -0.5 },
        // On shelves (upper left)
        { x: -3.5, y: 2.8, z: -2.5 },
        { x: -3.5, y: 3.5, z: -2.5 },
        { x: -3.5, y: 2.0, z: -2.0 },
        // Near the CPU casing / desk area
        { x: 2.0, y: 0.8, z: -3.0 },
    ],

    // Items scale for scattered loot
    itemsScale: 0.15,

    // Camera matches Blender camera perspective
    cameraPosition: { x: 0, y: 5.5, z: 7.0 },
    cameraLookAt: { x: 0, y: 1.5, z: -2 }
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
