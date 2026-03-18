

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
  handExtendSpeed: 8.0,
  handRetractSpeed: 20.0,
  handBaseZ: 8,       
  
  streamerHeight: 4.5, 
  streamerY: 1.5,     
  streamerZ: 2.0       
};

export const STATE = {
  LOADING: 'LOADING',
  INTRO: 'INTRO',
  PLAYING: 'PLAYING',
  CAUGHT: 'CAUGHT'
};
