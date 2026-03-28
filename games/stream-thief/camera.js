// ============================================================
// camera.js — Fixed gameplay camera (fly mode REMOVED)
// Uses the exact coordinates + yaw/pitch from your fly camera
//
// Your fly camera data:
//   POS(-4.79, 12.18, -34.58)
//   YAW=179.2°  PITCH=0°
//
// YAW=179.2° means the camera was looking in the +Z direction
// (back toward the room). We reproduce this with quaternion.
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

    // Position from your fly camera
    camera.position.set(
        CONFIG.cameraPosition.x,
        CONFIG.cameraPosition.y,
        CONFIG.cameraPosition.z
    );

    // Apply the exact yaw/pitch as quaternion (same math the fly camera used)
    const yaw   = CONFIG.cameraYaw * Math.PI / 180;
    const pitch = CONFIG.cameraPitch * Math.PI / 180;
    camera.quaternion.setFromEuler(new THREE.Euler(pitch, yaw, 0, 'YXZ'));

    scene.add(camera);
    return camera;
}

export function updateCamera(deltaTime) {
    // Fixed camera — nothing to update
}

export function resizeCamera() {
    if (camera) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    }
}

export function cleanupCamera() {
    // No event listeners to clean
}

export function getCamera() {
    return camera;
}
