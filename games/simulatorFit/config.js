// ============================================================
// config.js — Fat or Fit: all game constants (v4 - Easy Images)
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
    obesityMissLimit: 3,
    growthPerCatch: 0.025,

    // Fit mode
    fitStrikesMax: 3,
    shrinkPerHealthy: 0.015,
    growthPerJunk: 0.12,

    // Scoring
    junkPoints: 15,
    healthyPoints: 10,

    // Starting lanes
    baseLanes: 5,
    expandThreshold: 0.35,
    maxLanes: 20,
    maxPlayerScaleRatio: 0.45,

    // Shake limits
    maxShakeIntensity: 6,
    gameOverShakeIntensity: 3,
    gameOverShakeDuration: 0.25,

    // =========================================================
    // НАСТРОЙКИ КАРТИНОК
    // =========================================================
    // weight: Общий вес на экране в килограммах.
    // image: Название файла картинки в папке ./assets/
    // Ты можешь добавлять новые строчки или менять названия файлов.

    faceImagesObesity: [
        { weight: 50,  image: 'fitMax.png' },   
        { weight: 70,  image: 'fit1.png' },  
        { weight: 90, image: 'fit3.png' },  
        { weight: 130, image: 'fat1.png' },  
        { weight: 170, image: 'fat5.png' }, 
           { weight: 200, image: 'fat7.png' },
           { weight: 250, image: 'fatMax.png' }
    ],
    
    faceImagesFit: [
        { weight: 0,   image: 'fitMax.png' }, // Идеальная форма (когда похудел ниже 50 кг)
        { weight: 50,  image: 'fit1.png' },   // Спортивная форма (от 50 кг)
        { weight: 70,  image: 'fit3.png' },   // Начальный вес
        { weight: 90,  image: 'fat2.png' },   // Если растолстел от ошибок
        { weight: 110, image: 'fatMax.png' }  // Если поймал много фастфуда
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
