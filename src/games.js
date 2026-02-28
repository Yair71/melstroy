export const GAMES = [
  {
    id: "murinorun", // Изменили ID
    tag: "3D Action",
    titleKey: { ru: "Побег из Мурино", en: "Murino Escape" },
    descKey: {
      ru: "Беги от Фога, собирай кэш. Не оглядывайся.",
      en: "Run from Fog, collect cash. Don't look back."
    },
    modulePath: "../games/game1_murinorun.js", // Новый путь
    enabled: true
  },

  // Заглушки: ты позже скажешь, какие именно игры
  {
    id: "game2",
    tag: "Arcade",
    titleKey: { ru: "Game #2", en: "Game #2" },
    descKey: { ru: "Скоро подключим.", en: "Coming soon." },
    modulePath: null,
    enabled: false
  },
  {
    id: "game3",
    tag: "Click",
    titleKey: { ru: "Game #3", en: "Game #3" },
    descKey: { ru: "Скоро подключим.", en: "Coming soon." },
    modulePath: null,
    enabled: false
  },
  {
    id: "game4",
    tag: "Luck",
    titleKey: { ru: "Game #4", en: "Game #4" },
    descKey: { ru: "Скоро подключим.", en: "Coming soon." },
    modulePath: null,
    enabled: false
  },
  {
    id: "game5",
    tag: "Quiz",
    titleKey: { ru: "Game #5", en: "Game #5" },
    descKey: { ru: "Скоро подключим.", en: "Coming soon." },
    modulePath: null,
    enabled: false
  },
  {
    id: "game6",
    tag: "🔥",
    titleKey: { ru: "Game #6", en: "Game #6" },
    descKey: { ru: "Слот под самую вирусную.", en: "Slot for your most viral idea." },
    modulePath: null,
    enabled: false
  }
];
