
import { CONFIG, MODE, STATE } from './config.js';
import { gameState, getWeightKg } from './gameState.js';

const W = CONFIG.canvasWidth;
const H = CONFIG.canvasHeight;

let bgGradient = null;
let starField = [];
const faceImages = {};
let faceImagesLoaded = false;

export function loadFaceImages() {
    const allSources = [
        ...CONFIG.faceImagesObesity,
        ...CONFIG.faceImagesFit
    ];

    let loaded = 0;
    const total = allSources.length;

    for (const entry of allSources) {
        const src = './assets/' + entry.image;
        if (faceImages[src]) {
            loaded++;
            if (loaded >= total) faceImagesLoaded = true;
            continue;
        }

        const img = new Image();
        img.onload = () => { loaded++; if (loaded >= total) faceImagesLoaded = true; };
        img.onerror = () => { loaded++; console.warn(`Failed: ${src}`); if (loaded >= total) faceImagesLoaded = true; };
        img.src = src;
        faceImages[src] = img;
    }
    
    if (total === 0) faceImagesLoaded = true;
}

function getCurrentFaceImage() {
    if (!faceImagesLoaded) return null;

    const isObesity = gameState.mode === MODE.OBESITY;
    const list = isObesity ? CONFIG.faceImagesObesity : CONFIG.faceImagesFit;
    
    const currentWeight = getWeightKg();
    const sortedList = [...list].sort((a, b) => a.weight - b.weight);

    let best = sortedList[0];
    for (const entry of sortedList) {
        if (currentWeight >= entry.weight) {
            best = entry;
        }
    }

    if (best) {
        const src = './assets/' + best.image;
        if (faceImages[src] && faceImages[src].complete) {
            return faceImages[src];
        }
    }
    return null;
}

export function initRenderer(ctx) {
    starField = [];
    for (let i = 0; i < 60; i++) {
        starField.push({
            x: Math.random() * W, y: Math.random() * H * 0.75,
            r: 0.5 + Math.random() * 1.5, speed: 0.1 + Math.random() * 0.3, phase: Math.random() * Math.PI * 2
        });
    }
    loadFaceImages();
}

export function drawFrame(ctx, time) {
    const state = gameState.current;
    let shakeX = 0, shakeY = 0;

    if (gameState.shakeTimer > 0 && gameState.shakeIntensity > 0) {
        const intensity = Math.min(gameState.shakeIntensity, CONFIG.maxShakeIntensity);
        const fade = Math.min(1, gameState.shakeTimer / 0.1);
        shakeX = (Math.random() - 0.5) * intensity * fade;
        shakeY = (Math.random() - 0.5) * intensity * fade;
    }

    ctx.save();
    ctx.translate(shakeX, shakeY);
    drawBackground(ctx, time);

    if (state === STATE.MENU) drawMenu(ctx, time);
    else if (state === STATE.PLAYING) drawGame(ctx, time);
    else if (state === STATE.GAMEOVER) { drawGame(ctx, time); drawGameOver(ctx, time); }

    ctx.restore();
}

function drawBackground(ctx, time) {
    if (!bgGradient) {
        bgGradient = ctx.createLinearGradient(0, 0, 0, H);
        bgGradient.addColorStop(0, '#050510');
        bgGradient.addColorStop(0.5, '#0a0a1a');
        bgGradient.addColorStop(1, '#12122a');
    }
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, W, H);

    for (const s of starField) {
        ctx.globalAlpha = 0.3 + Math.sin(time * s.speed + s.phase) * 0.3;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

function drawMenu(ctx, time) {
    const bounce = Math.sin(time * 2) * 5;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 20;
    ctx.font = 'bold 52px Impact, sans-serif'; ctx.fillStyle = '#FFD700';
    ctx.fillText('FAT or FIT', W / 2, 100 + bounce);
    ctx.shadowBlur = 0;

    ctx.font = '18px sans-serif'; ctx.fillStyle = '#888';
    ctx.fillText('Choose your challenge', W / 2, 150);

    drawModeCard(ctx, W / 2 - 105, 200, 210, 220, MODE.OBESITY, time);
    drawModeCard(ctx, W / 2 - 105, 440, 210, 220, MODE.FIT, time);

    ctx.font = '14px sans-serif'; ctx.fillStyle = '#555';
    ctx.fillText('← → / CLICK-DRAG / SWIPE', W / 2, H - 30);
}

function drawModeCard(ctx, x, y, w, h, mode, time) {
    const isObesity = mode === MODE.OBESITY;
    const color = isObesity ? '#FF003C' : '#00FF41';
    const pulse = Math.sin(time * 3) * 2;

    ctx.fillStyle = '#111'; ctx.strokeStyle = color; ctx.lineWidth = 2;
    roundRect(ctx, x, y + pulse, w, h, 12, true, true);
    ctx.shadowColor = color; ctx.shadowBlur = 15;
    roundRect(ctx, x, y + pulse, w, h, 12, false, true);
    ctx.shadowBlur = 0;

    ctx.font = '48px serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
    ctx.fillText(isObesity ? '🍔' : '🥗', x + w / 2, y + pulse + 55);

    ctx.font = 'bold 26px Impact, sans-serif'; ctx.fillStyle = color;
    ctx.fillText(isObesity ? 'OBESITY' : 'FITNESS', x + w / 2, y + pulse + 100);

    ctx.font = '13px sans-serif'; ctx.fillStyle = '#aaa';
    if (isObesity) {
        ctx.fillText('Catch ONLY junk food!', x + w / 2, y + pulse + 130);
        ctx.fillText('Grow as big as possible', x + w / 2, y + pulse + 148);
        ctx.fillText(`3 HEALTHY CAUGHT = Game Over`, x + w / 2, y + pulse + 166);
    } else {
        ctx.fillText('Catch ONLY healthy food!', x + w / 2, y + pulse + 130);
        ctx.fillText('Dodge all junk food', x + w / 2, y + pulse + 148);
        ctx.fillText('3 JUNK CAUGHT = Game Over', x + w / 2, y + pulse + 166);
    }

    ctx.font = 'bold 14px Impact, sans-serif'; ctx.fillStyle = color;
    ctx.fillText('▶ TAP TO PLAY', x + w / 2, y + pulse + 200);

    if (!drawModeCard._bounds) drawModeCard._bounds = {};
    drawModeCard._bounds[mode] = { x, y, w, h };
}

export function getMenuCardBounds() { return drawModeCard._bounds || {}; }

function drawGame(ctx, time) {
    const isObesity = gameState.mode === MODE.OBESITY;
    const zoom = gameState.cameraZoom;

    ctx.save();
    if (zoom < 1.0) {
        const offsetX = (W - W / zoom) / 2 * zoom;
        ctx.scale(zoom, 1); 
    }

    const floorY = CONFIG.playerY + 30;
    ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, floorY, gameState.worldWidth, H - floorY);

    const laneCount = gameState.currentLanes;
    const laneW = gameState.worldWidth / laneCount;
    ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 1;
    for (let i = 1; i < laneCount; i++) {
        ctx.beginPath(); ctx.moveTo(i * laneW, 0); ctx.lineTo(i * laneW, floorY); ctx.stroke();
    }

    if (gameState.currentLanes > CONFIG.baseLanes) {
        ctx.font = '11px sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.textAlign = 'center';
        ctx.fillText(`${gameState.currentLanes} lanes`, gameState.worldWidth / 2, 12);
    }

    for (const item of gameState.items) drawItem(ctx, item, time);
    for (const p of gameState.particles) {
        ctx.globalAlpha = Math.max(0, p.life);
        if (p.isText) {
            ctx.font = `bold ${p.size}px Impact, sans-serif`; ctx.textAlign = 'center'; ctx.fillStyle = p.color || '#fff';
            ctx.fillText(p.emoji, p.x, p.y);
        } else {
            ctx.font = `${p.size}px serif`; ctx.textAlign = 'center'; ctx.fillText(p.emoji, p.x, p.y);
        }
    }
    ctx.globalAlpha = 1;
    drawPlayer(ctx, time);
    ctx.restore();

    drawHUD(ctx, isObesity);
}

function drawItem(ctx, item, time) {
    const bob = Math.sin(time * 4 + item.phase) * 3;
    const rot = Math.sin(time * 2 + item.phase) * 0.1;
    const zoom = gameState.cameraZoom;

    ctx.save(); ctx.translate(item.x, item.y + bob); ctx.rotate(rot);
    const glowColor = item.isJunk ? '#FF003C' : '#00FF41';
    const glowSize = Math.max(15, 18 / zoom);

    ctx.shadowColor = glowColor; ctx.shadowBlur = glowSize;
    const fontSize = Math.max(CONFIG.itemSize, CONFIG.itemSize / zoom * 0.8);
    ctx.font = `${fontSize}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(item.emoji, 0, 0);

    ctx.shadowBlur = glowSize * 1.5; ctx.fillText(item.emoji, 0, 0);
    ctx.shadowBlur = 0; ctx.restore();
}

function drawPlayer(ctx, time) {
    const px = gameState.playerX, py = CONFIG.playerY, scale = gameState.playerScale;
    const w = CONFIG.playerWidth * scale, h = CONFIG.playerHeight * scale;
    const isObesity = gameState.mode === MODE.OBESITY;

    ctx.save(); ctx.translate(px, py);
    
    // Тень под игроком
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath();
    ctx.ellipse(0, h / 2 + 5, w / 2, 8, 0, 0, Math.PI * 2); ctx.fill();

    const faceImg = getCurrentFaceImage();
    
    if (faceImg) {
        // Картинка полностью заменяет тело и растягивается под нужный размер
        ctx.drawImage(faceImg, -w / 2, -h / 2, w, h);
    } else {
        // Заглушка, если картинки вдруг не загрузились
        const bodyColor = isObesity
            ? `hsl(${Math.max(0, 40 - scale * 12)}, 70%, ${Math.max(30, 60 - scale * 8)}%)`
            : `hsl(${120 + scale * 10}, 70%, ${50 + Math.sin(time * 2) * 5}%)`;
        ctx.fillStyle = bodyColor;
        roundRect(ctx, -w / 2, -h / 2, w, h, w * 0.3, true, false);

        const eyeSpacing = w * 0.2, eyeY = -h * 0.15, eyeSize = Math.max(3, 5 * (1 / Math.sqrt(scale)));
        ctx.fillStyle = '#fff'; ctx.beginPath();
        ctx.arc(-eyeSpacing, eyeY, eyeSize + 2, 0, Math.PI * 2); ctx.arc(eyeSpacing, eyeY, eyeSize + 2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#111'; ctx.beginPath();
        ctx.arc(-eyeSpacing + 1, eyeY + 1, eyeSize, 0, Math.PI * 2); ctx.arc(eyeSpacing + 1, eyeY + 1, eyeSize, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#111'; ctx.lineWidth = 2; ctx.beginPath();
        if (isObesity) ctx.arc(0, h * 0.1, w * 0.15, 0, Math.PI);
        else ctx.arc(0, h * 0.05, w * 0.12, 0.2, Math.PI - 0.2);
        ctx.stroke();
    }

    ctx.restore();
}

function drawHUD(ctx, isObesity) {
    // Полупрозрачный текст режима по центру (чтобы не забыть во что играешь)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = 'bold 22px Impact, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'; // 20% непрозрачности (не мешает игре)
    ctx.fillText(isObesity ? '🍔 OBESITY MODE 🍔' : '🥗 FITNESS MODE 🥗', W / 2, 20);

    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.font = 'bold 28px Impact, sans-serif'; ctx.fillStyle = '#FFD700';
    ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 8;
    ctx.fillText(`${Math.floor(gameState.score)}`, 15, 15); ctx.shadowBlur = 0;

    if (gameState.combo > 2) {
        ctx.font = 'bold 18px Impact, sans-serif'; ctx.fillStyle = '#FF6600';
        ctx.fillText(`x${gameState.combo} COMBO`, 15, 48);
    }

    ctx.textAlign = 'right';
    const weight = getWeightKg();

    if (isObesity) {
        ctx.font = '14px serif';
        let icons = '';
        for (let i = 0; i < CONFIG.obesityMissLimit; i++) {
            icons += i < (CONFIG.obesityMissLimit - gameState.missed) ? '💚' : '💀';
        }
        ctx.fillText(icons, W - 15, 15);

        ctx.font = 'bold 16px Impact, sans-serif'; ctx.fillStyle = '#ff8800';
        ctx.fillText(`${weight} kg`, W - 15, 38);

        if (gameState.currentLanes > CONFIG.baseLanes) {
            ctx.font = '12px sans-serif'; ctx.fillStyle = '#888';
            ctx.fillText(`${gameState.currentLanes} lanes`, W - 15, 58);
        }
    } else {
        ctx.font = '14px serif';
        let icons = '';
        for (let i = 0; i < CONFIG.fitStrikesMax; i++) {
            icons += i < (CONFIG.fitStrikesMax - gameState.strikes) ? '💚' : '💀';
        }
        ctx.fillText(icons, W - 15, 15);

        ctx.font = 'bold 16px Impact, sans-serif'; ctx.fillStyle = weight <= CONFIG.baseWeightObesity ? '#00FF41' : '#ff8800';
        ctx.fillText(`${weight} kg`, W - 15, 38);

        ctx.font = '12px sans-serif'; ctx.fillStyle = '#00FF41';
        ctx.fillText(`FIT LVL ${Math.floor(gameState.elapsed / 10) + 1}`, W - 15, 58);
    }
}

function drawGameOver(ctx, time) {
    ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillRect(0, 0, W, H);

    const isObesity = gameState.mode === MODE.OBESITY;
    const bounce = Math.sin(time * 3) * 5;
    const weight = getWeightKg();

    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

    const faceImg = getCurrentFaceImage();
    if (faceImg) ctx.drawImage(faceImg, W / 2 - 48, 130 + bounce, 96, 96);
    else { ctx.font = '64px serif'; ctx.fillText(isObesity ? '🤮' : '😵', W / 2, 180 + bounce); }

    ctx.shadowColor = '#FF003C'; ctx.shadowBlur = 20;
    ctx.font = 'bold 48px Impact, sans-serif'; ctx.fillStyle = '#FF003C';
    ctx.fillText('GAME OVER', W / 2, 260); ctx.shadowBlur = 0;

    ctx.font = '18px sans-serif'; ctx.fillStyle = '#aaa';
    if (isObesity) {
        ctx.fillText('Caught too much healthy food!', W / 2, 310);
        ctx.fillText(`Final weight: ${weight} kg`, W / 2, 335);
    } else {
        ctx.fillText('Caught too much junk food!', W / 2, 310);
        ctx.fillText(`Final weight: ${weight} kg`, W / 2, 335);
    }

    ctx.font = 'bold 36px Impact, sans-serif'; ctx.fillStyle = '#FFD700'; ctx.shadowBlur = 15;
    ctx.fillText(`SCORE: ${Math.floor(gameState.score)}`, W / 2, 400); ctx.shadowBlur = 0;

    if (gameState.maxCombo > 2) {
        ctx.font = '18px sans-serif'; ctx.fillStyle = '#FF6600';
        ctx.fillText(`Best combo: x${gameState.maxCombo}`, W / 2, 440);
    }

    const pulse = 0.9 + Math.sin(time * 4) * 0.1;
    ctx.font = `bold ${20 * pulse}px Impact, sans-serif`; ctx.fillStyle = '#00FF41';
    ctx.fillText('▶ TAP TO RESTART', W / 2, 520);

    ctx.font = '15px sans-serif'; ctx.fillStyle = '#666'; ctx.fillText('or press SPACE', W / 2, 550);
    ctx.font = '14px sans-serif'; ctx.fillStyle = '#888'; ctx.fillText('ESC — Back to menu', W / 2, 600);
}

function roundRect(ctx, x, y, w, h, r, fill, stroke) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath(); if (fill) ctx.fill(); if (stroke) ctx.stroke();
}
