// ============================================================
// assets.js — Load all GLB models (murino-run style)
// ============================================================
import { ASSETS } from './config.js';

export const loadedAssets = {
    models: {}
};

export async function loadAssets() {
    if (typeof THREE === 'undefined') {
        console.error('THREE.js is not loaded!');
        return false;
    }

    const gltfLoader = new THREE.GLTFLoader();

    const loadGLTF = (path) => new Promise((resolve, reject) => {
        gltfLoader.load(path, resolve, undefined, reject);
    });

    try {
        console.log('Starting asset loading...');

        const modelKeys = Object.keys(ASSETS.models);
        for (const key of modelKeys) {
            console.log(`  Loading model: ${key} → ${ASSETS.models[key]}`);
            const gltf = await loadGLTF(ASSETS.models[key]);

            gltf.scene.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            loadedAssets.models[key] = gltf;
        }

        console.log('All assets loaded!', Object.keys(loadedAssets.models));
        return true;
    } catch (error) {
        console.error('Error loading assets. Check file paths in config.js!', error);
        return false;
    }
}
