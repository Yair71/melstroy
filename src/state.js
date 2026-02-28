const LS_KEY = "ml_profile_v1";

function defaultProfile() {
  return {
    lang: "ru",
    soundMuted: true,

    coins: 0,
    xp: 0,

    // battle pass stub
    pass: {
      season: 1,
      tier: 0,
      premium: false
    },

    // local scores per game
    highScores: {},

    // achievements by id
    achievements: {},

    createdAt: Date.now(),
    lastPlayedAt: null
  };
}

export function loadProfile() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return defaultProfile();
    const parsed = JSON.parse(raw);
    return { ...defaultProfile(), ...parsed };
  } catch {
    return defaultProfile();
  }
}

export function saveProfile(p) {
  localStorage.setItem(LS_KEY, JSON.stringify(p));
}

export function updateProfile(mutator) {
  const p = loadProfile();
  mutator(p);
  saveProfile(p);
  return p;
}

export function addCoins(amount) {
  return updateProfile(p => {
    p.coins = Math.max(0, Math.floor(p.coins + amount));
  });
}

export function addXp(amount) {
  return updateProfile(p => {
    p.xp = Math.max(0, Math.floor(p.xp + amount));
  });
}

export function setHighScore(gameId, score) {
  return updateProfile(p => {
    const prev = Number(p.highScores[gameId] ?? 0);
    if (score > prev) p.highScores[gameId] = score;
  });
}

export function unlockAchievement(id) {
  return updateProfile(p => {
    if (!p.achievements[id]) {
      p.achievements[id] = { unlockedAt: Date.now() };
    }
  });
}