// ============================================================
// camera.js — Fly camera (WASD/QE) + K to dump coordinates
// ============================================================
import { DEBUG, CONFIG } from './config.js';

let camera;

// Fly-cam state
const fly = {
    yaw: 0,
    pitch: -0.2,
    keys: {},
    isLocked: false,
    speed: CONFIG.flySpeed,
    handlers: []
};

// Coordinate log overlay
let coordOverlay = null;
let savedCoords = [];

export function initCamera(scene, rendererDom) {
    camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.1,
        500
    );

    if (DEBUG) {
        // Start near hand but higher and further back so you can see everything
        camera.position.set(
            CONFIG.handStartX,
            CONFIG.handStartY + 5,    // higher
            CONFIG.handStartZ + 10    // further back
        );
        fly.yaw = Math.PI;    // face forward (toward -Z)
        fly.pitch = -0.2;
        setupFlyCam(rendererDom);
        createCoordOverlay(rendererDom.parentElement);
    } else {
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
    }

    scene.add(camera);
    return camera;
}

function setupFlyCam(canvas) {
    const onClick = () => {
        if (!fly.isLocked) canvas.requestPointerLock();
    };
    canvas.addEventListener('click', onClick);

    const onLockChange = () => {
        fly.isLocked = (document.pointerLockElement === canvas);
    };
    document.addEventListener('pointerlockchange', onLockChange);

    const onMouseMove = (e) => {
        if (!fly.isLocked) return;
        fly.yaw   -= e.movementX * 0.002;
        fly.pitch -= e.movementY * 0.002;
        fly.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, fly.pitch));
    };
    document.addEventListener('mousemove', onMouseMove);

    const onKeyDown = (e) => {
        fly.keys[e.code] = true;
        if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
            fly.speed = CONFIG.flySpeedFast;
        }
        if (e.code === 'KeyK') {
            dumpCoordinates();
        }
    };
    const onKeyUp = (e) => {
        fly.keys[e.code] = false;
        if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
            fly.speed = CONFIG.flySpeed;
        }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    const onWheel = (e) => {
        fly.speed = Math.max(1, Math.min(50, fly.speed + (e.deltaY > 0 ? -1 : 1)));
    };
    canvas.addEventListener('wheel', onWheel, { passive: true });

    fly.handlers = [
        () => canvas.removeEventListener('click', onClick),
        () => document.removeEventListener('pointerlockchange', onLockChange),
        () => document.removeEventListener('mousemove', onMouseMove),
        () => window.removeEventListener('keydown', onKeyDown),
        () => window.removeEventListener('keyup', onKeyUp),
        () => canvas.removeEventListener('wheel', onWheel)
    ];
}

function createCoordOverlay(container) {
    coordOverlay = document.createElement('div');
    coordOverlay.id = 'coordOverlay';
    coordOverlay.style.cssText = `
        position: absolute; bottom: 10px; left: 10px; z-index: 100;
        color: #0f0; font-family: monospace; font-size: 13px;
        background: rgba(0,0,0,0.85); padding: 12px 16px;
        border-radius: 8px; pointer-events: none; line-height: 1.7;
        max-height: 50vh; overflow-y: auto; min-width: 350px;
    `;
    coordOverlay.innerHTML = buildOverlayHTML();
    container.appendChild(coordOverlay);
}

function buildOverlayHTML() {
    const p = camera ? camera.position : { x: 0, y: 0, z: 0 };
    let html = `
        <div style="color:#FFD700; font-weight:bold; margin-bottom:6px;">🔧 FLY CAMERA DEBUG</div>
        <div style="border-top:1px solid #333; margin:4px 0;"></div>
        <div><span style="color:#ff0">CLICK</span> = lock mouse</div>
        <div><span style="color:#ff0">WASD</span> = move</div>
        <div><span style="color:#ff0">E/Space</span> = up &nbsp; <span style="color:#ff0">Q/Ctrl</span> = down</div>
        <div><span style="color:#ff0">Shift</span> = fast &nbsp; <span style="color:#ff0">Scroll</span> = speed</div>
        <div><span style="color:#FF003C; font-weight:bold;">K</span> = SAVE COORDINATES</div>
        <div style="border-top:1px solid #333; margin:6px 0;"></div>
        <div>📷 <span style="color:#0ff">pos(${p.x.toFixed(2)}, ${p.y.toFixed(2)}, ${p.z.toFixed(2)})</span></div>
        <div>🎯 yaw=${(fly.yaw * 180 / Math.PI).toFixed(1)}° pitch=${(fly.pitch * 180 / Math.PI).toFixed(1)}°</div>
        <div>⚡ speed=${fly.speed.toFixed(1)}</div>
    `;

    if (savedCoords.length > 0) {
        html += `<div style="border-top:1px solid #333; margin:6px 0;"></div>`;
        html += `<div style="color:#FFD700;">📌 SAVED (${savedCoords.length}):</div>`;
        for (let i = 0; i < savedCoords.length; i++) {
            const c = savedCoords[i];
            html += `<div style="color:#8f8;">#${i + 1}: (${c.x}, ${c.y}, ${c.z})</div>`;
        }
    }

    return html;
}

function dumpCoordinates() {
    if (!camera) return;
    const p = camera.position;
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    const lookAt = p.clone().add(dir.multiplyScalar(10));

    const coord = {
        x: p.x.toFixed(2),
        y: p.y.toFixed(2),
        z: p.z.toFixed(2)
    };
    savedCoords.push(coord);

    console.log(`%c📌 SAVED COORD #${savedCoords.length}`, 'color: #FFD700; font-size: 14px; font-weight: bold;');
    console.log(`   Position: (${coord.x}, ${coord.y}, ${coord.z})`);
    console.log(`   LookAt:   (${lookAt.x.toFixed(2)}, ${lookAt.y.toFixed(2)}, ${lookAt.z.toFixed(2)})`);
    console.log(`   Yaw: ${(fly.yaw * 180 / Math.PI).toFixed(1)}°  Pitch: ${(fly.pitch * 180 / Math.PI).toFixed(1)}°`);
}

export function updateCamera(deltaTime) {
    if (!camera || !DEBUG) return;

    const forward = new THREE.Vector3(
        Math.sin(fly.yaw) * Math.cos(fly.pitch),
        Math.sin(fly.pitch),
        Math.cos(fly.yaw) * Math.cos(fly.pitch)
    );
    const right = new THREE.Vector3(
        Math.sin(fly.yaw - Math.PI / 2),
        0,
        Math.cos(fly.yaw - Math.PI / 2)
    );
    const up = new THREE.Vector3(0, 1, 0);

    const ms = fly.speed * deltaTime;

    if (fly.keys['KeyW']) camera.position.addScaledVector(forward, ms);
    if (fly.keys['KeyS']) camera.position.addScaledVector(forward, -ms);
    if (fly.keys['KeyA']) camera.position.addScaledVector(right, -ms);
    if (fly.keys['KeyD']) camera.position.addScaledVector(right, ms);
    if (fly.keys['KeyE'] || fly.keys['Space']) camera.position.addScaledVector(up, ms);
    if (fly.keys['KeyQ'] || fly.keys['ControlLeft']) camera.position.addScaledVector(up, -ms);

    const euler = new THREE.Euler(fly.pitch, fly.yaw, 0, 'YXZ');
    camera.quaternion.setFromEuler(euler);

    if (coordOverlay) {
        coordOverlay.innerHTML = buildOverlayHTML();
    }
}

export function resizeCamera() {
    if (camera) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    }
}

export function cleanupCamera() {
    for (const fn of fly.handlers) fn();
    fly.handlers = [];
    if (coordOverlay && coordOverlay.parentElement) {
        coordOverlay.parentElement.removeChild(coordOverlay);
    }
}

export function getCamera() {
    return camera;
}
