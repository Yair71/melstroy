// murino-run/assets.js
import { CONFIG } from './config.js';

// Here we store everything globally so other files can easily grab them
export const ASSETS = {
    models: {},
    textures: {},
    videoElement: null
};

// Helper function to load a GLTF model and automatically prepare its animation
function loadModel(url, name, loopType = THREE.LoopRepeat) {
    return new Promise((resolve, reject) => {
        const loader = new THREE.GLTFLoader();
        // Assuming draco loader was initialized globally in your index.html
        const dracoLoader = new THREE.DRACOLoader();
        dracoLoader.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/libs/draco/');
        loader.setDRACOLoader(dracoLoader);

        loader.load(url, (gltf) => {
            const scene = gltf.scene;
            let mixer = null;
            let action = null;

            // If the model has baked animations, set up its own mixer
            if (gltf.animations && gltf.animations.length > 0) {
                mixer = new THREE.AnimationMixer(scene);
                action = mixer.clipAction(gltf.animations[0]);
                action.setLoop(loopType);
                action.clampWhenFinished = (loopType === THREE.LoopOnce);
                action.play();
            }

            ASSETS.models[name] = { scene, mixer, action };
            resolve();
        }, undefined, reject);
    });
}

// Helper for textures
function loadTexture(url, name) {
    return new Promise((resolve, reject) => {
        const loader = new THREE.TextureLoader();
        loader.load(url, (tex) => {
            ASSETS.textures[name] = tex;
            resolve();
        }, undefined, reject);
    });
}

export async function preloadAllAssets() {
    console.log("Loading assets...");
    
    // 1. Load textures (you can replace these paths with your actual murino textures later)
    const texturePromises = [
        loadTexture('./assets/fog.png', 'fog')
        // Add road and building textures here if you have them, e.g.:
        // loadTexture('./assets/road1.png', 'road')
    ];

    // 2. Load all our independent models! No more bone sharing!
    const modelPromises = [
        loadModel(CONFIG.ASSETS.MODELS.RUN, 'run', THREE.LoopRepeat),
        loadModel(CONFIG.ASSETS.MODELS.JUMP, 'jump', THREE.LoopOnce),
        loadModel(CONFIG.ASSETS.MODELS.FALL, 'fall', THREE.LoopOnce),
        loadModel(CONFIG.ASSETS.MODELS.DANCE1, 'dance1', THREE.LoopRepeat),
        loadModel(CONFIG.ASSETS.MODELS.DANCE2, 'dance2', THREE.LoopRepeat)
    ];

    // 3. Setup meme video for the face
    ASSETS.videoElement = document.createElement('video');
    ASSETS.videoElement.src = CONFIG.ASSETS.MEDIA.MEL_FACE_VIDEO;
    ASSETS.videoElement.playsInline = true;
    ASSETS.videoElement.loop = true;
    ASSETS.videoElement.style.display = 'none';
    document.body.appendChild(ASSETS.videoElement);

    await Promise.all([...texturePromises, ...modelPromises]);
    console.log("All assets loaded successfully!");
}
