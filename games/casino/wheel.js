/* ============================================
   MELL CASINO — wheel.js
   Wheel of Fortune: Canvas, responsive size, correct results
   Segments: x0 x0 x0 x0 x0 x0.5 x2 x3 x5 x10 x100
   ============================================ */

const WSEGS = [
    { label:'x0',   m:0,   color:'#1a1a28' },
    { label:'x2',   m:2,   color:'#cc2244' },
    { label:'x0',   m:0,   color:'#12122a' },
    { label:'x3',   m:3,   color:'#228844' },
    { label:'x0',   m:0,   color:'#1a1a28' },
    { label:'x0.5', m:0.5, color:'#333355' },
    { label:'x0',   m:0,   color:'#12122a' },
    { label:'x5',   m:5,   color:'#cc8800' },
    { label:'x0',   m:0,   color:'#1a1a28' },
    { label:'x10',  m:10,  color:'#6633cc' },
    { label:'x0',   m:0,   color:'#12122a' },
    { label:'x100', m:100, color:'#ff2255' },
];

const wCanvas = document.getElementById('wheel-canvas');
const wCtx = wCanvas.getContext('2d');
let wAngle = 0, wBet = 10, wSpinning = false;
const wBetEl = document.getElementById('wheel-bet');
const wMsg = document.getElementById('wheel-msg');
const SEG_COUNT = WSEGS.length;
const ARC = (Math.PI * 2) / SEG_COUNT;

/* ---- Responsive canvas sizing ---- */
function getWheelSize() {
    // Use available screen width, clamped between 260 and 480
    const available = Math.min(
        window.innerWidth - 32,
        window.innerHeight * 0.55
    );
    // On desktop (two-column), the visual column is ~60% of screen
    if (window.innerWidth >= 900) {
        return Math.min(Math.floor((window.innerWidth - 340 - 80) * 0.9), 480);
    }
    return Math.min(Math.max(available, 260), 400);
}

function resizeWheel() {
    const size = getWheelSize();
    wCanvas.width = size;
    wCanvas.height = size;
    // Update CSS variable for CSS sizing fallback
    document.documentElement.style.setProperty('--wheel-size', size + 'px');
    drawWheel(wAngle);
}

function drawWheel(angle) {
    const size = wCanvas.width;
    const cx = size / 2, cy = size / 2, r = size / 2 - 4;
    wCtx.clearRect(0, 0, size, size);
    wCtx.save();

    for (let i = 0; i < SEG_COUNT; i++) {
        const a0 = angle + i * ARC;
        const a1 = a0 + ARC;
        // Segment fill
        wCtx.beginPath();
        wCtx.moveTo(cx, cy);
        wCtx.arc(cx, cy, r, a0, a1);
        wCtx.closePath();
        wCtx.fillStyle = WSEGS[i].color;
        wCtx.fill();
        wCtx.strokeStyle = 'rgba(255,255,255,0.1)';
        wCtx.lineWidth = 1;
        wCtx.stroke();
        // Label
        wCtx.save();
        wCtx.translate(cx, cy);
        wCtx.rotate(a0 + ARC / 2);
        wCtx.fillStyle = '#fff';
        const fontSize = Math.max(10, Math.floor(size / 22));
        wCtx.font = `bold ${WSEGS[i].m >= 100 ? fontSize - 2 : fontSize}px Orbitron, sans-serif`;
        wCtx.textAlign = 'center';
        wCtx.textBaseline = 'middle';
        wCtx.shadowColor = '#000';
        wCtx.shadowBlur = 5;
        wCtx.fillText(WSEGS[i].label, r * 0.62, 0);
        wCtx.restore();
    }

    // Center hub
    wCtx.beginPath();
    wCtx.arc(cx, cy, Math.max(14, size * 0.065), 0, Math.PI * 2);
    wCtx.fillStyle = '#0a0a18';
    wCtx.fill();
    wCtx.strokeStyle = '#ffd700';
    wCtx.lineWidth = 3;
    wCtx.stroke();
    wCtx.restore();
}

// Initial draw + resize listener
resizeWheel();
window.addEventListener('resize', resizeWheel);

/* ---- Controls ---- */
document.getElementById('wheel-up').onclick = () => {
    if (!wSpinning) { wBet = clamp(wBet + 10, 10, 500); wBetEl.innerText = wBet; }
};
document.getElementById('wheel-down').onclick = () => {
    if (!wSpinning) { wBet = clamp(wBet - 10, 10, 500); wBetEl.innerText = wBet; }
};

document.getElementById('btn-spin-wheel').onclick = () => {
    if (wSpinning) return;
    if (balance < wBet) { showMsg(wMsg, 'НЕТ ДЕНЕГ!', 'lose'); return; }
    wSpinning = true;
    addBal(-wBet);
    showMsg(wMsg, 'ВРАЩЕНИЕ...');

    const targetIdx = Math.floor(Math.random() * SEG_COUNT);

    const baseTarget = -Math.PI / 2 - targetIdx * ARC - ARC / 2;
    const fullSpins = (5 + Math.random() * 4) * Math.PI * 2;
    const finalAngle = baseTarget - fullSpins;
    let target = finalAngle;
    while (target >= wAngle) target -= Math.PI * 2;

    const startAngle = wAngle;
    const delta = target - startAngle;
    const duration = 5000;
    const startTime = performance.now();

    function animate(now) {
        let t = Math.min((now - startTime) / duration, 1);
        // Quartic ease-out
        t = 1 - Math.pow(1 - t, 4);
        const currentAngle = startAngle + delta * t;
        drawWheel(currentAngle);

        if (t < 1) {
            requestAnimationFrame(animate);
        } else {
            wAngle = target;
            drawWheel(wAngle);
            const win = Math.floor(wBet * WSEGS[targetIdx].m);
            if (win > 0) {
                addBal(win);
                showMsg(wMsg, `${WSEGS[targetIdx].label} = +${win} 💰!`, 'win');
            } else {
                showMsg(wMsg, `${WSEGS[targetIdx].label} — МИМО 😭`, 'lose');
            }
            wSpinning = false;
        }
    }
    requestAnimationFrame(animate);
};
