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
    // Настройки комнаты и позиций
    roomScale: 5.0,
    seatHeight: 1.5,
    streamerZ: -2.0,
    
    // Настройки Руки
    handScale: 2.0,
    handStartX: 0,
    handStartY: 4,
    handStartZ: 8, // Стартует перед камерой
    
    // Скорости движения руки
    speedX: 8.0,
    speedY: 5.0,
    speedZ: 15.0,
    returnSpeed: 20.0,
    
    // Лимиты движения (чтобы рука не улетала за экран при выборе)
    limitX: 4.0,
    limitYMin: 2.0,
    limitYMax: 6.0
};

export const STATE = {
    LOADING: 'LOADING',
    PLAYING: 'PLAYING'
};

export const PHASE = {
    AIM_X: 'AIM_X',
    AIM_Y: 'AIM_Y',
    WAIT_Z: 'WAIT_Z',
    MOVE_Z: 'MOVE_Z',
    RETURN: 'RETURN'
};
