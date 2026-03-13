import { ASSETS } from './config.js';

// Object to store all loaded assets for quick access
export const loadedAssets = {
    models: {},
    textures: {},
    video: null // Video is handled via DOM elements in ui.js
};

export async function loadAssets() {
    // Check if THREE is available
    if (typeof THREE === 'undefined') {
        console.error("THREE.js is not loaded!");
        return false;
    }

    const gltfLoader = new THREE.GLTFLoader();
    const textureLoader = new THREE.TextureLoader();

    // Helper to load GLTF as a Promise
    const loadGLTF = (path) => new Promise((resolve, reject) => {
        gltfLoader.load(path, resolve, undefined, reject);
    });

    // Helper to load Texture as a Promise
    const loadTexture = (path) => new Promise((resolve, reject) => {
        textureLoader.load(path, resolve, undefined, reject);
    });

    try {
        console.log("Starting asset loading...");

        // 1. Load all GLB models (dance1, dance2, run, jump, fall)
        const modelKeys = Object.keys(ASSETS.models);
        for (const key of modelKeys) {
            const gltf = await loadGLTF(ASSETS.models[key]);
            
            // Enable shadows for all meshes in the model
            gltf.scene.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            
         loadedAssets.models[key] = gltf;
        }

        // 2. Load Fog Monster Texture
        loadedAssets.textures.fog = await loadTexture(ASSETS.textures.fog);

        // 3. Load Arrays of Textures (Roads and Buildings)
        loadedAssets.textures.roads = await Promise.all(
            ASSETS.textures.roads.map(path => loadTexture(path))
        );
        loadedAssets.textures.buildings = await Promise.all(
            ASSETS.textures.buildings.map(path => loadTexture(path))
        );

        console.log("All assets loaded successfully!", loadedAssets);
        return true;

    } catch (error) {
        console.error("Error loading assets. Check file paths in config.js!", error);
        return false;
    }
}
