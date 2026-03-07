const THREE = window.THREE;

function shortBoneName(raw) {
  if (!raw) return raw;
  const objectSegments = raw.split(/[./|:]/g).filter(Boolean);
  return objectSegments[objectSegments.length - 2] || objectSegments[objectSegments.length - 1] || raw;
}

function normalizeTrackName(trackName) {
  const parts = trackName.split('.');
  if (parts.length < 2) return trackName;

  const prop = parts.pop();
  const objectPath = parts.join('.');
  const objectSegments = objectPath.split(/[\/|:]/g).filter(Boolean);
  const last = objectSegments[objectSegments.length - 1] || objectPath;

  return `${last}.${prop}`;
}

function normalizeClip(clip, fallbackName = 'clip') {
  if (!clip) return new THREE.AnimationClip(fallbackName, -1, []);
  const cloned = clip.clone();
  cloned.name = clip.name || fallbackName;

  cloned.tracks.forEach(track => {
    track.name = normalizeTrackName(track.name);
  });

  return cloned;
}

function pickClipFromGltf(gltf, fallbackName) {
  const clip = gltf?.animations?.[0];
  return normalizeClip(clip, fallbackName);
}

export function createAnimationSet(targetRoot, sourceClips) {
  const mixer = new THREE.AnimationMixer(targetRoot);

  const clips = {
    run: pickClipFromGltf(sourceClips.run, 'run'),
    jump: pickClipFromGltf(sourceClips.jump, 'jump'),
    fall: pickClipFromGltf(sourceClips.fall, 'fall'),
    dance1: pickClipFromGltf(sourceClips.dance1, 'dance1'),
    dance2: pickClipFromGltf(sourceClips.dance2, 'dance2')
  };

  const actions = {
    run: mixer.clipAction(clips.run),
    jump: mixer.clipAction(clips.jump),
    fall: mixer.clipAction(clips.fall),
    dance1: mixer.clipAction(clips.dance1),
    dance2: mixer.clipAction(clips.dance2)
  };

  let current = null;

  function play(name, options = {}) {
    const action = actions[name];
    if (!action) return;

    const fade = options.fade ?? 0.18;
    const once = options.once ?? false;

    action.reset();
    action.enabled = true;
    action.clampWhenFinished = !!once;
    action.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, once ? 1 : Infinity);
    action.fadeIn(fade).play();

    if (current && current !== action) {
      current.fadeOut(fade);
    }

    current = action;
  }

  function update(dt) {
    mixer.update(dt);
  }

  return {
    mixer,
    actions,
    play,
    update,
    getCurrentAction() {
      return current;
    }
  };
}

export function findBoneByGuess(root, names) {
  const wanted = names.map(n => n.toLowerCase());
  let found = null;

  root.traverse(obj => {
    if (found) return;
    if (!obj.isBone) return;

    const name = (obj.name || '').toLowerCase();
    if (wanted.some(n => name.includes(n))) {
      found = obj;
    }
  });

  return found;
}
