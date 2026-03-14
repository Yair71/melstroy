// games/stream-thief/events.js
import { gameState, STATE, STREAMER_STATE } from './gameState.js';
import { CONFIG } from './config.js';

export function updateEvents() {
    if (gameState.current !== STATE.PLAYING) return;
    if (gameState.streamerState === STREAMER_STATE.AWAKE) return;

    // Check for random instant wake up event
    if (Math.random() < CONFIG.events.chancePerFrame && !gameState.activeEvent) {
        triggerMemeEvent();
    }
}

function triggerMemeEvent() {
    // Pick random meme
    const eventObj = CONFIG.events.types[Math.floor(Math.random() * CONFIG.events.types.length)];
    gameState.activeEvent = eventObj;
    
    // INSTANT WAKE UP! (No warning)
    gameState.streamerState = STREAMER_STATE.AWAKE;
    gameState.streamerTimer = CONFIG.streamer.awakeMax; 
    
    console.log(`[MEME EVENT] ${eventObj.id} triggered! Streamer woke up instantly!`);
    
    // Here we will later trigger UI to show the WebM video
    // e.g. playWebM(eventObj.videoUrl);
}

export function clearActiveEvent() {
    gameState.activeEvent = null;
}
