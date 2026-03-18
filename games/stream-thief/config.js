// games/stream-thief/config.js

export const ASSETS = {
  models: {
    hand: './assets/hand.glb',
    room: './assets/room.glb',
    items: './assets/items.glb',
    // Твои сидячие модельки из скриншота:
    sit2: './assets/sit2.glb',
    sit3: './assets/sit3.glb',
    sitwait: './assets/sitwait.glb',
    sleepsit: './assets/sleepsit.glb'
  },
  textures: {},
  video: './assets/meme_caught.webm'
};

export const CONFIG = {
  handExtendSpeed: 8.0,
  handRetractSpeed: 20.0,
  handBaseZ: 8,       // Рука стартует за камерой
  
  streamerHeight: 4.5, // Желаемый размер Мела
  streamerY: 1.5,      // Высота, чтобы попа ровно сидела на стуле (подгонишь под свой room.glb)
  streamerZ: 2.0       // Позиция Мела (между камерой и столом)
};

export const STATE = {
  LOADING: 'LOADING',
  INTRO: 'INTRO',
  PLAYING: 'PLAYING',
  CAUGHT: 'CAUGHT'
};
