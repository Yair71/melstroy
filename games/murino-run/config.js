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
    gravity: -0.025,         // Ускорили падение (было -0.015)
    jumpPower: 0.35,         // Резкий прыжок вверх
    initialSpeed: 0.3,
    speedMultiplier: 0.0001,
    roadWidth: 12,
    roadLen: 120,
    roadCount: 6,
    playerYOffset: 0,
    
    // БАЗОВЫЙ КРУПНЫЙ РОСТ МЕЛСТРОЯ
    modelScale: 0.2,         

    // РУЧНОЙ МНОЖИТЕЛЬ РАЗМЕРА ДЛЯ КРИВЫХ МОДЕЛЕЙ ИЗ БЛЕНДЕРА
    animScales: {
        run: 1.0,
        jump: 3.0,           // Оставил твои настройки
        fall: 3.0,
        dance1: 2.0,
        dance2: 2.0
    }
};

export const STATE = {
    LOADING: 'LOADING',
    INTRO: 'INTRO',
    TRANSITION: 'TRANSITION',
    PLAYING: 'PLAYING',
    DYING: 'DYING'
};
