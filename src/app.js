import { loadProfile, updateProfile } from "./state.js";
import { applyI18n, toggleLang, t, getLang } from "./i18n.js";
import { parseHash, nav } from "./router.js";
import { GAMES } from "./games.js";

// ==========================================
// DOM ELEMENTS
// ==========================================
const view = document.getElementById("view");
const uiCoins = document.getElementById("uiCoins");
const uiXp = document.getElementById("uiXp");
const modal = document.getElementById("modal");
const mTitle = document.getElementById("mTitle");
const mText = document.getElementById("mText");
const mActions = document.getElementById("mActions");
const mClose = document.getElementById("mClose");

let currentGame = null; 

// ==========================================
// MODAL SYSTEM
// ==========================================
function openModal(title, text, actions = []) {
    mTitle.textContent = title;
    mText.textContent = text;
    mActions.innerHTML = "";
    
    for (const action of actions) {
        const btn = document.createElement("button");
        btn.className = "btn";
        btn.textContent = action.label;
        btn.addEventListener("click", () => {
            try { 
                action.onClick?.(); 
            } finally { 
                closeModal(); 
            }
        });
        mActions.appendChild(btn);
    }
    modal.style.display = "flex";
}

function closeModal() { 
    modal.style.display = "none"; 
}

// ==========================================
// UI RENDERERS
// ==========================================
function renderTop() {
    const profile = loadProfile();
    uiCoins.textContent = String(profile.coins);
    uiXp.textContent = String(profile.xp);
    
    const muteBtn = document.getElementById("btnMute");
    if (muteBtn) {
        muteBtn.textContent = profile.soundMuted ? "🔇" : "🔊";
        muteBtn.title = profile.soundMuted ? t("sound_off") : t("sound_on");
    }
}

function getGameTitle(game) {
    const lang = getLang();
    return game.titleKey?.[lang] ?? game.titleKey?.en ?? game.id;
}

function getGameDesc(game) {
    const lang = getLang();
    return game.descKey?.[lang] ?? game.descKey?.en ?? "";
}

function cleanupGame() {
    if (currentGame?.stop) {
        try { 
            currentGame.stop(); 
        } catch (err) {
            console.error("Error stopping current game:", err);
        }
    }
    currentGame = null;
}

// --- LOBBY VIEW ---
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
    
    for (const game of GAMES) {
        const card = document.createElement("section");
        card.className = "card";
        card.innerHTML = `
            <div class="tag">${game.tag}</div>
            <h2>${getGameTitle(game)}</h2>
            <p>${getGameDesc(game)}</p>
            <div class="row">
                <div class="muted" style="font-size:12px;">ID: ${game.id}</div>
                <button class="btn" ${game.enabled ? "" : "disabled"}>
                    ${game.enabled ? t("play") : t("coming")}
                </button>
            </div>
        `;
        
        const playBtn = card.querySelector("button");
        playBtn.addEventListener("click", () => {
            if (!game.enabled) return;
            nav(`#/game/${game.id}`);
        });
        
        grid.appendChild(card);
    }
    
    view.innerHTML = "";
    view.appendChild(title);
    view.appendChild(grid);
    applyI18n(document);
}

// --- BATTLE PASS VIEW ---
function renderPass() {
    cleanupGame();
    
    view.innerHTML = `
        <h2>${t("pass_title")}</h2>
        <p>${t("pass_sub")}</p>
        <div class="hr"></div>
        <div class="card" style="grid-column: span 12;">
            <div class="tag">Season</div>
            <h2>Season 1</h2>
            <p class="muted">Заготовка под боевой пропуск. Скоро: задания, тиры, награды.</p>
            <div class="row">
                <button class="btn" id="btnPassMock">Mock +100 XP</button>
            </div>
        </div>
    `;
    
    document.getElementById("btnPassMock")?.addEventListener("click", () => {
        updateProfile(p => { p.xp += 100; });
        renderTop();
        openModal("XP BOOST", "+100 XP (тест выдачи)");
    });
    
    applyI18n(document);
}

// --- ACHIEVEMENTS VIEW ---
function renderAchievements() {
    cleanupGame();
    const profile = loadProfile();
    const achIds = Object.keys(profile.achievements || {});
    
    view.innerHTML = `
        <h2>${t("ach_title")}</h2>
        <div class="hr"></div>
        <div class="card" style="grid-column: span 12;">
            <h2>Unlocked</h2>
            <p class="muted">${achIds.length ? achIds.map(id => `• ${id}`).join("<br/>") : "--"}</p>
        </div>
    `;
    applyI18n(document);
}

// --- SCORES VIEW ---
function renderScores() {
    cleanupGame();
    const profile = loadProfile();
    const highScores = profile.highScores || {};
    
    const rows = GAMES.map(g => {
        const score = Number(highScores[g.id] ?? 0);
        return `<div class="row"><div>${getGameTitle(g)}</div><strong>${score}</strong></div>`;
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

// --- GAME VIEW (The Hub Player) ---
async function renderGame(gameId) {
    cleanupGame();
    
    const game = GAMES.find(x => x.id === gameId);
    if (!game || !game.enabled || !game.modulePath) {
        nav("#/lobby");
        return;
    }
    
    // Clean UI for gameplay
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
    
    // Fullscreen strictly for the game canvas
    document.getElementById("btnFullscreen").addEventListener("click", async () => {
        try {
            if (!document.fullscreenElement) {
                await mount.requestFullscreen();
            } else {
                await document.exitFullscreen();
            }
        } catch (err) {
            console.warn("Fullscreen error:", err);
        }
    });

    // GAME API: Expose hub functions to the mini-games
    const api = {
        addCoins: (amount) => {
            updateProfile(p => { p.coins += amount; });
            api.onUiUpdate(); // Refresh header immediately
        },
        addXp: (amount) => {
            updateProfile(p => { p.xp += amount; });
            api.onUiUpdate();
        },
        setHighScore: (score) => updateProfile(p => {
            const prev = Number(p.highScores?.[game.id] ?? 0);
            p.highScores = p.highScores || {};
            if (score > prev) p.highScores[game.id] = score;
        }),
        unlockAchievement: (achId) => updateProfile(p => {
            p.achievements = p.achievements || {};
            if (!p.achievements[achId]) p.achievements[achId] = { unlockedAt: Date.now() };
        }),
        getProfile: () => loadProfile(),
        onUiUpdate: () => renderTop(),
        isSoundEnabled: () => !loadProfile().soundMuted,
        openModal
    };
    
    try {
        const mod = await import(game.modulePath);
        currentGame = mod.createGame(mount, api);
        if (currentGame?.start) currentGame.start();
        
        updateProfile(p => { p.lastPlayedAt = Date.now(); });
        renderTop();
        applyI18n(document);
    } catch (err) {
        console.error("Failed to load game module:", err);
        nav("#/lobby");
    }
}

// ==========================================
// ROUTER & CORE
// ==========================================
function renderRoute() {
    const { parts } = parseHash();
    
    if (!parts.length || parts[0] === "lobby") return renderLobby();
    if (parts[0] === "battlepass") return renderPass();
    if (parts[0] === "achievements") return renderAchievements();
    if (parts[0] === "scores") return renderScores();
    if (parts[0] === "game" && parts[1]) return renderGame(parts[1]);
    
    nav("#/lobby"); // Fallback
}

function bindUI() {
    // Global navigation bindings
    document.addEventListener("click", (e) => {
        const el = e.target.closest("[data-nav]");
        if (!el) return;
        nav(el.getAttribute("data-nav"));
    });
    
    // Accessibility for logo/brand
    document.querySelector(".brand")?.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") nav("#/lobby");
    });
    
    // Modal bindings
    if (mClose) mClose.addEventListener("click", closeModal);
    if (modal) {
        modal.addEventListener("click", (e) => { 
            if (e.target === modal) closeModal(); 
        });
    }
    
    // Header buttons
    document.getElementById("btnLang")?.addEventListener("click", () => {
        toggleLang();
        renderTop();
        renderRoute();
    });
    
    document.getElementById("btnMute")?.addEventListener("click", () => {
        updateProfile(p => { p.soundMuted = !p.soundMuted; });
        renderTop();
        
        // Let the current game know sound state changed (if it supports it)
        if (currentGame?.onMuteToggle) {
            currentGame.onMuteToggle(!loadProfile().soundMuted);
        }
    });
    
    document.getElementById("btnMenu")?.addEventListener("click", () => {
        openModal("Настройки", "Что будем делать, лудик?", [
            { 
                label: "Сброс прогресса 💀", 
                onClick: () => {
                    localStorage.clear();
                    renderTop();
                    nav("#/lobby");
                    location.reload(); // Hard reload to clear everything safely
                }
            }
        ]);
    });
    
    // Friv-style randomizer
    document.getElementById("btnRandom")?.addEventListener("click", () => {
        const enabledGames = GAMES.filter(g => g.enabled && g.modulePath);
        if (!enabledGames.length) return;
        const pick = enabledGames[Math.floor(Math.random() * enabledGames.length)];
        nav(`#/game/${pick.id}`);
    });
    
    window.addEventListener("hashchange", renderRoute);
}

// ==========================================
// BOOTSTRAP
// ==========================================
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
