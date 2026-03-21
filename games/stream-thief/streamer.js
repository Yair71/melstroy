// ============================================================
// streamer.js — Mel sits on a chair, swaps animations randomly
// ============================================================
import { CONFIG, DEBUG } from './config.js';
import { loadedAssets } from './assets.js';

const sittingModels = ['sit2', 'sit3', 'sitwait', 'sleepsit'];

let streamerGroup;  // The group that holds the current model
let chairMesh;      // Code-generated chair
let mixer = null;
let currentKey = null;
let swapTimer = 3.0;

export function initStreamer(scene) {
    // ===== CREATE CHAIR (code-generated) =====
    chairMesh = createChair();
    chairMesh.position.set(
        CONFIG.streamerPosition.x,
        CONFIG.streamerPosition.y,
        CONFIG.streamerPosition.z
    );
    scene.add(chairMesh);

    // ===== STREAMER GROUP (sits on top of chair) =====
    streamerGroup = new THREE.Group();
    streamerGroup.position.copy(chairMesh.position);
    scene.add(streamerGroup);

    // Pick a random sitting model to start
    const startModel = sittingModels[Math.floor(Math.random() * sittingModels.length)];
    setModel(startModel);

    if (DEBUG) {
        // Cyan marker at streamer position
        const m = new THREE.Mesh(
            new THREE.SphereGeometry(0.3, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0x00ffff, wireframe: true })
        );
        m.position.copy(streamerGroup.position);
        m.position.y += 1;
        scene.add(m);

        console.log('%c=== CHAIR ===', 'color: #0ff;');
        console.log(`  Position: (${chairMesh.position.x.toFixed(2)}, ${chairMesh.position.y.toFixed(2)}, ${chairMesh.position.z.toFixed(2)})`);
    }
}

function createChair() {
    const chair = new THREE.Group();

    const darkMat = new THREE.MeshStandardMaterial({
        color: 0x222222,
        roughness: 0.6,
        metalness: 0.3
    });

    // Seat
    const seat = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.08, 0.6),
        darkMat
    );
    seat.position.y = 0.5;
    seat.castShadow = true;
    chair.add(seat);

    // Backrest
    const back = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.7, 0.08),
        darkMat
    );
    back.position.set(0, 0.85, -0.26);
    back.castShadow = true;
    chair.add(back);

    // 4 Legs
    const legGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8);
    const offsets = [
        [-0.25, 0.25, -0.25],
        [ 0.25, 0.25, -0.25],
        [-0.25, 0.25,  0.25],
        [ 0.25, 0.25,  0.25]
    ];

    for (const [x, y, z] of offsets) {
        const leg = new THREE.Mesh(legGeo, darkMat);
        leg.position.set(x, y, z);
        leg.castShadow = true;
        chair.add(leg);
    }

    return chair;
}

function setModel(modelKey) {
    if (currentKey === modelKey) return;
    if (mixer) mixer.stopAllAction();

    // Remove old model
    while (streamerGroup.children.length > 0) {
        streamerGroup.remove(streamerGroup.children[0]);
    }

    const gltf = loadedAssets.models[modelKey];
    if (!gltf) return;

    const clone = gltf.scene.clone(true);
    clone.scale.set(1, 1, 1);
    clone.rotation.y = CONFIG.streamerRotationY;

    // Center model horizontally and sit it on the chair seat
    clone.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(clone);
    const center = box.getCenter(new THREE.Vector3());

    clone.position.x -= center.x;
    clone.position.z -= center.z;
    clone.position.y -= box.min.y;  // Bottom of model at group origin
    clone.position.y += 0.5;        // Lift to chair seat height

    streamerGroup.add(clone);
    currentKey = modelKey;

    // Animations
    if (gltf.animations && gltf.animations.length > 0) {
        mixer = new THREE.AnimationMixer(clone);
        const action = mixer.clipAction(gltf.animations[0]);
        action.setLoop(THREE.LoopRepeat);
        action.play();
    } else {
        mixer = null;
    }
}

export function updateStreamer(deltaTime) {
    // Update animation
    if (mixer) mixer.update(deltaTime);

    // Randomly swap between sitting models
    swapTimer -= deltaTime;
    if (swapTimer <= 0) {
        const available = sittingModels.filter(k => k !== currentKey);
        if (available.length > 0) {
            const pick = available[Math.floor(Math.random() * available.length)];
            setModel(pick);
        }
        swapTimer = 3.0 + Math.random() * 5.0;
    }
}
