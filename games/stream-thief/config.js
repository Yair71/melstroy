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
    // Уменьшаем комнату (было 5.0, ставим 1.0 или даже меньше, если она все еще огромная)
    roomScale: 1.0, 
    seatHeight: 1.0,  // Опустили стул
    streamerZ: -2.5,  // Отодвинули Мела чуть дальше за стол
    
    // Радикально уменьшаем руку
    handScale: 0.3,   // Было 2.0, теперь она будет нормального размера
    handStartX: 0,
    handStartY: 2.5,  // Рука стартует на уровне груди/глаз
    handStartZ: 5.0,  // Отодвигаем руку от камеры вперед
    
    // Скорости движения руки
    speedX: 8.0,
    speedY: 5.0,
    speedZ: 15.0,
    returnSpeed: 20.0,
    
    // Лимиты движения
    limitX: 3.0,
    limitYMin: 1.0,
    limitYMax: 4.0
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
