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
  // Настройки масштабов твоих моделек
  roomScale: 5.0,        // Увеличиваем комнату
  lootScale: 0.5,        // Уменьшаем лут
  handScale: 2.0,        // Размер руки
  
  streamerHeight: 4.5,   // Высота самого Мела
  seatHeight: 1.5,       // Высота сиденья стула от пола
  streamerZ: -1.0,       // Позиция стула и Мела (чуть отодвинул к столу)

  // Настройки Руки
  handExtendSpeed: 8.0,
  handRetractSpeed: 20.0,
  handBaseZ: 6.5,        // Рука стартует прям ПЕРЕД камерой (камера на Z:8)
  handBaseY: 3.5,        // Высота руки в кадре
};

export const STATE = {
  LOADING: 'LOADING',
  INTRO: 'INTRO',
  PLAYING: 'PLAYING',
  CAUGHT: 'CAUGHT'
};
