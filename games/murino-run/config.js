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
    jumpPower: 0.26,         // <-- ПРЫЖОК СТАЛ ВЫШЕ (теперь легко перепрыгнет блок!)
    initialSpeed: 0.3,
    speedMultiplier: 0.0001,
    roadWidth: 12,
    roadLen: 120,
    roadCount: 6,
    playerYOffset: 0,
    
    // БАЗОВЫЙ РАЗМЕР (меняй его, чтобы сделать Мела больше или меньше в целом)
    baseScale: 0.08,         

    // --- РУЧНОЙ МАСШТАБ ДЛЯ КАЖДОЙ АНИМАЦИИ ---
    // Если какая-то модель из Блендера огромная (как прыжок), уменьшаем её тут!
    animScales: {
        run: 1.0,
        jump: 0.2,           // <-- ПРЫЖОК БЫЛ В 5 РАЗ БОЛЬШЕ? МЫ УМЕНЬШИЛИ ЕГО ТУТ!
        fall: 1.0,
        dance1: 1.0,
        dance2: 1.0
    },
    
    // --- РУЧНАЯ ВЫСОТА ОТ АСФАЛЬТА ---
    animOffsets: {
        run: 0,
        jump: 0.5,
        fall: 1.5,
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
