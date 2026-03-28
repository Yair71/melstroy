// ============================================================
// assets.js — Load all GLB models
// CRITICAL: We store the raw gltf. Every module that uses a model
// MUST call clone(true) on gltf.scene before adding to the scene.
// gltf.scene is a singleton — adding it twice removes it from
// the first parent. This was the main invisibility bug.
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

// ============================================================
// HELPER: Clone a model safely. Always use this instead of
// accessing gltf.scene directly!
// ============================================================
export function cloneModel(modelKey) {
    const gltf = loadedAssets.models[modelKey];
    if (!gltf) {
        console.warn(`cloneModel: "${modelKey}" not found in loadedAssets!`);
        return null;
    }

    const cloned = gltf.scene.clone(true);

    // Clone materials so each instance is independent
    cloned.traverse((child) => {
        if (child.isMesh) {
            if (child.material) {
                child.material = child.material.clone();
            }
            child.castShadow = true;
            child.receiveShadow = true;
        }
        // Clone SkinnedMesh bones binding
        if (child.isSkinnedMesh && child.skeleton) {
            // Re-bind skeleton to the cloned bones
            const clonedBones = [];
            child.skeleton.bones.forEach((bone) => {
                const clonedBone = cloned.getObjectByName(bone.name);
                if (clonedBone) clonedBones.push(clonedBone);
                else clonedBones.push(bone);
            });
            child.skeleton = new THREE.Skeleton(clonedBones);
            child.bind(child.skeleton);
        }
    });

    return { scene: cloned, animations: gltf.animations };
}
