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
        roads: ['./assets/road1.png', './assets/road2.png', './assets/road3.png'],
        buildings: ['./assets/building4.png', './assets/building5.png']
    },
    video: './assets/mel.webm'
};

export const CONFIG = {
    lanes: [-3, 0, 3],
    gravity: -0.015,
    jumpPower: 0.29,         // Ровно для перепрыгивания 1 блока
    initialSpeed: 0.3,
    speedMultiplier: 0.0001,
    roadWidth: 12,
    roadLen: 120,
    roadCount: 6,
    playerYOffset: 0,
    
    // --- БАЗОВЫЙ КРУПНЫЙ РОСТ МЕЛСТРОЯ ---
    modelScale: 0.1,         

    // --- РУЧНОЙ МНОЖИТЕЛЬ РАЗМЕРА ДЛЯ КРИВЫХ МОДЕЛЕЙ ---
    animScales: {
        run: 1.0,
        jump: 3.0,           // ЕСЛИ ПРЫЖОК МЕЛКИЙ - СТАВЬ 1.5 ИЛИ 2.0 !
        fall: 3.0,
        dance1: 2.0,
        dance2: 2.0
    },
    
    // --- РУЧНАЯ ВЫСОТА ОТ АСФАЛЬТА (Лифт) ---
    animOffsets: {
        run: 0,
        jump: 0.5,           // Чтобы при прыжке не уходил под землю
        fall: 1.5,           // Чтобы лежал ровно на асфальте
        dance1: 0,
        dance2: 0
    }
};

export const STATE = {
    LOADING: 'LOADING',
    INTRO: 'INTRO',
    TRANSITION: 'TRANSITION',
    PLAYING: 'PLAYING',
    DYING: 'DYING'
};
