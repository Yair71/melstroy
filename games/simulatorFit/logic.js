// ============================================================
// logic.js — v3: ALL bugs fixed + dynamic lane expansion
//
// FIT MODE FIXES:
// - Junk food falling to floor does NOT remove hearts (only catching does)
// - Catching healthy food now properly SHRINKS weight (stronger shrink)
// - Collision box tightened so dodging actually works
//
// DYNAMIC LANES:
// - When player width > 35% of play area, world expands (+lanes)
// - Camera zooms out smoothly to show wider field
// - Player can never be wider than 45% of current field
// ============================================================
import { CONFIG, MODE, STATE, FOODS } from './config.js';
import { gameState } from './gameState.js';

export function updateGame(dt) {
    // Shake always decays
    if (gameState.shakeTimer > 0) {
        gameState.shakeTimer -= dt;
        if (gameState.shakeTimer <= 0) {
            gameState.shakeTimer = 0;
            gameState.shakeIntensity = 0;
        }
    }

    if (gameState.current !== STATE.PLAYING) return;

    gameState.elapsed += dt;

    // ===== DIFFICULTY RAMP =====
    gameState.currentFallSpeed = Math.min(
        CONFIG.maxFallSpeed,
        CONFIG.itemFallSpeed + gameState.elapsed * CONFIG.speedIncreaseRate
    );
    gameState.currentSpawnInterval = Math.max(
        CONFIG.minSpawnInterval,
        CONFIG.itemSpawnInterval - gameState.elapsed * CONFIG.spawnDecreaseRate
    );

    // ===== DYNAMIC LANE EXPANSION =====
    updateDynamicLanes();

    // ===== PLAYER MOVEMENT =====
    updatePlayerMovement(dt);

    // ===== SPAWN ITEMS =====
    gameState.spawnTimer -= dt;
    if (gameState.spawnTimer <= 0) {
        spawnItem();
        gameState.spawnTimer = gameState.currentSpawnInterval;
    }

    // ===== UPDATE ITEMS =====
    updateItems(dt);

    // ===== UPDATE PARTICLES =====
    updateParticles(dt);

    // ===== PASSIVE SCORE =====
    gameState.score += dt * 2;
}

// ===== DYNAMIC LANE EXPANSION =====
function updateDynamicLanes() {
    const playerPixelW = CONFIG.playerWidth * gameState.playerScale;
    const currentFieldW = gameState.worldWidth;

    // Check if player is too wide for current field
    const ratio = playerPixelW / currentFieldW;

    if (ratio > CONFIG.expandThreshold && gameState.currentLanes < CONFIG.maxLanes) {
        // Add lanes
        gameState.currentLanes += 1;

        // Expand world width proportionally
        const laneW = CONFIG.canvasWidth / CONFIG.baseLanes;
        gameState.worldWidth = gameState.currentLanes * laneW;

        // Zoom out to fit
        gameState.cameraZoom = CONFIG.canvasWidth / gameState.worldWidth;
    }

    // Cap player scale so they never exceed maxPlayerScaleRatio of current field
    const maxW = currentFieldW * CONFIG.maxPlayerScaleRatio;
    const maxScale = maxW / CONFIG.playerWidth;
    if (gameState.playerScale > maxScale) {
        gameState.playerScale = maxScale;
    }
}

function updatePlayerMovement(dt) {
    const speed = CONFIG.playerSpeed / gameState.cameraZoom; // faster when zoomed out
    const halfW = (CONFIG.playerWidth * gameState.playerScale) / 2;

    if (gameState.touchActive && gameState.touchX !== null) {
        // Convert screen touch to world coords
        const worldTouchX = gameState.touchX / gameState.cameraZoom;
        const diff = worldTouchX - gameState.playerX;
        const moveAmount = diff * Math.min(1, dt * 12);
        gameState.playerX += moveAmount;
    }

    if (gameState.moveLeft) {
        gameState.playerX -= speed * dt;
    }
    if (gameState.moveRight) {
        gameState.playerX += speed * dt;
    }

    // Clamp to world edges
    const worldW = gameState.worldWidth;
    gameState.playerX = Math.max(halfW + 5, Math.min(worldW - halfW - 5, gameState.playerX));
}

function spawnItem() {
    const isObesity = gameState.mode === MODE.OBESITY;
    const junkChance = isObesity ? 0.55 : 0.5;
    const isJunk = Math.random() < junkChance;

    const pool = isJunk ? FOODS.junk : FOODS.healthy;
    const food = pool[Math.floor(Math.random() * pool.length)];

    // Lane-based spawning in CURRENT world width
    const laneCount = gameState.currentLanes;
    const pad = CONFIG.itemSize * 0.8;
    const usableW = gameState.worldWidth - pad * 2;
    const laneWidth = usableW / laneCount;

    const lane = Math.floor(Math.random() * laneCount);
    const x = pad + lane * laneWidth + laneWidth / 2 + (Math.random() - 0.5) * laneWidth * 0.3;

    gameState.items.push({
        x: x,
        y: -CONFIG.itemSize,
        emoji: food.emoji,
        name: food.name,
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
    const playerHalfH = (CONFIG.playerHeight * scale) / 2;
    const isObesity = gameState.mode === MODE.OBESITY;

    for (let i = gameState.items.length - 1; i >= 0; i--) {
        const item = gameState.items[i];

        item.y += item.speed * dt;

        // ===== COLLISION — TIGHTER than before =====
        // Only catch if item center is clearly inside the player body
        const dx = Math.abs(item.x - playerX);
        const dy = Math.abs(item.y - playerY);

        // Catch zone: item must be within the player body + small margin
        const catchX = playerHalfW * 0.85 + CONFIG.itemSize * 0.2;
        const catchY = playerHalfH * 0.7 + CONFIG.itemSize * 0.2;

        if (dx < catchX && dy < catchY) {
            handleCatch(item, isObesity);
            gameState.items.splice(i, 1);
            continue;
        }

        // Missed: fell below screen
        if (item.y > CONFIG.canvasHeight + CONFIG.itemSize) {
            handleMiss(item, isObesity, playerX);
            gameState.items.splice(i, 1);
        }
    }
}

function handleCatch(item, isObesity) {
    if (isObesity) {
        // OBESITY: catch everything = good
        gameState.combo++;
        if (gameState.combo > gameState.maxCombo) gameState.maxCombo = gameState.combo;

        const comboMult = Math.min(gameState.combo, 10);
        const points = (item.isJunk ? CONFIG.junkPoints : CONFIG.healthyPoints) * comboMult;
        gameState.score += points;

        // Grow!
        gameState.playerScale += CONFIG.growthPerCatch;

        spawnParticles(item.x, item.y, item.emoji, '#FFD700', 4);
        spawnTextParticle(item.x, item.y - 20, `+${Math.floor(points)}`, '#FFD700');

    } else {
        // ===== FIT MODE =====
        if (item.isJunk) {
            // BAD: caught junk food
            gameState.strikes++;
            gameState.combo = 0;
            gameState.playerScale += CONFIG.growthPerJunk;  // get fatter
            gameState.shakeTimer = 0.2;
            gameState.shakeIntensity = Math.min(CONFIG.maxShakeIntensity, 6);

            spawnParticles(item.x, item.y, item.emoji, '#FF003C', 5);
            spawnTextParticle(item.x, item.y - 20, '💀 JUNK!', '#FF003C');

            if (gameState.strikes >= CONFIG.fitStrikesMax) {
                triggerGameOver();
            }
        } else {
            // GOOD: caught healthy food
            gameState.combo++;
            if (gameState.combo > gameState.maxCombo) gameState.maxCombo = gameState.combo;

            const comboMult = Math.min(gameState.combo, 10);
            const points = CONFIG.healthyPoints * comboMult;
            gameState.score += points;

            // ===== FIX: Actually shrink! Use 0.8 as floor (was 1.0, meaning no shrink) =====
            gameState.playerScale = Math.max(0.8, gameState.playerScale - CONFIG.shrinkPerHealthy);

            spawnParticles(item.x, item.y, item.emoji, '#00FF41', 3);
            spawnTextParticle(item.x, item.y - 20, `+${Math.floor(points)}`, '#00FF41');
        }
    }
}

function handleMiss(item, isObesity, playerX) {
    if (isObesity) {
        // Only count miss if item was reachable
        const distFromPlayer = Math.abs(item.x - playerX);
        const reachable = gameState.worldWidth * 0.5;

        if (distFromPlayer < reachable) {
            gameState.missed++;
            gameState.combo = 0;
            gameState.shakeTimer = 0.15;
            gameState.shakeIntensity = Math.min(CONFIG.maxShakeIntensity, 4);

            if (gameState.missed >= CONFIG.obesityMissLimit) {
                triggerGameOver();
            }
        }
    } else {
        // ===== FIT MODE: junk falling to floor = GOOD (dodged!) =====
        // ===== Healthy food falling to floor = small score penalty, NO hearts lost =====
        if (!item.isJunk) {
            // Missed healthy food — small penalty
            gameState.score = Math.max(0, gameState.score - 3);
            gameState.combo = 0;
        }
        // Junk missed = nothing happens. This is correct behavior.
        // Hearts (strikes) ONLY change when you CATCH junk.
    }
}

function triggerGameOver() {
    gameState.current = STATE.GAMEOVER;
    gameState.shakeTimer = CONFIG.gameOverShakeDuration;
    gameState.shakeIntensity = CONFIG.gameOverShakeIntensity;
}

// ===== PARTICLES =====
function spawnParticles(x, y, emoji, color, count) {
    for (let i = 0; i < count; i++) {
        gameState.particles.push({
            x: x + (Math.random() - 0.5) * 30,
            y: y + (Math.random() - 0.5) * 20,
            vx: (Math.random() - 0.5) * 100,
            vy: -50 - Math.random() * 80,
            emoji: emoji,
            size: 14 + Math.random() * 10,
            life: 1.0,
            decay: 1.5 + Math.random() * 0.5
        });
    }
}

function spawnTextParticle(x, y, text, color) {
    gameState.particles.push({
        x: x, y: y, vx: 0, vy: -60,
        emoji: text, size: 18, life: 1.0, decay: 1.5,
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
        if (p.life <= 0) {
            gameState.particles.splice(i, 1);
        }
    }
}
