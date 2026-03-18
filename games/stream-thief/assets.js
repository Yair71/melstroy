// games/stream-thief/assets.js
import { ASSETS } from './config.js';

export const loadedAssets = {
  models: {},
  textures: {}
};

export async function loadAssets() {
  if (typeof THREE === 'undefined') {
    console.error("THREE.js is not loaded!");
    return false;
  }

  const gltfLoader = new THREE.GLTFLoader();

  const loadGLTF = (path) => new Promise((resolve, reject) => {
    gltfLoader.load(path, resolve, undefined, reject);
  });

  try {
    const modelKeys = Object.keys(ASSETS.models);
    for (const key of modelKeys) {
      const gltf = await loadGLTF(ASSETS.models[key]);
      
      gltf.scene.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      loadedAssets.models[key] = gltf;
    }
    return true;
  } catch (error) {
    console.error("Ошибка загрузки. Проверь пути к файлам!", error);
    return false;
  }
}
