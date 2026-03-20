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
  // МАСТШТАБЫ (Сильно уменьшили)
  roomScale: 0.3,        // Комната теперь компактная
  lootScale: 0.5,        
  handScale: 0.25,       // Рука теперь нормального размера
  
  // НАСТРОЙКИ МЕЛА (Жесткие, чтобы не прыгал)
  streamerScale: 2.5,    // Фиксированный размер Мела
  streamerY: 0.0,        // Смещение Мела вверх/вниз (подкрути, если висит в воздухе)
  seatHeight: 1.0,       // Высота сиденья кресла
  streamerZ: -1.0,       // Позиция кресла

  // НАСТРОЙКИ РУКИ И КРАЖИ
  handExtendSpeed: 10.0, // Скорость движения руки к столу
  handRetractSpeed: 20.0,// Скорость возврата руки
  handBaseX: 1.2,        // Сдвиг руки вправо
  handBaseY: 1.5,        // Опустили руку ниже
  handBaseZ: 5.5,        // Позиция руки возле камеры
  tableZ: -2.5           // Позиция лута на столе (куда тянется рука)
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
