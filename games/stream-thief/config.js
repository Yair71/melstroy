// games/stream-thief/config.js
export const ASSETS = {
  models: {
    hand: './assets/hand.glb',
    sleepsit: './assets/sleepsit.glb',
    sitwait: './assets/sitwait.glb',
    sit2: './assets/sit2.glb',
    sit3: './assets/sit3.glb',
    room: './assets/room.glb',
    loot: './assets/items.glb'
  },
  textures: {},
  video: './assets/meme_caught.webm'
};

export const CONFIG = {
  handExtendSpeed: 5.0,
  handRetractSpeed: 15.0,
  handBaseZ: 10,
  streamer: {
    sleepMin: 2.0,
    sleepMax: 5.0,
    warningTime: 1.0,
    awakeTime: 2.0
  },
  lootItems: [
    { id: 'coins', score: 50, zPos: 5 },
    { id: 'drink', score: 150, zPos: 3 },
    { id: 'phone', score: 500, zPos: 0 },
    { id: 'laptop', score: 2000, zPos: -3 }
  ],
  streamerYOffset: 1.8,  // НОВОЕ: Высота сиденья, чтобы Мел сидел ровно
  streamerHeight: 4.5    // НОВОЕ: Желаемая высота модельки Мела
};

export const STATE = {
  LOADING: 'LOADING',
  INTRO: 'INTRO',
  PLAYING: 'PLAYING',
  CAUGHT: 'CAUGHT',
  WIN: 'WIN'
};

export const STREAMER_STATE = {
  SLEEPING: 'SLEEPING',
  WARNING: 'WARNING',
  AWAKE: 'AWAKE'
};
