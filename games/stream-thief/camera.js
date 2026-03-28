// ============================================================
// camera.js — Fixed gameplay camera (fly mode REMOVED)
// Uses the exact coordinates you captured with the fly camera
// ============================================================
import { CONFIG } from './config.js';

let camera;

export function initCamera(scene) {
    camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.1,
        500
    );

    camera.position.set(
        CONFIG.cameraPosition.x,
        CONFIG.cameraPosition.y,
        CONFIG.cameraPosition.z
    );
    camera.lookAt(
        CONFIG.cameraLookAt.x,
        CONFIG.cameraLookAt.y,
        CONFIG.cameraLookAt.z
    );

    scene.add(camera);
    return camera;
}

export function updateCamera(deltaTime) {
    // Fixed camera — nothing to update
    // Could add subtle breathing/sway effect here later
}

export function resizeCamera() {
    if (camera) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    }
}

export function cleanupCamera() {
    // Nothing to clean up — no event listeners
}

export function getCamera() {
    return camera;
}
