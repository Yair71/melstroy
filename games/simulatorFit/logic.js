// ============================================================
// logic.js — v6: Bombs, Coins, KG Text instead of Score Text
// ============================================================
import { CONFIG, MODE, STATE, FOODS } from './config.js';
import { gameState } from './gameState.js';

export function updateGame(dt) {
    if (gameState.shakeTimer > 0) {
        gameState.shakeTimer -= dt;
        if (gameState.shakeTimer <= 0) {
            gameState.shakeTimer = 0;
            gameState.shakeIntensity = 0;
        }
    }

    if (gameState.current !== STATE.PLAYING) return;

    gameState.elapsed += dt;

    gameState.currentFallSpeed = Math.min(
        CONFIG.maxFallSpeed,
        CONFIG.itemFallSpeed + gameState.elapsed * CONFIG.speedIncreaseRate
    );
    gameState.currentSpawnInterval = Math.max(
        CONFIG.minSpawnInterval,
        CONFIG.itemSpawnInterval - gameState.elapsed * CONFIG.spawnDecreaseRate
    );

    updateDynamicLanes();
    updatePlayerMovement(dt);

    gameState.spawnTimer -= dt;
    if (gameState.spawnTimer <= 0) {
        spawnItem();
        gameState.spawnTimer = gameState.currentSpawnInterval;
    }

    updateItems(dt);
    updateParticles(dt);

    gameState.score += dt * 2;
}

function updateDynamicLanes() {
    const playerPixelW = CONFIG.playerWidth * gameState.playerScale;
    const currentFieldW = gameState.worldWidth;
    const ratio = playerPixelW / currentFieldW;

    if (ratio > CONFIG.expandThreshold && gameState.currentLanes < CONFIG.maxLanes) {
        gameState.currentLanes += 1;
        const laneW = CONFIG.canvasWidth / CONFIG.baseLanes;
        gameState.worldWidth = gameState.currentLanes * laneW;
        gameState._targetZoom = CONFIG.canvasWidth / gameState.worldWidth;
    }

    if (gameState._targetZoom === undefined) gameState._targetZoom = 1.0;
    const zoomDiff = gameState._targetZoom - gameState.cameraZoom;
    if (Math.abs(zoomDiff) > 0.001) {
        gameState.cameraZoom += zoomDiff * 0.05; 
    } else {
        gameState.cameraZoom = gameState._targetZoom;
    }

    const maxW = currentFieldW * CONFIG.maxPlayerScaleRatio;
    const maxScale = maxW / CONFIG.playerWidth;
    if (gameState.playerScale > maxScale) {
        gameState.playerScale = maxScale;
    }
}

function updatePlayerMovement(dt) {
    const speed = CONFIG.playerSpeed / gameState.cameraZoom; 
    const halfW = (CONFIG.playerWidth * gameState.playerScale) / 2;

    if (gameState.touchActive && gameState.touchX !== null) {
        const worldTouchX = gameState.touchX / gameState.cameraZoom;
        const diff = worldTouchX - gameState.playerX;
        const moveAmount = diff * Math.min(1, dt * 12);
        gameState.playerX += moveAmount;
    }

    if (gameState.moveLeft) gameState.playerX -= speed * dt;
    if (gameState.moveRight) gameState.playerX += speed * dt;

    const worldW = gameState.worldWidth;
    gameState.playerX = Math.max(halfW + 5, Math.min(worldW - halfW - 5, gameState.playerX));
}

function spawnItem() {
    const isObesity = gameState.mode === MODE.OBESITY;
    
    let type = 'food';
    let isJunk = false;
    let emoji = '';
    
    const r = Math.random();
    
    // Выбор: Бомба, Монета или Еда
    if (r < CONFIG.bombChance) {
        type = 'bomb';
        emoji = '💣';
    } else if (r < CONFIG.bombChance + CONFIG.coinChance) {
        type = 'coin';
        emoji = '💰';
    } else {
        const junkChance = isObesity ? 0.55 : 0.5;
        isJunk = Math.random() < junkChance;
        const pool = isJunk ? FOODS.junk : FOODS.healthy;
        const food = pool[Math.floor(Math.random() * pool.length)];
        emoji = food.emoji;
    }

    const laneCount = gameState.currentLanes;
    const pad = CONFIG.itemSize * 0.8;
    const usableW = gameState.worldWidth - pad * 2;
    const laneWidth = usableW / laneCount;
    const lane = Math.floor(Math.random() * laneCount);
    const x = pad + lane * laneWidth + laneWidth / 2 + (Math.random() - 0.5) * laneWidth * 0.3;

    gameState.items.push({
        type: type,
        x: x,
        y: -CONFIG.itemSize,
        emoji: emoji,
        isJunk: isJunk,
        phase: Math.random() * Math.PI * 2,
        speed: gameState.currentFallSpeed * (0.9 + Math.random() * 0.2)
    });
}

function updateItems(dt) {
    const playerX = gameState.playerX;
    const playerY = CONFIG.playerY;
    const scale = gameState.playerScale;
    const playerHalfW = (CONFIG.playerWidth * scale) / 2;
    const isObesity = gameState.mode === MODE.OBESITY;

    for (let i = gameState.items.length - 1; i >= 0; i--) {
        const item = gameState.items[i];
        item.y += item.speed * dt;

        const dx = Math.abs(item.x - playerX);
        const catchX = playerHalfW * 0.7;
        const playerTopY = playerY - (CONFIG.playerHeight * scale) / 2;
        const itemBottomEdge = item.y + CONFIG.itemSize * 0.3;
        const verticalHit = itemBottomEdge >= playerTopY && item.y <= playerY + 10;

        if (dx < catchX && verticalHit) {
            handleCatch(item, isObesity);
            gameState.items.splice(i, 1);
            continue;
        }

        if (item.y > playerY + 30) {
            handleMiss(item, isObesity, playerX);
            gameState.items.splice(i, 1);
        }
    }
}

function handleCatch(item, isObesity) {
    // Взрыв от бомбы
    if (item.type === 'bomb') {
        gameState.killedByBomb = true;
        spawnParticles(item.x, item.y, '💥', '#ff0000', 15);
        spawnParticles(item.x, item.y, '🔥', '#ff8800', 10);
        triggerGameOver();
        return;
    }

    // Сбор монеты
    if (item.type === 'coin') {
        gameState.coins++;
        spawnParticles(item.x, item.y, '✨', '#FFD700', 3);
        spawnTextParticle(item.x, item.y - 20, '+1 💰', '#FFD700');
        return;
    }

    // Подбор еды
    if (isObesity) {
        if (!item.isJunk) {
            // Плохо в Obesity
            gameState.missed++;
            gameState.combo = 0;
            // Scale Math.max(0.5) позволяет весу падать ниже
            gameState.playerScale = Math.max(0.5, gameState.playerScale - CONFIG.shrinkPerHealthy);
            gameState.shakeTimer = 0.2;
            gameState.shakeIntensity = Math.min(CONFIG.maxShakeIntensity, 6);

            const kgLost = Math.floor(CONFIG.shrinkPerHealthy * CONFIG.kgPerScale);
            spawnParticles(item.x, item.y, item.emoji, '#FF003C', 5);
            spawnTextParticle(item.x, item.y - 20, `-${kgLost} kg`, '#FF003C');

            if (gameState.missed >= CONFIG.obesityMissLimit) triggerGameOver();
        } else {
            // Хорошо в Obesity
            gameState.combo++;
            if (gameState.combo > gameState.maxCombo) gameState.maxCombo = gameState.combo;
            gameState.playerScale += CONFIG.growthPerCatch;

            const kgGain = Math.floor(CONFIG.growthPerCatch * CONFIG.kgPerScale);
            spawnParticles(item.x, item.y, item.emoji, '#00FF41', 4); // Зеленый текст (успех)
            spawnTextParticle(item.x, item.y - 20, `+${kgGain} kg`, '#00FF41');
        }
    } else {
        if (item.isJunk) {
            // Плохо в Fit
            gameState.strikes++;
            gameState.combo = 0;
            gameState.playerScale += CONFIG.growthPerJunk; 
            gameState.shakeTimer = 0.2;
            gameState.shakeIntensity = Math.min(CONFIG.maxShakeIntensity, 6);

            const kgGain = Math.floor(CONFIG.growthPerJunk * CONFIG.kgPerScale);
            spawnParticles(item.x, item.y, item.emoji, '#FF003C', 5);
            spawnTextParticle(item.x, item.y - 20, `+${kgGain} kg`, '#FF003C'); // Красный текст (провал)

            if (gameState.strikes >= CONFIG.fitStrikesMax) triggerGameOver();
        } else {
            // Хорошо в Fit
            gameState.combo++;
            if (gameState.combo > gameState.maxCombo) gameState.maxCombo = gameState.combo;
            
            // ВОТ ТУТ 0.5 вместо 0.8, чтобы вес падал до 50 кг!
            gameState.playerScale = Math.max(0.5, gameState.playerScale - CONFIG.shrinkPerHealthy);

            const kgLost = Math.floor(CONFIG.shrinkPerHealthy * CONFIG.kgPerScale);
            spawnParticles(item.x, item.y, item.emoji, '#00FF41', 3);
            spawnTextParticle(item.x, item.y - 20, `-${kgLost} kg`, '#00FF41'); // Зеленый текст (успех)
        }
    }
}

function handleMiss(item, isObesity, playerX) {
    if (item.type !== 'food') return;

    if (isObesity) {
        if (item.isJunk) {
            gameState.score = Math.max(0, gameState.score - 3);
            gameState.combo = 0;
        }
    } else {
        if (!item.isJunk) {
            gameState.score = Math.max(0, gameState.score - 3);
            gameState.combo = 0;
        }
    }
}

function triggerGameOver() {
    gameState.current = STATE.GAMEOVER;
    gameState.shakeTimer = gameState.killedByBomb ? 0.8 : CONFIG.gameOverShakeDuration;
    gameState.shakeIntensity = gameState.killedByBomb ? 12 : CONFIG.gameOverShakeIntensity;
    
    // ОТПРАВКА МОНЕТ НА АККАУНТ (один раз)
    if (!gameState.coinsSaved && gameState.coins > 0) {
        window.parent.postMessage({ type: 'ADD_BALANCE', amount: gameState.coins }, '*');
        gameState.coinsSaved = true;
    }
}

function spawnParticles(x, y, emoji, color, count) {
    for (let i = 0; i < count; i++) {
        gameState.particles.push({
            x: x + (Math.random() - 0.5) * 30, y: y + (Math.random() - 0.5) * 20,
            vx: (Math.random() - 0.5) * 100, vy: -50 - Math.random() * 80,
            emoji: emoji, size: 14 + Math.random() * 10, life: 1.0, decay: 1.5 + Math.random() * 0.5
        });
    }
}

function spawnTextParticle(x, y, text, color) {
    gameState.particles.push({
        x: x, y: y, vx: 0, vy: -60,
        emoji: text, size: 20, life: 1.0, decay: 1.2, // Увеличен размер текста
        isText: true, color: color
    });
}

function updateParticles(dt) {
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        const p = gameState.particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 150 * dt;
        p.life -= p.decay * dt;
        if (p.life <= 0) gameState.particles.splice(i, 1);
    }
}
