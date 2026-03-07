export function createMurinoUI(root) {
  const wrap = document.createElement('div');
  const canvasHost = document.createElement('div');
  const hud = document.createElement('div');
  const score = document.createElement('div');

  const center = document.createElement('div');
  const title = document.createElement('div');
  const subtitle = document.createElement('div');
  const startBtn = document.createElement('button');
  const restartBtn = document.createElement('button');
  const hint = document.createElement('div');

  wrap.style.cssText = `
    position:absolute; inset:0; overflow:hidden;
    user-select:none; -webkit-user-select:none;
    font-family: Arial, Helvetica, sans-serif;
  `;

  canvasHost.style.cssText = `position:absolute; inset:0;`;

  hud.style.cssText = `
    position:absolute; top:16px; left:16px; right:16px;
    display:flex; justify-content:space-between; align-items:flex-start;
    pointer-events:none; z-index:20;
  `;

  score.style.cssText = `
    color:#fff; font-size:18px; font-weight:900;
    letter-spacing:.08em;
    background:rgba(0,0,0,.34);
    border:1px solid rgba(255,255,255,.16);
    border-radius:14px;
    padding:10px 14px;
    backdrop-filter: blur(10px);
  `;
  score.textContent = 'SCORE 0';

  center.style.cssText = `
    position:absolute; inset:0; z-index:30;
    display:flex; flex-direction:column; justify-content:center; align-items:center;
    text-align:center; gap:14px; padding:24px;
    background:linear-gradient(180deg, rgba(0,0,0,.18), rgba(0,0,0,.34));
  `;

  title.style.cssText = `
    color:#fff; font-size:42px; font-weight:900; letter-spacing:.06em;
    text-shadow:0 8px 32px rgba(0,0,0,.5);
  `;

  subtitle.style.cssText = `
    color:rgba(255,255,255,.84); font-size:16px; max-width:720px; line-height:1.45;
  `;

  startBtn.style.cssText = `
    appearance:none; border:none; outline:none; cursor:pointer;
    padding:15px 30px; border-radius:16px;
    font-size:16px; font-weight:900; letter-spacing:.08em;
    color:#111; background:#fff;
    box-shadow:0 14px 40px rgba(255,255,255,.16);
  `;
  startBtn.textContent = 'START RUN';

  restartBtn.style.cssText = `
    display:none;
    appearance:none; border:none; outline:none; cursor:pointer;
    padding:15px 30px; border-radius:16px;
    font-size:16px; font-weight:900; letter-spacing:.08em;
    color:#111; background:#fff;
    box-shadow:0 14px 40px rgba(255,255,255,.16);
  `;
  restartBtn.textContent = 'RESTART';

  hint.style.cssText = `
    color:rgba(255,255,255,.72); font-size:13px; line-height:1.5;
  `;
  hint.innerHTML = `
    A / D or ← / → — lanes<br>
    SPACE / W / ↑ — jump<br>
    Swipe left / right / up — mobile
  `;

  center.append(title, subtitle, startBtn, restartBtn, hint);
  hud.append(score);
  wrap.append(canvasHost, hud, center);
  root.appendChild(wrap);

  return {
    wrap,
    canvasHost,
    hud,
    score,
    center,
    title,
    subtitle,
    startBtn,
    restartBtn,
    hint,

    setScore(value) {
      score.textContent = `SCORE ${Math.floor(value)}`;
    },

    showIntro(titleText, subtitleText) {
      title.textContent = titleText;
      subtitle.textContent = subtitleText;
      startBtn.style.display = 'inline-block';
      restartBtn.style.display = 'none';
      hint.style.display = 'block';
      center.style.display = 'flex';
    },

    showLoading() {
      title.textContent = 'LOADING MURINO...';
      subtitle.textContent = 'Building city, loading model, wiring animations.';
      startBtn.style.display = 'none';
      restartBtn.style.display = 'none';
      hint.style.display = 'none';
      center.style.display = 'flex';
    },

    showRunning() {
      center.style.display = 'none';
    },

    showGameOver(distance, scoreValue) {
      title.textContent = 'FOG GOT YOU';
      subtitle.textContent = `Distance ${Math.floor(distance)} • Score ${Math.floor(scoreValue)}`;
      startBtn.style.display = 'none';
      restartBtn.style.display = 'inline-block';
      hint.style.display = 'none';
      center.style.display = 'flex';
    },

    showError(message) {
      title.textContent = 'LOAD ERROR';
      subtitle.textContent = message || 'Check asset paths and loader scripts.';
      startBtn.style.display = 'none';
      restartBtn.style.display = 'inline-block';
      hint.style.display = 'none';
      center.style.display = 'flex';
    }
  };
}
