// ============================================================
// logic.js — Core game loop logic (spawning, movement, collision)
// ============================================================
import { CONFIG, MODE, STATE, FOODS } from './config.js';
import { gameState } from './gameState.js';

export function updateGame(dt) {
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

    // ===== SCREEN SHAKE =====
    if (gameState.shakeTimer > 0) {
        gameState.shakeTimer -= dt;
    }

    // ===== PASSIVE SCORE (survival time) =====
    gameState.score += dt * 2;
}

function updatePlayerMovement(dt) {
    const speed = CONFIG.playerSpeed;
    const halfW = (CONFIG.playerWidth * gameState.playerScale) / 2;

    // Touch/mouse: move toward touch position
    if (gameState.touchX !== null) {
        const diff = gameState.touchX - gameState.playerX;
        const moveAmount = Math.sign(diff) * Math.min(Math.abs(diff), speed * dt * 1.5);
        gameState.playerX += moveAmount;
    }

    // Keyboard
    if (gameState.moveLeft) {
        gameState.playerX -= speed * dt;
    }
    if (gameState.moveRight) {
        gameState.playerX += speed * dt;
    }

    // Clamp
    gameState.playerX = Math.max(halfW + 5, Math.min(CONFIG.canvasWidth - halfW - 5, gameState.playerX));
}

function spawnItem() {
    const isObesity = gameState.mode === MODE.OBESITY;

    // In obesity mode: 60% junk, 40% healthy
    // In fit mode: 50/50
    const junkChance = isObesity ? 0.6 : 0.5;
    const isJunk = Math.random() < junkChance;

    const pool = isJunk ? FOODS.junk : FOODS.healthy;
    const food = pool[Math.floor(Math.random() * pool.length)];

    // Random X position (with some padding)
    const pad = CONFIG.itemSize;
    const x = pad + Math.random() * (CONFIG.canvasWidth - pad * 2);

    gameState.items.push({
        x: x,
        y: -CONFIG.itemSize,
        emoji: food.emoji,
        name: food.name,
        isJunk: isJunk,
        phase: Math.random() * Math.PI * 2,
        speed: gameState.currentFallSpeed * (0.85 + Math.random() * 0.3)
    });
}

function updateItems(dt) {
    const playerX = gameState.playerX;
    const playerY = CONFIG.playerY;
    const playerHalfW = (CONFIG.playerWidth * gameState.playerScale) / 2;
    const playerHalfH = (CONFIG.playerHeight * gameState.playerScale) / 2;
    const isObesity = gameState.mode === MODE.OBESITY;

    for (let i = gameState.items.length - 1; i >= 0; i--) {
        const item = gameState.items[i];

        // Move down
        item.y += item.speed * dt;

        // Collision check (box overlap)
        const dx = Math.abs(item.x - playerX);
        const dy = Math.abs(item.y - playerY);
        const catchX = playerHalfW + CONFIG.itemSize * 0.3;
        const catchY = playerHalfH + CONFIG.itemSize * 0.3;

        if (dx < catchX && dy < catchY) {
            // CAUGHT!
            handleCatch(item, isObesity);
            gameState.items.splice(i, 1);
            continue;
        }

        // Missed (fell below screen)
        if (item.y > CONFIG.canvasHeight + CONFIG.itemSize) {
            handleMiss(item, isObesity);
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

        // Particles — happy burst
        spawnParticles(item.x, item.y, item.emoji, '#FFD700', 5);
        spawnTextParticle(item.x, item.y - 20, `+${Math.floor(points)}`, '#FFD700');

    } else {
        // FIT MODE
        if (item.isJunk) {
            // BAD: caught junk
            gameState.strikes++;
            gameState.combo = 0;
            gameState.playerScale += CONFIG.growthPerJunk;
            gameState.shakeTimer = 0.3;
            gameState.shakeIntensity = 10;

            spawnParticles(item.x, item.y, item.emoji, '#FF003C', 6);
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

            // Slight shrink toward base
            gameState.playerScale = Math.max(1.0, gameState.playerScale - CONFIG.shrinkPerHealthy);

            spawnParticles(item.x, item.y, item.emoji, '#00FF41', 4);
            spawnTextParticle(item.x, item.y - 20, `+${Math.floor(points)}`, '#00FF41');
        }
    }
}

function handleMiss(item, isObesity) {
    if (isObesity) {
        // Missed item in obesity = bad
        gameState.missed++;
        gameState.combo = 0;
        gameState.shakeTimer = 0.2;
        gameState.shakeIntensity = 6;

        if (gameState.missed >= CONFIG.obesityMissLimit) {
            triggerGameOver();
        }
    } else {
        // Fit mode: missing junk = good (dodged it), missing healthy = slight penalty
        if (!item.isJunk) {
            // Missed healthy food — small score penalty
            gameState.score = Math.max(0, gameState.score - 5);
            gameState.combo = 0;
        }
        // Missing junk = no penalty (you dodged it!)
    }
}

function triggerGameOver() {
    gameState.current = STATE.GAMEOVER;
    gameState.shakeTimer = 0.5;
    gameState.shakeIntensity = 15;
}

// ===== PARTICLES =====
function spawnParticles(x, y, emoji, color, count) {
    for (let i = 0; i < count; i++) {
        gameState.particles.push({
            x: x + (Math.random() - 0.5) * 30,
            y: y + (Math.random() - 0.5) * 20,
            vx: (Math.random() - 0.5) * 120,
            vy: -60 - Math.random() * 100,
            emoji: emoji,
            size: 14 + Math.random() * 12,
            life: 1.0,
            decay: 1.2 + Math.random() * 0.8
        });
    }
}

function spawnTextParticle(x, y, text, color) {
    gameState.particles.push({
        x: x,
        y: y,
        vx: 0,
        vy: -80,
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
        p.vy += 200 * dt; // gravity
        p.life -= p.decay * dt;

        if (p.life <= 0) {
            gameState.particles.splice(i, 1);
        }
    }
}
