// games/murino-run/gameState.js
import { CONFIG } from './config.js';

class GameState {
    constructor() {
        this.current = CONFIG.states.LOADING;
        this.score = 0;
        this.coins = 0;
        this.speed = CONFIG.physics.baseSpeed;
    }

    set(newState) {
        this.current = newState;
        console.log(`[GameState] Changed to: ${Object.keys(CONFIG.states).find(k => CONFIG.states[k] === newState)}`);
    }

    is(state) {
        return this.current === state;
    }

    reset() {
        this.current = CONFIG.states.INTRO;
        this.score = 0;
        this.coins = 0;
        this.speed = CONFIG.physics.baseSpeed;
    }
}

export const state = new GameState();
