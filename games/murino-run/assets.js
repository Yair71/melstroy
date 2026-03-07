const THREE = window.THREE;

function ensureThree() {
  if (!THREE) {
    throw new Error('THREE is not available on window.');
  }
  if (!THREE.GLTFLoader) {
    throw new Error('THREE.GLTFLoader is not available. Check your CDN scripts.');
  }
}

function loadGLTF(url) {
  ensureThree();
  const loader = new THREE.GLTFLoader();

  return new Promise((resolve, reject) => {
    loader.load(url, resolve, undefined, reject);
  });
}

function loadTexture(url) {
  ensureThree();
  const loader = new THREE.TextureLoader();

  return new Promise((resolve, reject) => {
    loader.load(url, resolve, undefined, reject);
  });
}

function prepareTexture(renderer, tex, repeatX = 1, repeatY = 1) {
  if (!tex) return tex;

  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);

  if ('colorSpace' in tex && THREE.SRGBColorSpace) {
    tex.colorSpace = THREE.SRGBColorSpace;
  } else if ('encoding' in tex && THREE.sRGBEncoding) {
    tex.encoding = THREE.sRGBEncoding;
  }

  if (renderer?.capabilities?.getMaxAnisotropy) {
    tex.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
  }

  return tex;
}

export async function loadMurinoAssets(renderer, config) {
  const { assets } = config;

  const [
    modelGltf,
    runGltf,
    jumpGltf,
    fallGltf,
    dance1Gltf,
    dance2Gltf,
    fogTex,
    road1,
    road2,
    road3,
    building4,
    building5
  ] = await Promise.all([
    loadGLTF(assets.model),
    loadGLTF(assets.run),
    loadGLTF(assets.jump),
    loadGLTF(assets.fall),
    loadGLTF(assets.dance1),
    loadGLTF(assets.dance2),
    loadTexture(assets.fog),
    loadTexture(assets.roads[0]),
    loadTexture(assets.roads[1]),
    loadTexture(assets.roads[2]),
    loadTexture(assets.buildings[0]),
    loadTexture(assets.buildings[1])
  ]);

  return {
    modelGltf,
    clipSources: {
      run: runGltf,
      jump: jumpGltf,
      fall: fallGltf,
      dance1: dance1Gltf,
      dance2: dance2Gltf
    },
    textures: {
      fog: prepareTexture(renderer, fogTex, 1, 1),
      roads: [
        prepareTexture(renderer, road1, 1, 6),
        prepareTexture(renderer, road2, 1, 6),
        prepareTexture(renderer, road3, 1, 6)
      ],
      buildings: [
        prepareTexture(renderer, building4, 1, 1),
        prepareTexture(renderer, building5, 1, 1)
      ]
    },
    videoUrl: assets.video
  };
}
