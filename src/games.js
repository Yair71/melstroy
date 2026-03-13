// games.js

export const GAMES = [
  {
    id: "murinorun",
    tag: "3D Action",
    titleKey: { ru: "Побег из Мурино", en: "Murino Escape" },
    descKey: {
      ru: "Беги от Фога, собирай кэш. Не оглядывайся.",
      en: "Run from Fog, collect cash. Don't look back."
    },
    // Указываем путь к главному файлу нашей модульной сборки
    modulePath: "./murino-run/index.js", 
    enabled: true
  },

  // Заглушки для будущих вирусных хитов:
  {
    id: "table_smash",
    tag: "Arcade",
    titleKey: { ru: "Круши Столы", en: "Table Smasher" },
    descKey: { 
      ru: "Легендарный развал столов. Кликай, ломай, лутай донаты!", 
      en: "Legendary table smashing. Click, break, loot donates!" 
    },
    modulePath: null,
    enabled: false
  },
  {
    id: "stream_def",
    tag: "Tower Def",
    titleKey: { ru: "Оборона Стрима", en: "Stream Defense" },
    descKey: { 
      ru: "Защити свою вебку от хейтеров и ботов. Строй башни из энергетиков.", 
      en: "Defend your webcam from haters and bots. Build energy drink towers." 
    },
    modulePath: null,
    enabled: false
  },
  {
    id: "mell_roulette",
    tag: "Лудка 🎰",
    titleKey: { ru: "Колесо Фортуны", en: "Mell Roulette" },
    descKey: { 
      ru: "Ставь собранный КЭШ. Х2 или слив баланса? Почувствуй азарт.", 
      en: "Bet your collected CASH. X2 or lose it all? Feel the thrill." 
    },
    modulePath: null,
    enabled: false
  },
  {
    id: "meme_quiz",
    tag: "Quiz",
    titleKey: { ru: "Угадай Цитату", en: "Quote Quiz" },
    descKey: { 
      ru: "Проверка на олдовость. Угадай мем по аудио-вставке.", 
      en: "Test your meme knowledge. Guess the meme by audio." 
    },
    modulePath: null,
    enabled: false
  },
  {
    id: "flappy_mell",
    tag: "🔥 VIRAL",
    titleKey: { ru: "Flappy Mell", en: "Flappy Mell" },
    descKey: { 
      ru: "Лети на частном джете, уклоняйся от банов Твича. Хардкор!", 
      en: "Fly on a private jet, dodge Twitch bans. Hardcore!" 
    },
    modulePath: null,
    enabled: false
  }
];
