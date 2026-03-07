// games/murino-run/config.js

export const CONFIG = {
    states: {
        LOADING: 0,
        INTRO: 1,      
        TRANSITION: 2, 
        PLAYING: 3,    
        DYING: 4,      
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
        creepyFogColor: 0x2a2a35, // Ночной сине-серый
        creepyAmbientLight: 0x888899, // Светлее, чтобы текстуры читались
        fogDensity: 0.006 // Туман отодвинут дальше, чтобы город было видно
    }
};
