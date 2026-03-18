// games/stream-thief/config.js

export const ASSETS = {
    models: {
        hand: './assets/hand.glb',       // Моделька руки
        streamer: './assets/mel.glb',    // Моделька Мела (с анимациями сна и пробуждения)
        room: './assets/room.glb',       // Стол и фон
        loot: './assets/items.glb'       // Все предметы в одном файле или по отдельности
    },
    textures: {
        // Текстуры, если нужны отдельно
    },
    video: './assets/meme_caught.webm'   // Мемный видос на проигрыш
};

export const CONFIG = {
    // Настройки Руки (Вора)
    handExtendSpeed: 5.0,   // Скорость, с которой рука тянется к столу
    handRetractSpeed: 15.0, // Скорость возврата (очень быстрая, чтобы успеть спрятать)
    handBaseZ: 10,          // Стартовая позиция руки (спрятана за камерой)
    
    // Настройки Стримера
    streamer: {
        sleepMin: 2.0,      // Минимальное время глубокого сна (в секундах)
        sleepMax: 5.0,      // Максимальное время сна
        warningTime: 1.0,   // Сколько секунд ворочается (дает шанс убрать руку)
        awakeTime: 2.0      // Сколько секунд пялится на стол
    },

    // Лут на столе (zPos - как далеко тянуться)
    lootItems: [
        { id: 'coins', score: 50, zPos: 5 },
        { id: 'drink', score: 150, zPos: 3 },
        { id: 'phone', score: 500, zPos: 0 },
        { id: 'laptop', score: 2000, zPos: -3 }
    ]
};

export const STATE = {
    LOADING: 'LOADING',
    INTRO: 'INTRO',
    PLAYING: 'PLAYING',
    CAUGHT: 'CAUGHT',       // Замена DYING из murino-run
    WIN: 'WIN'              // Если украл всё
};

// Фазы стримера
export const STREAMER_STATE = {
    SLEEPING: 'SLEEPING',
    WARNING: 'WARNING',
    AWAKE: 'AWAKE'
};


