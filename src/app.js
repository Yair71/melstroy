import { loadProfile, updateProfile } from "./state.js";
import { applyI18n, toggleLang, t, getLang } from "./i18n.js";
import { parseHash, nav } from "./router.js";
import { GAMES } from "./games.js";

const view = document.getElementById("view");
const uiCoins = document.getElementById("uiCoins");
const uiXp = document.getElementById("uiXp");

const modal = document.getElementById("modal");
const mTitle = document.getElementById("mTitle");
const mText = document.getElementById("mText");
const mActions = document.getElementById("mActions");
const mClose = document.getElementById("mClose");

let currentGame = null; // { stop() }

function openModal(title, text, actions = []) {
  mTitle.textContent = title;
  mText.textContent = text;
  mActions.innerHTML = "";
  for (const a of actions) {
    const btn = document.createElement("button");
    btn.className = "btn";
    btn.textContent = a.label;
    btn.addEventListener("click", () => {
      try { a.onClick?.(); } finally { closeModal(); }
    });
    mActions.appendChild(btn);
  }
  modal.style.display = "flex";
}
function closeModal() { modal.style.display = "none"; }

function renderTop() {
  const p = loadProfile();
  uiCoins.textContent = String(p.coins);
  uiXp.textContent = String(p.xp);

  const muteBtn = document.getElementById("btnMute");
  muteBtn.textContent = p.soundMuted ? "🔇" : "🔊";
  muteBtn.title = p.soundMuted ? t("sound_off") : t("sound_on");
}

function gameTitle(g) {
  const lang = getLang();
  return g.titleKey?.[lang] ?? g.titleKey?.en ?? g.id;
}
function gameDesc(g) {
  const lang = getLang();
  return g.descKey?.[lang] ?? g.descKey?.en ?? "";
}

function cleanupGame() {
  if (currentGame?.stop) {
    try { currentGame.stop(); } catch {}
  }
  currentGame = null;
}

function renderLobby() {
  cleanupGame();

  const title = document.createElement("div");
  title.innerHTML = `
    <h2>${t("lobby_title")}</h2>
    <p>${t("lobby_sub")}</p>
    <div class="hr"></div>
  `;

  const grid = document.createElement("div");
  grid.className = "grid";

  for (const g of GAMES) {
    const card = document.createElement("section");
    card.className = "card";

    card.innerHTML = `
      <div class="tag">${g.tag}</div>
      <h2>${gameTitle(g)}</h2>
      <p>${gameDesc(g)}</p>
      <div class="row">
        <div class="muted" style="font-size:12px;">ID: ${g.id}</div>
        <button class="btn" ${g.enabled ? "" : "disabled"}>
          ${g.enabled ? t("play") : t("coming")}
        </button>
      </div>
    `;

    const btn = card.querySelector("button");
    btn.addEventListener("click", () => {
      if (!g.enabled) return;
      nav(`#/game/${g.id}`);
    });

    grid.appendChild(card);
  }

  view.innerHTML = "";
  view.appendChild(title);
  view.appendChild(grid);

  applyI18n(document);
}

function renderPass() {
  cleanupGame();
  view.innerHTML = `
    <h2>${t("pass_title")}</h2>
    <p>${t("pass_sub")}</p>
    <div class="hr"></div>

    <div class="card" style="grid-column: span 12;">
      <div class="tag">Season</div>
      <h2>Season 1</h2>
      <p class="muted">Сейчас это заготовка. Дальше: задания (daily/weekly), tiers, rewards, premium toggle.</p>
      <div class="row">
        <div class="muted" style="font-size:12px;">Next: quests + reward table</div>
        <button class="btn" id="btnPassMock">Mock +100 XP</button>
      </div>
    </div>
  `;
  document.getElementById("btnPassMock")?.addEventListener("click", () => {
    updateProfile(p => { p.xp += 100; });
    renderTop();
    openModal("XP", "+100 XP (тест)");
  });
  applyI18n(document);
}

function renderAchievements() {
  cleanupGame();
  const p = loadProfile();
  const ids = Object.keys(p.achievements || {});
  view.innerHTML = `
    <h2>${t("ach_title")}</h2>
    <p class="muted">${ids.length ? `Unlocked: ${ids.length}` : "Пока пусто. Зайди в Tap Rush и выбей первую 😈"}</p>
    <div class="hr"></div>
    <div class="card" style="grid-column: span 12;">
      <div class="tag">Local</div>
      <h2>Unlocked</h2>
      <p class="muted">${ids.length ? ids.map(x => `• ${x}`).join("<br/>") : "—"}</p>
    </div>
  `;
  applyI18n(document);
}

function renderScores() {
  cleanupGame();
  const p = loadProfile();
  const hs = p.highScores || {};
  const rows = GAMES.map(g => {
    const s = Number(hs[g.id] ?? 0);
    return `<div class="row"><div>${gameTitle(g)}</div><strong>${s}</strong></div>`;
  }).join("");

  view.innerHTML = `
    <h2>${t("scores_title")}</h2>
    <p class="muted">Пока рекорды локальные (на устройстве). Дальше подключим онлайн лидеры.</p>
    <div class="hr"></div>
    <div class="gameShell">
      ${rows || "<div class='muted'>—</div>"}
    </div>
  `;
  applyI18n(document);
}

async function renderGame(gameId) {
  cleanupGame();

  const g = GAMES.find(x => x.id === gameId);
  if (!g || !g.enabled || !g.modulePath) {
    openModal("Nope", "Эта игра не подключена.", [{ label: t("back"), onClick: () => nav("#/lobby") }]);
    nav("#/lobby");
    return;
  }

  view.innerHTML = `
    <div class="gameShell">
      <div class="gameTop">
        <div>
          <div class="tag">${g.tag}</div>
          <h2 style="margin:8px 0 0;">${gameTitle(g)}</h2>
          <div class="muted" style="font-size:13px;">${gameDesc(g)}</div>
        </div>
        <div style="display:flex; gap:10px; flex-wrap:wrap;">
          <button class="btn" id="btnBack">${t("back")}</button>
          <button class="btn" id="btnRestart">Restart</button>
        </div>
      </div>
      <div class="gameCanvas" id="gameMount"></div>
    </div>
  `;

  document.getElementById("btnBack").addEventListener("click", () => nav("#/lobby"));

  const mount = document.getElementById("gameMount");
  const api = {
    addCoins: (n) => updateProfile(p => { p.coins += n; }),
    addXp: (n) => updateProfile(p => { p.xp += n; }),
    setHighScore: (score) => updateProfile(p => {
      const prev = Number(p.highScores?.[g.id] ?? 0);
      p.highScores = p.highScores || {};
      if (score > prev) p.highScores[g.id] = score;
    }),
    unlockAchievement: (id) => updateProfile(p => {
      p.achievements = p.achievements || {};
      if (!p.achievements[id]) p.achievements[id] = { unlockedAt: Date.now() };
    }),
    getProfile: () => loadProfile(),
    onUiUpdate: () => renderTop(),
    openModal,
  };

  const mod = await import(g.modulePath);
  currentGame = mod.createGame(mount, api);
  currentGame.start?.();

  document.getElementById("btnRestart").addEventListener("click", () => {
    currentGame?.stop?.();
    mount.innerHTML = "";
    currentGame = mod.createGame(mount, api);
    currentGame.start?.();
  });

  updateProfile(p => { p.lastPlayedAt = Date.now(); });
  renderTop();
  applyI18n(document);
}

function renderRoute() {
  const { parts } = parseHash();

  if (!parts.length || parts[0] === "lobby") return renderLobby();
  if (parts[0] === "battlepass") return renderPass();
  if (parts[0] === "achievements") return renderAchievements();
  if (parts[0] === "scores") return renderScores();
  if (parts[0] === "game" && parts[1]) return renderGame(parts[1]);

  nav("#/lobby");
}

function bindUI() {
  // navigation buttons
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-nav]");
    if (!el) return;
    nav(el.getAttribute("data-nav"));
  });

  // brand click
  document.querySelector(".brand")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") nav("#/lobby");
  });

  // modal
  mClose.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });

  // language
  document.getElementById("btnLang").addEventListener("click", () => {
    toggleLang();
    renderTop();
    renderRoute();
  });

  // sound (muted by default, иначе мобилки блокируют autoplay)
  document.getElementById("btnMute").addEventListener("click", () => {
    updateProfile(p => { p.soundMuted = !p.soundMuted; });
    renderTop();
    openModal("Sound", loadProfile().soundMuted ? t("sound_off") : t("sound_on"));
  });

  // menu
  document.getElementById("btnMenu").addEventListener("click", () => {
    openModal("Menu", "Монетизация позже. Сейчас строим ядро.", [
      { label: "Reset (local)", onClick: () => {
        localStorage.clear();
        renderTop();
        nav("#/lobby");
      }},
      { label: "OK", onClick: () => {} }
    ]);
  });

  // random game
  document.getElementById("btnRandom").addEventListener("click", () => {
    const enabled = GAMES.filter(g => g.enabled && g.modulePath);
    if (!enabled.length) return;
    const pick = enabled[Math.floor(Math.random() * enabled.length)];
    nav(`#/game/${pick.id}`);
  });

  window.addEventListener("hashchange", renderRoute);
}

(function init() {
  // init defaults once
  updateProfile(p => {
    if (!p.lang) p.lang = "ru";
    if (typeof p.soundMuted !== "boolean") p.soundMuted = true;
  });

  bindUI();
  renderTop();
  renderRoute();
  applyI18n(document);
})();