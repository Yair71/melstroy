export const GAMES = [
  {
    id: "murinorun",
    tag: "3D Action",
    titleKey: { ru: "Побег из Мурино", en: "Murino Escape" },
    descKey: {
      ru: "Беги от Фога, собирай кэш. Не оглядывайся.",
      en: "Run from Fog, collect cash. Don't look back."
    },
    modulePath: "../games/murino-run/index.js",
    enabled: true
  },
  {
    id: "streamthief", // Поменяли ID для красоты
    tag: "Стелс",
    titleKey: { ru: "Стрим-Вор", en: "Stream Thief" },
    descKey: { 
        ru: "Тяни руку к луту, пока Мел спит. Не спались!", 
        en: "Steal the loot while Mel is sleeping. Don't get caught!" 
    },
    modulePath: "../games/stream-thief/index.js", // Путь к нашей новой игре
    enabled: true // Включили кнопку "Играть"
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
