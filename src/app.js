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

let currentGame = null; 

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
      <p class="muted">Сейчас это заготовка. Дальше: задания, tiers, rewards.</p>
      <div class="row">
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
    <div class="hr"></div>
    <div class="card" style="grid-column: span 12;">
      <h2>Unlocked</h2>
      <p class="muted">${ids.length ? ids.map(x => `• ${x}`).join("<br/>") : "--"}</p>
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
    <div class="hr"></div>
    <div class="gameShell">
      ${rows || "<div class='muted'>--</div>"}
    </div>
  `;
  applyI18n(document);
}

async function renderGame(gameId) {
  cleanupGame();
  const g = GAMES.find(x => x.id === gameId);
  if (!g || !g.enabled || !g.modulePath) {
    nav("#/lobby");
    return;
  }
  
  // Убрали шапку, сделали чистый вид
  view.innerHTML = `
    <div class="gameShell" style="padding: 0; border: none; background: transparent;">
      <div class="gameCanvas" id="gameMount" style="position: relative; height: 75vh; border: 2px solid var(--accent);">
        <button class="iconbtn" id="btnBack" style="position: absolute; top: 10px; left: 10px; z-index: 50; background: rgba(0,0,0,0.7);">🔙</button>
        <button class="iconbtn" id="btnFullscreen" style="position: absolute; top: 10px; right: 10px; z-index: 50; background: rgba(0,0,0,0.7);">⛶</button>
      </div>
    </div>
  `;
  
  document.getElementById("btnBack").addEventListener("click", () => nav("#/lobby"));
  
  const mount = document.getElementById("gameMount");
  
  // Фуллскрин ТОЛЬКО для самой игры
  document.getElementById("btnFullscreen").addEventListener("click", async () => {
    try {
      if (!document.fullscreenElement) {
        await mount.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (e) {
      console.warn(e);
    }
  });

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
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-nav]");
    if (!el) return;
    nav(el.getAttribute("data-nav"));
  });
  document.querySelector(".brand")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") nav("#/lobby");
  });
  mClose.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
  document.getElementById("btnLang").addEventListener("click", () => {
    toggleLang();
    renderTop();
    renderRoute();
  });
  document.getElementById("btnMute").addEventListener("click", () => {
    updateProfile(p => { p.soundMuted = !p.soundMuted; });
    renderTop();
  });
  document.getElementById("btnMenu").addEventListener("click", () => {
    openModal("Menu", "Сброс прогресса.", [
      { label: "Reset", onClick: () => {
        localStorage.clear();
        renderTop();
        nav("#/lobby");
      }}
    ]);
  });
  document.getElementById("btnRandom").addEventListener("click", () => {
    const enabled = GAMES.filter(g => g.enabled && g.modulePath);
    if (!enabled.length) return;
    const pick = enabled[Math.floor(Math.random() * enabled.length)];
    nav(`#/game/${pick.id}`);
  });
  window.addEventListener("hashchange", renderRoute);
}

(function init() {
  updateProfile(p => {
    if (!p.lang) p.lang = "ru";
    if (typeof p.soundMuted !== "boolean") p.soundMuted = true;
  });
  bindUI();
  renderTop();
  renderRoute();
  applyI18n(document);
})();
// =====================================================================
// ⛔⛔⛔ DELETE BEFORE RELEASE - DEV CHEAT CODE (BUTTON) ⛔⛔⛔
// =====================================================================
const cheatBtn = document.createElement("button");
cheatBtn.innerHTML = "💰 ДАТЬ 10,000";
cheatBtn.style.cssText = "position: fixed; bottom: 80px; right: 20px; z-index: 9999; padding: 15px 20px; font-family: Impact, sans-serif; font-size: 18px; background: #FF003C; color: #fff; border: 2px solid #FFD700; border-radius: 12px; cursor: pointer; box-shadow: 0 4px 15px rgba(255, 0, 60, 0.5);";

cheatBtn.onclick = () => {
    updateProfile(p => { 
        // Принудительно делаем числом, чтобы не было бага со строками
        p.coins = (Number(p.coins) || 0) + 10000; 
    });
    renderTop();
    alert("🤑 +10,000 МОНЕТ ВЫДАНО! Иди крути слоты!");
};

document.body.appendChild(cheatBtn);
// =====================================================================
