// games/murino-run/config.js

export const CONFIG = {
    states: {
        LOADING: 0,
        INTRO: 1,      // Танцы перед стартом
        TRANSITION: 2, // Проигрывание mel.webm на лице
        PLAYING: 3,    // Раннер
        DYING: 4,      // Падение и поворот камеры к Фогу
        GAMEOVER: 5
    },
    assets: {
        models: {
            player: './assets/mel.glb',
            run: './assets/running.glb',
            jump: './assets/jump.glb',
            fall: './assets/fall.glb',
            dance1: './assets/dance.glb',
            dance2: './assets/dance2.glb'
        },
        textures: {
            fog: './assets/fog.png',
            roads: ['./assets/road1.png', './assets/road2.png', './assets/road3.png'],
            buildings: ['./assets/building4.png', './assets/building5.png']
        },
        video: './assets/mel.webm'
    },
    physics: {
        baseSpeed: 0.3,
        speedMultiplier: 0.0001,
        gravity: -0.015,
        jumpPower: 0.3,
        lanes: [-3, 0, 3],
        playerYOffset: 0
    },
    world: {
        creepyFogColor: 0x111111, // Мрачная атмосфера Мурино
        creepyAmbientLight: 0x444455
    }
};
