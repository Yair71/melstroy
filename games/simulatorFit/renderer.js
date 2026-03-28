// ============================================================
// renderer.js — All canvas 2D drawing
// ============================================================
import { CONFIG, MODE, STATE, FOODS } from './config.js';
import { gameState } from './gameState.js';

const W = CONFIG.canvasWidth;
const H = CONFIG.canvasHeight;

// Cache
let bgGradient = null;
let starField = [];

export function initRenderer(ctx) {
    // Build starfield once
    starField = [];
    for (let i = 0; i < 60; i++) {
        starField.push({
            x: Math.random() * W,
            y: Math.random() * H * 0.75,
            r: 0.5 + Math.random() * 1.5,
            speed: 0.1 + Math.random() * 0.3,
            phase: Math.random() * Math.PI * 2
        });
    }
}

// ===== DRAW FRAME =====
export function drawFrame(ctx, time) {
    const state = gameState.current;

    // Screen shake offset
    let shakeX = 0, shakeY = 0;
    if (gameState.shakeTimer > 0) {
        shakeX = (Math.random() - 0.5) * gameState.shakeIntensity;
        shakeY = (Math.random() - 0.5) * gameState.shakeIntensity;
    }

    ctx.save();
    ctx.translate(shakeX, shakeY);

    // Background
    drawBackground(ctx, time);

    if (state === STATE.MENU) {
        drawMenu(ctx, time);
    } else if (state === STATE.PLAYING) {
        drawGame(ctx, time);
    } else if (state === STATE.GAMEOVER) {
        drawGame(ctx, time);
        drawGameOver(ctx, time);
    }

    ctx.restore();
}

// ===== BACKGROUND =====
function drawBackground(ctx, time) {
    // Dark gradient
    if (!bgGradient) {
        bgGradient = ctx.createLinearGradient(0, 0, 0, H);
        bgGradient.addColorStop(0, '#050510');
        bgGradient.addColorStop(0.5, '#0a0a1a');
        bgGradient.addColorStop(1, '#12122a');
    }
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, W, H);

    // Animated stars
    for (const s of starField) {
        const alpha = 0.3 + Math.sin(time * s.speed + s.phase) * 0.3;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

// ===== MENU =====
function drawMenu(ctx, time) {
    // Title
    const bounce = Math.sin(time * 2) * 5;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Glow effect
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 20;
    ctx.font = 'bold 52px Impact, sans-serif';
    ctx.fillStyle = '#FFD700';
    ctx.fillText('FAT or FIT', W / 2, 100 + bounce);
    ctx.shadowBlur = 0;

    ctx.font = '18px "Segoe UI", sans-serif';
    ctx.fillStyle = '#888';
    ctx.fillText('Choose your challenge', W / 2, 150);

    // Two big cards
    drawModeCard(ctx, W / 2 - 105, 200, 200, 220, MODE.OBESITY, time);
    drawModeCard(ctx, W / 2 - 105, 440, 200, 220, MODE.FIT, time);

    // Controls hint
    ctx.font = '14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#555';
    ctx.fillText('← → or SWIPE to move', W / 2, H - 30);
}

function drawModeCard(ctx, x, y, w, h, mode, time) {
    const isObesity = mode === MODE.OBESITY;
    const color = isObesity ? '#FF003C' : '#00FF41';
    const hoverPulse = Math.sin(time * 3) * 2;

    // Card background
    ctx.fillStyle = '#111';
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    roundRect(ctx, x, y + hoverPulse, w, h, 12, true, true);

    // Glow
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    roundRect(ctx, x, y + hoverPulse, w, h, 12, false, true);
    ctx.shadowBlur = 0;

    // Icon
    ctx.font = '48px serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.fillText(isObesity ? '🍔' : '🥗', x + w / 2, y + hoverPulse + 55);

    // Title
    ctx.font = 'bold 26px Impact, sans-serif';
    ctx.fillStyle = color;
    ctx.fillText(isObesity ? 'OBESITY' : 'FITNESS', x + w / 2, y + hoverPulse + 100);

    // Description
    ctx.font = '13px "Segoe UI", sans-serif';
    ctx.fillStyle = '#aaa';
    if (isObesity) {
        ctx.fillText('Catch EVERYTHING!', x + w / 2, y + hoverPulse + 130);
        ctx.fillText('Grow as big as possible', x + w / 2, y + hoverPulse + 148);
        ctx.fillText('Miss 5 = Game Over', x + w / 2, y + hoverPulse + 166);
    } else {
        ctx.fillText('Catch ONLY healthy food', x + w / 2, y + hoverPulse + 130);
        ctx.fillText('Dodge all junk food!', x + w / 2, y + hoverPulse + 148);
        ctx.fillText('3 junk caught = Game Over', x + w / 2, y + hoverPulse + 166);
    }

    // Click area tag
    ctx.font = 'bold 14px Impact, sans-serif';
    ctx.fillStyle = color;
    ctx.fillText('▶ TAP TO PLAY', x + w / 2, y + hoverPulse + 200);

    // Store bounds for click detection
    if (!drawModeCard._bounds) drawModeCard._bounds = {};
    drawModeCard._bounds[mode] = { x, y: y + hoverPulse, w, h };
}

// Export for click detection
export function getMenuCardBounds() {
    return drawModeCard._bounds || {};
}

// ===== GAME =====
function drawGame(ctx, time) {
    const isObesity = gameState.mode === MODE.OBESITY;

    // Floor
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, CONFIG.playerY + 30, W, H - CONFIG.playerY - 30);

    // Lane lines (subtle)
    const laneW = W / CONFIG.lanes;
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let i = 1; i < CONFIG.lanes; i++) {
        ctx.beginPath();
        ctx.moveTo(i * laneW, 0);
        ctx.lineTo(i * laneW, CONFIG.playerY + 30);
        ctx.stroke();
    }

    // Draw items
    for (const item of gameState.items) {
        drawItem(ctx, item, time);
    }

    // Draw particles
    for (const p of gameState.particles) {
        ctx.globalAlpha = p.life;
        ctx.font = `${p.size}px serif`;
        ctx.textAlign = 'center';
        ctx.fillText(p.emoji, p.x, p.y);
    }
    ctx.globalAlpha = 1;

    // Draw player
    drawPlayer(ctx, time);

    // Draw HUD
    drawHUD(ctx, isObesity);
}

function drawItem(ctx, item, time) {
    const bob = Math.sin(time * 4 + item.phase) * 3;
    const rot = Math.sin(time * 2 + item.phase) * 0.1;

    ctx.save();
    ctx.translate(item.x, item.y + bob);
    ctx.rotate(rot);

    // Glow underneath
    const glowColor = item.isJunk ? 'rgba(255,0,60,0.15)' : 'rgba(0,255,65,0.15)';
    ctx.shadowColor = item.isJunk ? '#FF003C' : '#00FF41';
    ctx.shadowBlur = 12;

    // Emoji
    ctx.font = `${CONFIG.itemSize}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.emoji, 0, 0);

    ctx.shadowBlur = 0;
    ctx.restore();
}

function drawPlayer(ctx, time) {
    const px = gameState.playerX;
    const py = CONFIG.playerY;
    const scale = gameState.playerScale;
    const w = CONFIG.playerWidth * scale;
    const h = CONFIG.playerHeight * scale;
    const isObesity = gameState.mode === MODE.OBESITY;

    ctx.save();
    ctx.translate(px, py);

    // Body (rounded rectangle — the "character")
    const bodyColor = isObesity
        ? `hsl(${Math.max(0, 40 - scale * 15)}, 70%, ${Math.max(30, 60 - scale * 10)}%)`
        : `hsl(${120 + scale * 10}, 70%, ${50 + Math.sin(time * 2) * 5}%)`;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(0, h / 2 + 5, w / 2, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = bodyColor;
    roundRect(ctx, -w / 2, -h / 2, w, h, w * 0.3, true, false);

    // Eyes
    const eyeSpacing = w * 0.2;
    const eyeY = -h * 0.15;
    const eyeSize = Math.max(3, 5 * (1 / scale));

    // Eye whites
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-eyeSpacing, eyeY, eyeSize + 2, 0, Math.PI * 2);
    ctx.arc(eyeSpacing, eyeY, eyeSize + 2, 0, Math.PI * 2);
    ctx.fill();

    // Pupils
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(-eyeSpacing + 1, eyeY + 1, eyeSize, 0, Math.PI * 2);
    ctx.arc(eyeSpacing + 1, eyeY + 1, eyeSize, 0, Math.PI * 2);
    ctx.fill();

    // Mouth
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (isObesity) {
        // Happy open mouth
        ctx.arc(0, h * 0.1, w * 0.15, 0, Math.PI);
    } else {
        // Determined smile
        ctx.arc(0, h * 0.05, w * 0.12, 0.2, Math.PI - 0.2);
    }
    ctx.stroke();

    // Arms (little stubs)
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.ellipse(-w / 2 - 4, 0, 6 * scale, 10 * scale, -0.3, 0, Math.PI * 2);
    ctx.ellipse(w / 2 + 4, 0, 6 * scale, 10 * scale, 0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

function drawHUD(ctx, isObesity) {
    // Score
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = 'bold 28px Impact, sans-serif';
    ctx.fillStyle = '#FFD700';
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 8;
    ctx.fillText(`${Math.floor(gameState.score)}`, 15, 15);
    ctx.shadowBlur = 0;

    // Combo
    if (gameState.combo > 2) {
        ctx.font = 'bold 18px Impact, sans-serif';
        ctx.fillStyle = '#FF6600';
        ctx.fillText(`x${gameState.combo} COMBO`, 15, 48);
    }

    // Mode-specific HUD
    ctx.textAlign = 'right';
    if (isObesity) {
        // Missed counter
        ctx.font = '16px "Segoe UI", sans-serif';
        ctx.fillStyle = '#FF003C';
        const hearts = '💔'.repeat(gameState.missed) + '❤️'.repeat(CONFIG.obesityMissLimit - gameState.missed);
        ctx.fillText(hearts, W - 15, 15);

        // Weight indicator
        ctx.font = 'bold 16px Impact, sans-serif';
        ctx.fillStyle = '#ff8800';
        const weight = Math.floor(70 + (gameState.playerScale - 1) * 200);
        ctx.fillText(`${weight} kg`, W - 15, 42);
    } else {
        // Strikes
        ctx.font = '16px "Segoe UI", sans-serif';
        ctx.fillStyle = '#FF003C';
        const strikes = '💀'.repeat(gameState.strikes) + '💚'.repeat(CONFIG.fitStrikesMax - gameState.strikes);
        ctx.fillText(strikes, W - 15, 15);

        // Fitness level
        ctx.font = 'bold 16px Impact, sans-serif';
        ctx.fillStyle = '#00FF41';
        ctx.fillText(`FIT LVL ${Math.floor(gameState.elapsed / 10) + 1}`, W - 15, 42);
    }
}

// ===== GAME OVER =====
function drawGameOver(ctx, time) {
    // Dark overlay
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(0, 0, W, H);

    const isObesity = gameState.mode === MODE.OBESITY;
    const bounce = Math.sin(time * 3) * 5;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Big emoji
    ctx.font = '64px serif';
    ctx.fillText(isObesity ? '🤮' : '😵', W / 2, 180 + bounce);

    // Title
    ctx.shadowColor = '#FF003C';
    ctx.shadowBlur = 20;
    ctx.font = 'bold 48px Impact, sans-serif';
    ctx.fillStyle = '#FF003C';
    ctx.fillText('GAME OVER', W / 2, 260);
    ctx.shadowBlur = 0;

    // Reason
    ctx.font = '18px "Segoe UI", sans-serif';
    ctx.fillStyle = '#aaa';
    if (isObesity) {
        ctx.fillText(`Missed too many items!`, W / 2, 310);
        const weight = Math.floor(70 + (gameState.playerScale - 1) * 200);
        ctx.fillText(`Final weight: ${weight} kg`, W / 2, 335);
    } else {
        ctx.fillText(`Ate too much junk food!`, W / 2, 310);
    }

    // Score
    ctx.font = 'bold 36px Impact, sans-serif';
    ctx.fillStyle = '#FFD700';
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 15;
    ctx.fillText(`SCORE: ${Math.floor(gameState.score)}`, W / 2, 400);
    ctx.shadowBlur = 0;

    // Max combo
    if (gameState.maxCombo > 2) {
        ctx.font = '18px "Segoe UI", sans-serif';
        ctx.fillStyle = '#FF6600';
        ctx.fillText(`Best combo: x${gameState.maxCombo}`, W / 2, 440);
    }

    // Restart buttons
    const pulse = 0.9 + Math.sin(time * 4) * 0.1;
    ctx.font = `bold ${20 * pulse}px Impact, sans-serif`;
    ctx.fillStyle = '#00FF41';
    ctx.fillText('▶ TAP TO RESTART', W / 2, 520);

    ctx.font = '15px "Segoe UI", sans-serif';
    ctx.fillStyle = '#666';
    ctx.fillText('or press SPACE', W / 2, 550);

    // Back to menu
    ctx.font = '14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#888';
    ctx.fillText('ESC — Back to menu', W / 2, 600);
}

// ===== HELPERS =====
function roundRect(ctx, x, y, w, h, r, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
}
