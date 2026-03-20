// games/stream-thief/config.js

export const ASSETS = {
  models: {
    hand: './assets/hand.glb',
    room: './assets/room.glb',
    items: './assets/items.glb',
    sit2: './assets/sit2.glb',
    sit3: './assets/sit3.glb',
    sitwait: './assets/sitwait.glb',
    sleepsit: './assets/sleepsit.glb'
  },
  textures: {},
  video: './assets/meme_caught.webm'
};

export const CONFIG = {
  // Масштабы (Вернули к нормальным значениям)
  roomScale: 1.0,        // Больше не раздуваем комнату!
  lootScale: 0.5,        
  handScale: 0.8,        // Нормальный размер руки
  
  streamerHeight: 4.0,   // Чуть уменьшили Мела, чтобы влезал
  seatHeight: 1.2,       // Высота сиденья от пола
  streamerZ: -1.0,       // Позиция стула и Мела

  // Рука (камера на Z: 6, рука на Z: 4 - прямо перед нами)
  handBaseX: 1.5,        
  handBaseY: 2.0,        
  handBaseZ: 4.0,        
};

export const STATE = {
  LOADING: 'LOADING',
  INTRO: 'INTRO',
  PLAYING: 'PLAYING',
  CAUGHT: 'CAUGHT'
};

export const STREAMER_STATE = {
  SLEEPING: 'SLEEPING',
  WARNING: 'WARNING',
  AWAKE: 'AWAKE'
};
