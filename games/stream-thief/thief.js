import { loadedAssets } from './assets.js';
import { CONFIG, PHASE } from './config.js';
import { gameState } from './gameState.js';
import { lootItems, collectLoot } from './world.js';
export let handGroup; let sceneRef;
export function initThief(scene) {
    sceneRef = scene; handGroup = new THREE.Group();
    const g = loadedAssets.models['hand'];
    if (g) {
        const h = g.scene; h.scale.setScalar(CONFIG.handScale);
        const b = new THREE.Box3().setFromObject(h); const c = b.getCenter(new THREE.Vector3());
        h.position.set(-c.x,-c.y,-c.z); handGroup.add(h);
        if (CONFIG.debug) { const s = b.getSize(new THREE.Vector3()); console.log(`Hand size: (${s.x.toFixed(2)}, ${s.y.toFixed(2)}, ${s.z.toFixed(2)})`); }
    }
    handGroup.position.set(gameState.handX, gameState.handY, gameState.handZ); scene.add(handGroup);
}
export function updateThief(dt) {
    if (!handGroup) return;
    switch (gameState.phase) {
        case PHASE.AIM_X:
            gameState.handX += CONFIG.speedX * gameState.dirX * dt;
            if (gameState.handX > CONFIG.limitX) { gameState.handX = CONFIG.limitX; gameState.dirX = -1; }
            if (gameState.handX < -CONFIG.limitX) { gameState.handX = -CONFIG.limitX; gameState.dirX = 1; }
            break;
        case PHASE.AIM_Y:
            gameState.handY += CONFIG.speedY * gameState.dirY * dt;
            if (gameState.handY > CONFIG.limitYMax) { gameState.handY = CONFIG.limitYMax; gameState.dirY = -1; }
            if (gameState.handY < CONFIG.limitYMin) { gameState.handY = CONFIG.limitYMin; gameState.dirY = 1; }
            break;
        case PHASE.MOVE_Z:
            if (gameState.isHolding) { gameState.handZ -= CONFIG.speedZ * dt; if (gameState.handZ < CONFIG.limitZMin) gameState.handZ = CONFIG.limitZMin; checkLootGrab(); }
            break;
        case PHASE.RETURN:
            gameState.handX += (CONFIG.handStartX - gameState.handX) * CONFIG.returnSpeed * dt;
            gameState.handY += (CONFIG.handStartY - gameState.handY) * CONFIG.returnSpeed * dt;
            gameState.handZ += (CONFIG.handStartZ - gameState.handZ) * CONFIG.returnSpeed * dt;
            if (Math.abs(gameState.handZ - CONFIG.handStartZ) < 0.15) { gameState.handX=CONFIG.handStartX; gameState.handY=CONFIG.handStartY; gameState.handZ=CONFIG.handStartZ; gameState.phase=PHASE.AIM_X; }
            break;
    }
    handGroup.position.set(gameState.handX, gameState.handY, gameState.handZ);
}
function checkLootGrab() {
    const hp = new THREE.Vector3(gameState.handX, gameState.handY, gameState.handZ);
    for (const l of lootItems) { if (l.userData.collected) continue; const lp = new THREE.Vector3(); l.getWorldPosition(lp); if (hp.distanceTo(lp) < 1.5) { collectLoot(l, sceneRef); break; } }
}
