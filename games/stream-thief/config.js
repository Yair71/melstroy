// games/stream-thief/config.js

export const CONFIG = {
    canvasWidth: 800,
    canvasHeight: 600,
    
    // Hand movement speeds (progress per frame)
    handExtendSpeed: 0.8, 
    handRetractSpeed: 2.5, // Retracts faster than extending
    
    // Loot list: from cheapest to most expensive
    loot: [
        { id: "coins", name: "Мелочь (Coins)", score: 50, requiredProgress: 100 },
        { id: "energy_drink", name: "Энергетик (Energy Drink)", score: 150, requiredProgress: 120 },
        { id: "watch", name: "Часы (Rolex)", score: 500, requiredProgress: 150 },
        { id: "phone", name: "Телефон (Phone)", score: 1000, requiredProgress: 180 },
        { id: "laptop", name: "Ноутбук (MacBook)", score: 5000, requiredProgress: 250 },
        { id: "crypto_wallet", name: "Криптокошелек (Ledger)", score: 20000, requiredProgress: 350 }
    ],
    
    // Streamer AI timings (in frames, assuming ~60fps)
    streamer: {
        sleepMin: 120, // Min time sleeping
        sleepMax: 300, // Max time sleeping
        warningTime: 40, // How long he tosses and turns before opening eyes
        awakeMin: 60,
        awakeMax: 120
    },
    
    // WebM Meme Events (Instant wake up)
    events: {
        chancePerFrame: 0.0015, // Low chance per frame to trigger instant event
        types: [
            { id: "DONATE", videoUrl: "assets/webm/donate.webm" },
            { id: "PHONE_RING", videoUrl: "assets/webm/phone.webm" },
            { id: "CAT_JUMP", videoUrl: "assets/webm/cat.webm" }
        ]
    }
};
