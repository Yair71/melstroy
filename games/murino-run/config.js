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

  // НОВАЯ ФИЗИКА ПРЫЖКА: Точный контроль высоты и времени
  jumpHeight: 1.4,     // Максимальная высота прыжка (Y)
  jumpDuration: 0.55,  // За сколько секунд персонаж сделает весь прыжок (вверх и вниз)

  // Game speed
  initialSpeed: 0.3,
  speedMultiplier: 0.0001,

  // World
  roadWidth: 12,
  roadLen: 120,
  roadCount: 6,

  // Player
  playerYOffset: 0,
  modelHeight: 4.5,

  // Collision tuning
  smallBlockClearHeight: 1.05
};

export const STATE = {
  LOADING: 'LOADING',
  INTRO: 'INTRO',
  TRANSITION: 'TRANSITION',
  PLAYING: 'PLAYING',
  DYING: 'DYING'
};
