// ============================================================
// config.js — Fat or Fit: all game constants
// ============================================================

export const STATE = {
    LOADING:  'LOADING',
    MENU:     'MENU',       // Choose mode
    PLAYING:  'PLAYING',
    GAMEOVER: 'GAMEOVER'
};

export const MODE = {
    OBESITY: 'OBESITY',     // Catch everything, grow huge
    FIT:     'FIT'          // Dodge junk, catch healthy only
};

export const CONFIG = {
    // Canvas
    canvasWidth: 480,
    canvasHeight: 720,

    // Player
    playerWidth: 60,
    playerHeight: 80,
    playerSpeed: 320,
    playerY: 640,           // Bottom area

    // Items
    itemSize: 40,
    itemSpawnInterval: 0.8, // seconds (initial)
    itemFallSpeed: 180,     // pixels/sec (initial)
    
    // Difficulty ramp
    speedIncreaseRate: 3,     // px/sec added per second of play
    spawnDecreaseRate: 0.008, // seconds removed from interval per second
    minSpawnInterval: 0.25,
    maxFallSpeed: 600,

    // Obesity mode
    obesityMissLimit: 5,      // miss 5 items = game over
    growthPerCatch: 0.04,     // scale increase per catch

    // Fit mode
    fitStrikesMax: 3,         // catch 3 junk items = game over
    shrinkPerHealthy: 0.01,   // slight shrink per healthy catch
    growthPerJunk: 0.15,      // big growth per junk caught

    // Scoring
    junkPoints: 15,
    healthyPoints: 10,

    // Visual
    bgColor: '#0a0a14',
    floorColor: '#1a1a2e',
    
    // Columns (lanes)
    lanes: 5
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
