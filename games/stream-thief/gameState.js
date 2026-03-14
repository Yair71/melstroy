// games/stream-thief/gameState.js

export const STATE = {
    MENU: 0,
    PLAYING: 1,
    CAUGHT: 2, // Streamer woke up and caught the hand
    PHASE2: 3  // Stole everything! Player becomes the streamer
};

export const STREAMER_STATE = {
    SLEEPING: 0,
    WARNING: 1, // Tossing and turning (player still has a chance to hide)
    AWAKE: 2    // Eyes open! If handProgress > 0, player is caught
};

export const gameState = {
    current: STATE.MENU,
    score: 0,
    
    // Player (Thief) state
    isHolding: false,
    handProgress: 0, // 0 = fully hidden, MAX = touching loot
    currentLootIndex: 0,
    isReturningWithLoot: false, // True when auto-retracting after grabbing
    
    // Streamer state
    streamerState: STREAMER_STATE.SLEEPING,
    streamerTimer: 0,
    activeEvent: null, // Stores active meme event
    
    reset() {
        this.current = STATE.PLAYING;
        this.score = 0;
        this.isHolding = false;
        this.handProgress = 0;
        this.currentLootIndex = 0;
        this.isReturningWithLoot = false;
        this.streamerState = STREAMER_STATE.SLEEPING;
        this.streamerTimer = 150; // Initial sleep time
        this.activeEvent = null;
    }
};
