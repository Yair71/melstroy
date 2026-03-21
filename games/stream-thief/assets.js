import { ASSETS } from './config.js';
export const loadedAssets = { models: {} };
export async function loadAssets() {
    if (typeof THREE === 'undefined') { console.error('THREE.js not loaded!'); return false; }
    const gltfLoader = new THREE.GLTFLoader();
    const loadGLTF = (path) => new Promise((resolve, reject) => { gltfLoader.load(path, resolve, undefined, reject); });
    try {
        for (const key of Object.keys(ASSETS.models)) {
            const gltf = await loadGLTF(ASSETS.models[key]);
            gltf.scene.traverse((c) => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
            loadedAssets.models[key] = gltf;
        }
        console.log('Assets loaded!', Object.keys(loadedAssets.models));
        return true;
    } catch (e) { console.error('Asset error:', e); return false; }
}
