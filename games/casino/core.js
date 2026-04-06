/* ============================================
   MELL CASINO — core.js  v2.0
   Background particles + Balance + Navigation + Helpers
   ============================================ */

// ---- Background particles (optimized) ----
(function(){
    const c = document.getElementById('bg-canvas');
    if (!c) return;
    const ctx = c.getContext('2d');
    let W, H;

    function resize(){
        W = c.width = window.innerWidth;
        H = c.height = window.innerHeight;
    }
    resize();

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(resize, 150);
    });

    const COUNT = Math.min(50, Math.floor(window.innerWidth * window.innerHeight / 20000));
    const dots = Array.from({length: COUNT}, () => ({
        x: Math.random() * 2000,
        y: Math.random() * 2000,
        r: Math.random() * 1.5 + 0.4,
        dx: (Math.random() - 0.5) * 0.25,
        dy: (Math.random() - 0.5) * 0.25,
        o: Math.random() * 0.4 + 0.15
    }));

    function draw(){
        ctx.clearRect(0, 0, W, H);
        for (const d of dots) {
            d.x += d.dx;
            d.y += d.dy;
            if (d.x < 0) d.x = W;
            if (d.x > W) d.x = 0;
            if (d.y < 0) d.y = H;
            if (d.y > H) d.y = 0;
            ctx.beginPath();
            ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,215,0,${d.o})`;
            ctx.fill();
        }
        requestAnimationFrame(draw);
    }
    draw();
})();

// ---- Balance ----
let balance = 0;
window.addEventListener('message', e => {
    if (e.data && e.data.type === 'SYNC_BALANCE') {
        balance = e.data.balance;
        updateBal();
    }
});
window.parent.postMessage({ type: 'REQUEST_BALANCE' }, '*');

function addBal(n) {
    balance += n;
    updateBal();
    window.parent.postMessage({ type: 'ADD_BALANCE', amount: n }, '*');
}
function updateBal() {
    document.querySelectorAll('.cash-value').forEach(el => el.innerText = balance);
}

// ---- Navigation with smooth transitions ----
const screens = document.querySelectorAll('.screen');

document.querySelectorAll('.gc').forEach(card => {
    card.onclick = () => {
        const targetId = card.dataset.target;
        const target = document.getElementById(targetId);
        if (!target) return;

        screens.forEach(s => s.classList.add('hidden'));
        target.classList.remove('hidden');
        target.classList.add('active');

        // Scroll to top on screen switch
        target.scrollTop = 0;

        // Trigger resize for canvas-based games (wheel)
        window.dispatchEvent(new Event('resize'));
    };
});

document.querySelectorAll('.btn-back').forEach(btn => {
    btn.onclick = () => {
        screens.forEach(s => s.classList.add('hidden'));
        document.getElementById('hub-menu').classList.remove('hidden');
        document.getElementById('hub-menu').classList.add('active');
    };
});

// ---- Helpers ----
function showMsg(el, text, type) {
    el.innerText = text;
    el.classList.remove('msg-win', 'msg-lose');
    if (type === 'win') el.classList.add('msg-win');
    else if (type === 'lose') el.classList.add('msg-lose');
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
