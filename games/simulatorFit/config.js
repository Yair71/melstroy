// ============================================================
// config.js — Fat or Fit: all game constants (v3)
// ============================================================

export const STATE = {
    LOADING:  'LOADING',
    MENU:     'MENU',
    PLAYING:  'PLAYING',
    GAMEOVER: 'GAMEOVER'
};

export const MODE = {
    OBESITY: 'OBESITY',
    FIT:     'FIT'
};

export const CONFIG = {
    // Canvas (logical — will be scaled by dynamic zoom)
    canvasWidth: 480,
    canvasHeight: 720,

    // Player
    playerWidth: 60,
    playerHeight: 80,
    playerSpeed: 400,
    playerY: 640,

    // Items
    itemSize: 36,
    itemSpawnInterval: 0.9,
    itemFallSpeed: 140,
    
    // Difficulty ramp
    speedIncreaseRate: 2.5,
    spawnDecreaseRate: 0.005,
    minSpawnInterval: 0.3,
    maxFallSpeed: 450,

    // Obesity mode
    obesityMissLimit: 8,
    growthPerCatch: 0.025,

    // Fit mode
    fitStrikesMax: 3,
    shrinkPerHealthy: 0.015,    // ← stronger shrink
    growthPerJunk: 0.12,

    // Scoring
    junkPoints: 15,
    healthyPoints: 10,

    // Starting lanes
    baseLanes: 5,

    // Dynamic scaling: when player width > this fraction of play area, expand
    expandThreshold: 0.35,   // player wider than 35% of field → expand
    maxLanes: 20,            // absolute max lanes
    maxPlayerScaleRatio: 0.45, // player never wider than 45% of current field

    // Shake limits
    maxShakeIntensity: 6,
    gameOverShakeIntensity: 3,
    gameOverShakeDuration: 0.25,

    // Face images (relative to game folder ./assets/)
    faceImagesObesity: [
        { minKg: 0,   src: './assets/fat1.png' },
        { minKg: 20,  src: './assets/fat2.png' },
        { minKg: 40,  src: './assets/fat5.png' },
        { minKg: 60,  src: './assets/fat7.png' },
        { minKg: 100, src: './assets/fatMax.png' }
    ],
    faceImagesFit: [
        { minKg: 0,   src: './assets/fit1.png' },
        { minKg: 20,  src: './assets/fit3.png' },
        { minKg: 60,  src: './assets/fitMax.png' }
    ],

    // Weight calc
    baseWeight: 70,        // kg at scale 1.0
    kgPerScale: 200        // kg gained per 1.0 scale increase
};

// Food items database
export const FOODS = {
    healthy: [
        { emoji: '🥦', name: 'Broccoli' },
        { emoji: '🥗', name: 'Salad' },
        { emoji: '🍎', name: 'Apple' },
        { emoji: '🥕', name: 'Carrot' },
        { emoji: '🍌', name: 'Banana' },
        { emoji: '🥑', name: 'Avocado' },
        { emoji: '🍇', name: 'Grapes' },
        { emoji: '🥒', name: 'Cucumber' },
        { emoji: '🍊', name: 'Orange' },
        { emoji: '🫐', name: 'Blueberry' },
        { emoji: '🍓', name: 'Strawberry' },
        { emoji: '🥬', name: 'Lettuce' }
    ],
    junk: [
        { emoji: '🍔', name: 'Burger' },
        { emoji: '🍕', name: 'Pizza' },
        { emoji: '🍟', name: 'Fries' },
        { emoji: '🌭', name: 'Hotdog' },
        { emoji: '🍩', name: 'Donut' },
        { emoji: '🍰', name: 'Cake' },
        { emoji: '🍫', name: 'Chocolate' },
        { emoji: '🥤', name: 'Soda' },
        { emoji: '🧁', name: 'Cupcake' },
        { emoji: '🍪', name: 'Cookie' },
        { emoji: '🍗', name: 'Drumstick' },
        { emoji: '🌯', name: 'Burrito' }
    ]
};
