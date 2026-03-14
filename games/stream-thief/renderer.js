// games/stream-thief/renderer.js
import { gameState, STATE, STREAMER_STATE } from './gameState.js';
import { CONFIG } from './config.js';

let ctx;
let canvas;

// Assets
let sleepVideo;
let warningSprite;
let awakeSprite;
let bgImage;
let handImage;

export function initRenderer(canvasElement) {
    canvas = canvasElement;
    ctx = canvas.getContext('2d');
    
    // 1. Load the sleeping video
    sleepVideo = document.createElement('video');
    sleepVideo.src = 'assets/webm/sleep_loop.webm'; // Путь к видео сна
    sleepVideo.loop = true;
    sleepVideo.muted = true;
    sleepVideo.play(); // Start playing in background

    // 2. Load sprites for interactive states
    warningSprite = new Image();
    warningSprite.src = 'assets/img/streamer_warning.png';
    
    awakeSprite = new Image();
    awakeSprite.src = 'assets/img/streamer_awake.png';

    bgImage = new Image();
    bgImage.src = 'assets/img/room_bg.jpg';
}

export function render() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw Background
    if (bgImage.complete) {
        ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
    }

    // 2. Draw Streamer (Video or Sprite depending on state)
    drawStreamer();

    // 3. Draw Hand (Thief)
    drawHand();

    // 4. Draw UI (Score, Memes overlays if any)
    drawUI();
}

function drawStreamer() {
    const streamerX = 300;
    const streamerY = 150;
    const streamerW = 400;
    const streamerH = 400;

    if (gameState.streamerState === STREAMER_STATE.SLEEPING) {
        // Draw the current frame of the looping video directly to canvas!
        if (sleepVideo.readyState >= 2) { // Ensure video has data
            ctx.drawImage(sleepVideo, streamerX, streamerY, streamerW, streamerH);
        }
    } 
    else if (gameState.streamerState === STREAMER_STATE.WARNING) {
        // Switch to drawn sprite
        if (warningSprite.complete) {
            ctx.drawImage(warningSprite, streamerX, streamerY, streamerW, streamerH);
        }
    } 
    else if (gameState.streamerState === STREAMER_STATE.AWAKE) {
        // Switch to awake/caught sprite
        if (awakeSprite.complete) {
            ctx.drawImage(awakeSprite, streamerX, streamerY, streamerW, streamerH);
        }
    }
}

function drawHand() {
    if (gameState.current !== STATE.PLAYING && gameState.current !== STATE.CAUGHT) return;

    // Base position (hidden off-screen)
    let handX = -200 + (gameState.handProgress * 2); // Moves right as progress increases
    let handY = 400;

    // For now, draw a simple placeholder for the hand
    ctx.fillStyle = '#ffccaa'; // Skin color
    ctx.fillRect(handX, handY, 300, 80);
    
    // Draw grabber (fingers)
    ctx.fillStyle = '#eebb99';
    ctx.fillRect(handX + 300, handY + 10, 40, 60);
}

function drawUI() {
    ctx.fillStyle = 'white';
    ctx.font = '24px Impact';
    ctx.fillText(`Score: ${gameState.score}`, 20, 40);
    
    // Debug info
    ctx.font = '16px Arial';
    ctx.fillText(`Phase: ${gameState.current === STATE.PLAYING ? 'Thief' : 'Streamer'}`, 20, 70);
    ctx.fillText(`Hand: ${Math.floor(gameState.handProgress)}`, 20, 90);
}
