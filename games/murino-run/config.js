// murino-run/config.js

export const CONFIG = {
    // Game Physics & Mechanics
    GAME: {
        INITIAL_SPEED: 12,       // Starting forward speed
        MAX_SPEED: 35,           // Maximum speed to make it challenging
        ACCELERATION: 0.1,       // How fast speed increases over time
        GRAVITY: -40,            // Heavy gravity for snappy, responsive jumps
        JUMP_FORCE: 15,          // How high Mellstroy jumps
        LANE_WIDTH: 3,           // Distance between Left, Center, and Right lanes
        LANE_CHANGE_SPEED: 10    // How fast player snaps to another lane
    },

    // Camera Settings
    CAMERA: {
        FOV: 60,
        // Standard view (3rd person from behind)
        NORMAL: {
            OFFSET: { x: 0, y: 4, z: -7 },
            LOOK_AT: { x: 0, y: 2, z: 5 }
        },
        // First person view for the death sequence
        DEATH: {
            OFFSET: { x: 0, y: 1.8, z: 0.2 }, // Positioned roughly at the head
            TURN_SPEED: 1.5,                  // Speed of the "neck turning" effect
            LOOK_BACK_Z: -10                  // Target to look behind at the Fog
        }
    },

    // Paths to your pre-baked models and media
    ASSETS: {
        MODELS: {
            RUN: './assets/models/run.glb',
            JUMP: './assets/models/jump.glb',
            FALL: './assets/models/fall.glb',
            DANCE1: './assets/models/dance1.glb',
            DANCE2: './assets/models/dance2.glb',
            FOG: './assets/models/fog.glb',
            OBSTACLE_BLOCK: './assets/models/block.glb',
            OBSTACLE_HOLE: './assets/models/hole.glb'
        },
        MEDIA: {
            MEL_FACE_VIDEO: './assets/videos/mel.webm'
        }
    }
};
