export const ASSETS = {
    models: {
        hand: './assets/hand.glb',
        room: './assets/room.glb',
        items: './assets/items.glb',
        sit2: './assets/sit2.glb',
        sit3: './assets/sit3.glb',
        sitwait: './assets/sitwait.glb',
        sleepsit: './assets/sleepsit.glb'
    }
};
 
export const CONFIG = {
    // Room
    roomScale: 1.0,
 
    // Chairs (procedural)
    chairCount: 4,
    chairSpacing: 2.5,
    chairSeatHeight: 0.9,
    chairZ: -3.0,
 
    // Hand
    handScale: 0.3,
    handStartX: 0,
      handStartY: 2.5,
    handStartZ: 6.0,
 
    // Hand speeds
    speedX: 4.0,
    speedY: 3.0,
    speedZ: 6.0,
    returnSpeed: 8.0,
 
    // Hand movement limits
    limitX: 3.0,
     limitYMin: 0.5,
    limitYMax: 3.5,
    limitZMin: -2.0,
 
    // Items
    itemsScale: 0.2
};
 
export const STATE = {
    LOADING: 'LOADING',
    READY: 'READY',
    PLAYING: 'PLAYING'
};
 
export const PHASE = {
    AIM_X: 'AIM_X',
    AIM_Y: 'AIM_Y',
     MOVE_Z: 'MOVE_Z',
    RETURN: 'RETURN'
};
