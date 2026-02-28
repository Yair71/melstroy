import { updateProfile, loadProfile } from "./state.js";

const dict = {
  ru: {
    tagline: "Быстро. Удобно. Залипательно.",
    coins: "Монеты",
    nav_lobby: "Лобби",
    nav_pass: "Пасс",
    nav_ach: "Ачивки",
    nav_scores: "Рекорды",
    lobby_title: "Выбери игру",
    lobby_sub: "Одна страница, быстрые загрузки, телефон — топ приоритет 📱",
    play: "Играть",
    coming: "Скоро",
    random: "Случайная",
    pass_title: "Battle Pass (заготовка)",
    pass_sub: "Тут будет сезонная прогрессия, задания, награды.",
    ach_title: "Achievements",
    scores_title: "Local Scores",
    back: "Назад",
    sound_on: "Звук: ON",
    sound_off: "Звук: OFF",
  },
  en: {
    tagline: "Fast. Mobile. Addictive.",
    coins: "Coins",
    nav_lobby: "Lobby",
    nav_pass: "Pass",
    nav_ach: "Achievements",
    nav_scores: "Scores",
    lobby_title: "Pick a game",
    lobby_sub: "Single-page, fast loads, mobile first 📱",
    play: "Play",
    coming: "Soon",
    random: "Random",
    pass_title: "Battle Pass (stub)",
    pass_sub: "Season progression, quests, rewards (next).",
    ach_title: "Achievements",
    scores_title: "Local Scores",
    back: "Back",
    sound_on: "Sound: ON",
    sound_off: "Sound: OFF",
  }
};

export function getLang() {
  return loadProfile().lang || "ru";
}

export function toggleLang() {
  const current = getLang();
  const next = current === "ru" ? "en" : "ru";
  updateProfile(p => { p.lang = next; });
  return next;
}

export function t(key) {
  const lang = getLang();
  return dict[lang]?.[key] ?? dict.en[key] ?? key;
}

export function applyI18n(root = document) {
  const nodes = root.querySelectorAll("[data-i18n]");
  for (const el of nodes) {
    const key = el.getAttribute("data-i18n");
    el.textContent = t(key);
  }
}