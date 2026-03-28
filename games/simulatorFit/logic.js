// ============================================================
// logic.js — Core game loop logic (FIXED)
//
// BUG FIXES:
// 1. Shake timer now decays in ALL states (was only PLAYING)
// 2. Items spawn in LANES so player can actually reach them
// 3. Catch collision box is much bigger and scales with player
// 4. Obesity miss counter only increments for items that were
//    reasonably close to the player's lane (not across screen)
// 5. Shake intensity capped by config values
// ============================================================
import { CONFIG, MODE, STATE, FOODS } from './config.js';
import { gameState } from './gameState.js';

// Called EVERY frame from index.js (not just during PLAYING)
export function updateGame(dt) {
    // ===== SHAKE ALWAYS DECAYS (fixes frozen shake on game over) =====
    if (gameState.shakeTimer > 0) {
        gameState.shakeTimer -= dt;
        if (gameState.shakeTimer <= 0) {
            gameState.shakeTimer = 0;
            gameState.shakeIntensity = 0;
        }
    }

    // Only run game logic during PLAYING
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

    // ===== PASSIVE SCORE (survival time) =====
    gameState.score += dt * 2;
}

function updatePlayerMovement(dt) {
    const speed = CONFIG.playerSpeed;
    const halfW = (CONFIG.playerWidth * gameState.playerScale) / 2;

    // Touch/mouse drag: snap toward touch position (fast, responsive)
    if (gameState.touchActive && gameState.touchX !== null) {
        const diff = gameState.touchX - gameState.playerX;
        // Move directly toward touch, speed proportional to distance
        const moveAmount = diff * Math.min(1, dt * 12);
        gameState.playerX += moveAmount;
    }

    // Keyboard
    if (gameState.moveLeft) {
        gameState.playerX -= speed * dt;
    }
    if (gameState.moveRight) {
        gameState.playerX += speed * dt;
    }

    // Clamp to screen edges
    gameState.playerX = Math.max(halfW + 5, Math.min(CONFIG.canvasWidth - halfW - 5, gameState.playerX));
}

function spawnItem() {
    const isObesity = gameState.mode === MODE.OBESITY;

    // In obesity mode: 55% junk, 45% healthy
    // In fit mode: 50/50
    const junkChance = isObesity ? 0.55 : 0.5;
    const isJunk = Math.random() < junkChance;

    const pool = isJunk ? FOODS.junk : FOODS.healthy;
    const food = pool[Math.floor(Math.random() * pool.length)];

    // ===== LANE-BASED SPAWNING (instead of random X) =====
    // This ensures items land in predictable columns the player can reach
    const laneCount = CONFIG.lanes;
    const pad = CONFIG.itemSize * 0.8;
    const usableW = CONFIG.canvasWidth - pad * 2;
    const laneWidth = usableW / laneCount;

    const lane = Math.floor(Math.random() * laneCount);
    // Center of lane + small random offset for variety
    const x = pad + lane * laneWidth + laneWidth / 2 + (Math.random() - 0.5) * laneWidth * 0.4;

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

        // Move down
        item.y += item.speed * dt;

        // ===== COLLISION: generous catch zone =====
        // The catch box grows with the player scale (fatter = bigger catch area)
        const dx = Math.abs(item.x - playerX);
        const dy = Math.abs(item.y - playerY);
        const catchX = playerHalfW + CONFIG.itemSize * 0.4;
        const catchY = playerHalfH + CONFIG.itemSize * 0.5;

        if (dx < catchX && dy < catchY) {
            handleCatch(item, isObesity);
            gameState.items.splice(i, 1);
            continue;
        }

        // ===== MISSED: fell below screen =====
        if (item.y > CONFIG.canvasHeight + CONFIG.itemSize) {
            handleMiss(item, isObesity, playerX);
            gameState.items.splice(i, 1);
        }
    }
}

function handleCatch(item, isObesity) {
    if (isObesity) {
        // OBESITY: Catch everything = good
        gameState.combo++;
        if (gameState.combo > gameState.maxCombo) gameState.maxCombo = gameState.combo;

        const comboMult = Math.min(gameState.combo, 10);
        const points = (item.isJunk ? CONFIG.junkPoints : CONFIG.healthyPoints) * comboMult;
        gameState.score += points;

        // Grow!
        gameState.playerScale += CONFIG.growthPerCatch;

        // Particles
        spawnParticles(item.x, item.y, item.emoji, '#FFD700', 4);
        spawnTextParticle(item.x, item.y - 20, `+${Math.floor(points)}`, '#FFD700');

    } else {
        // FIT MODE
        if (item.isJunk) {
            // BAD: caught junk
            gameState.strikes++;
            gameState.combo = 0;
            gameState.playerScale += CONFIG.growthPerJunk;
            gameState.shakeTimer = 0.2;
            gameState.shakeIntensity = Math.min(CONFIG.maxShakeIntensity, 6);

            spawnParticles(item.x, item.y, item.emoji, '#FF003C', 5);
            spawnTextParticle(item.x, item.y - 20, '💀 JUNK!', '#FF003C');

            if (gameState.strikes >= CONFIG.fitStrikesMax) {
                triggerGameOver();
            }
        } else {
            // GOOD: caught healthy
            gameState.combo++;
            if (gameState.combo > gameState.maxCombo) gameState.maxCombo = gameState.combo;

            const comboMult = Math.min(gameState.combo, 10);
            const points = CONFIG.healthyPoints * comboMult;
            gameState.score += points;

            gameState.playerScale = Math.max(1.0, gameState.playerScale - CONFIG.shrinkPerHealthy);

            spawnParticles(item.x, item.y, item.emoji, '#00FF41', 3);
            spawnTextParticle(item.x, item.y - 20, `+${Math.floor(points)}`, '#00FF41');
        }
    }
}

function handleMiss(item, isObesity, playerX) {
    if (isObesity) {
        // ===== FIX: Only count miss if item was reasonably reachable =====
        // If item was on the complete opposite side of the screen, don't punish
        const distFromPlayer = Math.abs(item.x - playerX);
        const reachable = CONFIG.canvasWidth * 0.6; // within 60% of screen width

        if (distFromPlayer < reachable) {
            gameState.missed++;
            gameState.combo = 0;

            // Gentle shake (not intense)
            gameState.shakeTimer = 0.15;
            gameState.shakeIntensity = Math.min(CONFIG.maxShakeIntensity, 4);

            if (gameState.missed >= CONFIG.obesityMissLimit) {
                triggerGameOver();
            }
        }
        // Far away items are silently removed — not the player's fault
    } else {
        // Fit mode: missing junk = good (dodged it), missing healthy = small penalty
        if (!item.isJunk) {
            gameState.score = Math.max(0, gameState.score - 3);
            gameState.combo = 0;
        }
    }
}

function triggerGameOver() {
    gameState.current = STATE.GAMEOVER;
    // Gentle game over shake (not insane)
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
        x: x,
        y: y,
        vx: 0,
        vy: -60,
        emoji: text,
        size: 18,
        life: 1.0,
        decay: 1.5,
        isText: true,
        color: color
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
