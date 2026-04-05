// ============================================================
// config.js — Fat or Fit: all game constants (v6 - Bombs, Coins, -Kg fix)
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
    canvasWidth: 480,
    canvasHeight: 720,

    playerWidth: 85,
    playerHeight: 115,
    playerSpeed: 400,
    playerY: 640,

    itemSize: 48,
    
    // В ДВА РАЗА МЕНЬШЕ СПАВНА
    itemSpawnInterval: 1.8,   // Было 0.9
    minSpawnInterval: 0.8,    // Было 0.3
    itemFallSpeed: 140,
    maxFallSpeed: 450,
    speedIncreaseRate: 2.5,
    spawnDecreaseRate: 0.005,

    // Шансы появления редких предметов
    coinChance: 0.15, // 15% шанс на монету
    bombChance: 0.05, // 5% шанс на бомбу 

    // Obesity mode
    obesityMissLimit: 3,
    growthPerCatch: 0.025,   // +5 kg

    // Fit mode
    fitStrikesMax: 3,
    shrinkPerHealthy: 0.015, // -3 kg
    growthPerJunk: 0.025,    // +5 kg

    // Starting lanes (Добавлено +2 линии)
    baseLanes: 7,            
    expandThreshold: 0.35,
    maxLanes: 20,
    maxPlayerScaleRatio: 0.45,

    maxShakeIntensity: 6,
    gameOverShakeIntensity: 3,
    gameOverShakeDuration: 0.25,

    faceImagesObesity: [
        { weight: 50,  image: 'fitMax.png' },   
        { weight: 70,  image: 'fit1.png' },  
        { weight: 90,  image: 'fit3.png' },  
        { weight: 130, image: 'fat1.png' },  
        { weight: 170, image: 'fat5.png' }, 
        { weight: 200, image: 'fat7.png' },
        { weight: 250, image: 'fatMax.png' }
    ],
    
    faceImagesFit: [
        { weight: 50,  image: 'fitMax.png' }, // Тот самый минимальный вес 50 кг!
        { weight: 90,  image: 'fit1.png' },   
        { weight: 110, image: 'fit3.png' },   
        { weight: 130, image: 'fat1.png' },   
        { weight: 150, image: 'fat5.png' },   
        { weight: 170, image: 'fat7.png' },   
        { weight: 190, image: 'fatMax.png' }  
    ],

    baseWeightObesity: 70, 
    baseWeightFit: 150,    
    kgPerScale: 200        
};

export const FOODS = {
    healthy: [
        { emoji: '🥦', name: 'Broccoli' }, { emoji: '🥗', name: 'Salad' },
        { emoji: '🍎', name: 'Apple' }, { emoji: '🥕', name: 'Carrot' },
        { emoji: '🍌', name: 'Banana' }, { emoji: '🥑', name: 'Avocado' },
        { emoji: '🍇', name: 'Grapes' }, { emoji: '🥒', name: 'Cucumber' },
        { emoji: '🍊', name: 'Orange' }, { emoji: '🫐', name: 'Blueberry' },
        { emoji: '🍓', name: 'Strawberry' }, { emoji: '🥬', name: 'Lettuce' }
    ],
    junk: [
        { emoji: '🍔', name: 'Burger' }, { emoji: '🍕', name: 'Pizza' },
        { emoji: '🍟', name: 'Fries' }, { emoji: '🌭', name: 'Hotdog' },
        { emoji: '🍩', name: 'Donut' }, { emoji: '🍰', name: 'Cake' },
        { emoji: '🍫', name: 'Chocolate' }, { emoji: '🥤', name: 'Soda' },
        { emoji: '🧁', name: 'Cupcake' }, { emoji: '🍪', name: 'Cookie' },
        { emoji: '🍗', name: 'Drumstick' }, { emoji: '🌯', name: 'Burrito' }
    ]
};
