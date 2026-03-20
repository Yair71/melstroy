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
  video: './assets/meme_caught.webm' // Оставил видео на случай скримера
};

export const CONFIG = {
  // Настройки масштабов
  roomScale: 5.0,        
  lootScale: 0.5,        
  handScale: 0.5,        // СДЕЛАЛИ МЕНЬШЕ, чтобы не съедала камеру
  
  streamerHeight: 4.5,   
  seatHeight: 1.5,       
  streamerZ: -1.0,       

  // Настройки Руки (Сдвинули вправо и вниз, как в CS:GO)
  handExtendSpeed: 8.0,
  handRetractSpeed: 20.0,
  handBaseX: 2.0,        // Отступ вправо
  handBaseY: 2.5,        // Опустили ниже (камера на высоте 6)
  handBaseZ: 6.0,        // Чуть дальше от камеры (камера на Z: 8)
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
