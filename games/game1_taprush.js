export function createGame(root, api) {
  let taps = 0;
  let running = false;
  let timer = null;
  let endAt = 0;

  function render() {
    root.innerHTML = `
      <div style="width:100%; display:flex; flex-direction:column; gap:10px; align-items:center;">
        <div class="muted" style="font-size:13px; text-align:center;">
          20s run • Тапы = score • мобайл-friendly
        </div>

        <div style="display:flex; gap:10px; flex-wrap:wrap; justify-content:center;">
          <div class="statpill">Taps: <strong id="uiTaps">${taps}</strong></div>
          <div class="statpill">Time: <strong id="uiTime">20.0</strong>s</div>
        </div>

        <div class="bigTap" id="tapBtn">TAP ⚡</div>

        <div class="muted" style="font-size:12px; text-align:center;">
          Tip: потом сюда легко добавим мем-пак (звуки/пасхалки) без лагов.
        </div>
      </div>
    `;
  }

  function updateTimerUI() {
    const leftMs = Math.max(0, endAt - performance.now());
    const left = (leftMs / 1000).toFixed(1);
    const el = root.querySelector("#uiTime");
    if (el) el.textContent = left;
    if (leftMs <= 0) finish();
  }

  function startRun() {
    if (running) return;
    running = true;
    taps = 0;

    render();
    const tapBtn = root.querySelector("#tapBtn");
    const tapsEl = root.querySelector("#uiTaps");

    // старт таймера
    endAt = performance.now() + 20000;
    timer = setInterval(updateTimerUI, 50);

    // pointerdown = топ для мобилки
    tapBtn.addEventListener("pointerdown", () => {
      if (!running) return;
      taps++;
      tapsEl.textContent = String(taps);

      // Мини-награда в процессе (чтоб “кайф”)
      if (taps === 1) api.unlockAchievement("first_tap");
      if (taps === 50) api.unlockAchievement("tap_50");
      if (taps === 100) api.unlockAchievement("tap_100");
    }, { passive: true });
  }

  function finish() {
    if (!running) return;
    running = false;
    clearInterval(timer);

    // Экономика: простой скейл (потом настроим)
    const coinsEarned = Math.min(50, Math.floor(taps / 5));
    const xpEarned = Math.min(120, taps);

    api.addCoins(coinsEarned);
    api.addXp(xpEarned);
    api.setHighScore(taps);
    api.onUiUpdate();

    api.openModal(
      "Result",
      `Score: ${taps}\nCoins: +${coinsEarned}\nXP: +${xpEarned}`,
      [
        { label: "Play again", onClick: () => startRun() }
      ]
    );
  }

  return {
    start() {
      startRun();
    },
    stop() {
      running = false;
      clearInterval(timer);
      root.innerHTML = "";
    }
  };
}