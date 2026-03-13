// --- ASSET PATHS ---
export const ASSETS = {
    models: {
        run: './assets/run.glb',
        jump: './assets/jump.glb',
        fall: './assets/fall.glb',
        dance1: './assets/dance1.glb',
        dance2: './assets/dance2.glb'
    },
    textures: {
        fog: './assets/fog.png',
        roads: [
            './assets/road1.png', 
            './assets/road2.png', 
            './assets/road3.png'
        ],
        buildings: [
            './assets/building4.png', 
            './assets/building5.png'
        ]
    },
    video: './assets/mel.webm'
};

// --- GAME PHYSICS & SETTINGS ---
export const CONFIG = {
    lanes: [-3, 0, 3],       // Left, Center, Right X positions
    gravity: -0.015,         // Pulls player down during jump
    jumpPower: 0.3,          // Initial upward velocity
    initialSpeed: 0.3,       // Starting forward speed
    speedMultiplier: 0.0001, // How much speed increases per frame
    roadWidth: 12,
    roadLen: 120,
    roadCount: 6,
    playerYOffset: 0         // Base Y position for the player model
};

// --- GAME STATES ---
export const STATE = {
    LOADING: 'LOADING',
    INTRO: 'INTRO',           // Dancing, waiting for click
    TRANSITION: 'TRANSITION', // Video playing
    PLAYING: 'PLAYING',       // Running
    DYING: 'DYING'            // Fall animation, fog eating
};
