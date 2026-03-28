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
    // Canvas
    canvasWidth: 480,
    canvasHeight: 720,

    // Player
    playerWidth: 60,
    playerHeight: 80,
    playerSpeed: 400,
    playerY: 640,

    // Items
    itemSize: 40,
    itemSpawnInterval: 0.9,
    itemFallSpeed: 140,
    
    // Difficulty ramp
    speedIncreaseRate: 2.5,
    spawnDecreaseRate: 0.005,
    minSpawnInterval: 0.3,
    maxFallSpeed: 450,

    // Obesity mode
    obesityMissLimit: 8,
    growthPerCatch: 0.03,

    // Fit mode
    fitStrikesMax: 3,
    shrinkPerHealthy: 0.01,
    growthPerJunk: 0.12,

    // Scoring
    junkPoints: 15,
    healthyPoints: 10,

    // Lanes (items spawn in lanes, not random X)
    lanes: 5,

    // Shake limits
    maxShakeIntensity: 6,
    gameOverShakeIntensity: 3,
    gameOverShakeDuration: 0.25
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
