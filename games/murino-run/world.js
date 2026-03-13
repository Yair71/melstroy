// murino-run/world.js
import { CONFIG } from './config.js';

export let scene, camera, renderer;
export let dummyCamera; // Used for smooth camera transitions (like the death sequence)

// To keep track of environment objects that need to move/loop
const roadMeshes = [];
const ROAD_LEN = 120;
const ROAD_COUNT = 6;

export function initWorld(container) {
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene Setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);
    scene.fog = new THREE.Fog(0x1a1a1a, 10, 80);

    // 2. Camera Setup
    camera = new THREE.PerspectiveCamera(CONFIG.CAMERA.FOV, width / height, 0.1, 1000);
    dummyCamera = new THREE.PerspectiveCamera(CONFIG.CAMERA.FOV, width / height, 0.1, 1000);

    // 3. Renderer Setup
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, -10);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // 5. Generate Murino Roads
    generateRoads();

    // Handle window resize
    window.addEventListener('resize', () => {
        const newWidth = container.clientWidth || window.innerWidth;
        const newHeight = container.clientHeight || window.innerHeight;
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        dummyCamera.aspect = newWidth / newHeight;
        dummyCamera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
    });
}

function generateRoads() {
    // Simple dark gray road for now (you can apply textures from ASSETS later)
    const roadGeo = new THREE.PlaneGeometry(CONFIG.GAME.LANE_WIDTH * 4, ROAD_LEN);
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x333333 });

    for (let i = 0; i < ROAD_COUNT; i++) {
        const road = new THREE.Mesh(roadGeo, roadMat);
        road.rotation.x = -Math.PI / 2;
        road.position.z = -i * ROAD_LEN;
        road.receiveShadow = true;
        scene.add(road);
        roadMeshes.push(road);
    }
}

// Called every frame to make the world feel like it's moving
export function updateWorld(playerZ) {
    // Road recycling (infinite loop without holes)
    let minZ = Infinity;
    for (const r of roadMeshes) {
        minZ = Math.min(minZ, r.position.z);
    }

    for (const r of roadMeshes) {
        // If the road piece is behind the camera (which follows the player)
        if (r.position.z > camera.position.z + 30) {
            r.position.z = minZ - ROAD_LEN;
            minZ = r.position.z;
        }
    }
}

export function render() {
    renderer.render(scene, camera);
}
