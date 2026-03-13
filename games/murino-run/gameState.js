// murino-run/gameState.js

export const STATES = {
    LOADING: 'LOADING',
    INTRO: 'INTRO',         // Mellstroy is dancing, waiting for user to press Play
    PLAYING: 'PLAYING',     // Running, dodging, earning cash
    DYING: 'DYING',         // Hit an obstacle, camera turns, Fog approaches
    GAME_OVER: 'GAME_OVER'  // Eaten by Fog, UI shows restart button
};

class GameState {
    constructor() {
        this.current = STATES.LOADING;
        this.score = 0;
        this.coins = 0;
        this.speedMultiplier = 1;
        this.listeners = [];
    }

    set(newState) {
        if (this.current === newState) return;
        this.current = newState;
        this.notify();
    }

    addScore(amount) {
        if (this.current !== STATES.PLAYING) return;
        this.score += amount;
        this.notify();
    }

    addCoin() {
        if (this.current !== STATES.PLAYING) return;
        this.coins += 1;
        this.notify();
    }

    reset() {
        this.score = 0;
        // We do not reset coins here if they belong to global hub inventory,
        // but for run-specific display we can reset them or keep track separately.
        this.runCoins = 0; 
        this.speedMultiplier = 1;
        this.set(STATES.INTRO);
    }

    // Subscribe to state changes (UI will use this to update Cash/Score on screen)
    subscribe(callback) {
        this.listeners.push(callback);
    }

    notify() {
        this.listeners.forEach(listener => {
            listener({
                state: this.current,
                score: Math.floor(this.score),
                coins: this.coins
            });
        });
    }
}

// Export a single instance to be shared across the game files
export const gameState = new GameState();
