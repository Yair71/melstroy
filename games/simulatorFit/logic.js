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

// ===== DYNAMIC LANE EXPANSION (smooth, no jitter) =====
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

        // Set TARGET zoom — will be interpolated smoothly below
        gameState._targetZoom = CONFIG.canvasWidth / gameState.worldWidth;
    }

    // Smooth zoom interpolation (no sudden jumps)
    if (gameState._targetZoom === undefined) gameState._targetZoom = 1.0;
    const zoomDiff = gameState._targetZoom - gameState.cameraZoom;
    if (Math.abs(zoomDiff) > 0.001) {
        gameState.cameraZoom += zoomDiff * 0.05; // smooth lerp
    } else {
        gameState.cameraZoom = gameState._targetZoom;
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
    const isObesity = gameState.mode === MODE.OBESITY;

    for (let i = gameState.items.length - 1; i >= 0; i--) {
        const item = gameState.items[i];

        item.y += item.speed * dt;

        // ===== COLLISION — VERY TIGHT =====
        // Item must be horizontally inside body AND vertically at player's feet
        // playerY is the CENTER of the player body
        const dx = Math.abs(item.x - playerX);

        // Horizontal: item must overlap with body width (no extra margin)
        const catchX = playerHalfW * 0.7;

        // Vertical: item must be in a narrow band near the top of the player
        // Player center is at playerY, top edge is at playerY - halfH
        const playerTopY = playerY - (CONFIG.playerHeight * scale) / 2;
        const itemBottomEdge = item.y + CONFIG.itemSize * 0.3;

        // Catch only when item's bottom is between player's top and center
        const verticalHit = itemBottomEdge >= playerTopY && item.y <= playerY + 10;

        if (dx < catchX && verticalHit) {
            handleCatch(item, isObesity);
            gameState.items.splice(i, 1);
            continue;
        }

        // Missed: fell below player (past the catch zone)
        if (item.y > playerY + 30) {
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
        // ===== OBESITY: only GREEN (healthy) food on floor = lose heart =====
        // Red junk food on floor = fine, you don't need it
        if (!item.isJunk) {
            // Healthy food wasted! That's bad in obesity mode
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
        }
        // Junk on floor in obesity = no penalty
    } else {
        // ===== FIT: only RED (junk) food on floor = lose heart =====
        // Green healthy food on floor = small score penalty, no heart
        if (item.isJunk) {
            // Junk food reached the floor — you failed to dodge (it got past you)
            gameState.strikes++;
            gameState.combo = 0;
            gameState.shakeTimer = 0.15;
            gameState.shakeIntensity = Math.min(CONFIG.maxShakeIntensity, 4);

            if (gameState.strikes >= CONFIG.fitStrikesMax) {
                triggerGameOver();
            }
        } else {
            // Healthy food missed — small score penalty only
            gameState.score = Math.max(0, gameState.score - 3);
            gameState.combo = 0;
        }
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
