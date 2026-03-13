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
    jumpPower: 0.21,         // <-- ПРЫЖОК СТАЛ НИЖЕ (ровно под один блок)
    initialSpeed: 0.3,
    speedMultiplier: 0.0001,
    roadWidth: 12,
    roadLen: 120,
    roadCount: 6,
    playerYOffset: 0,
    modelScale: 0.045,       // <-- ЖЕСТКО ФИКСИРОВАННЫЙ РАЗМЕР ДЛЯ ВСЕХ
    
    // --- РУЧНАЯ НАСТРОЙКА ВЫСОТЫ (Лифт для кривых анимаций из Blender) ---
    // Если анимация уходит под асфальт, просто увеличь тут цифру!
    animOffsets: {
        run: 0,
        jump: 0.5,           // Приподнимаем прыжок
        fall: 1.5,           // Сильно приподнимаем падение, чтобы лежал на дороге
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
