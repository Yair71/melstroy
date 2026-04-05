/* ============================================
   MELL CASINO v2 — Full Rewrite, All Bugs Fixed
   ============================================ */

// ---- Background particles ----
(function(){
    const c = document.getElementById('bg-canvas');
    if (!c) return;
    const ctx = c.getContext('2d');
    let W, H;
    function resize(){ W = c.width = innerWidth; H = c.height = innerHeight; }
    resize(); window.addEventListener('resize', resize);
    const dots = Array.from({length:40}, ()=>({
        x:Math.random()*2000, y:Math.random()*2000,
        r:Math.random()*1.5+0.5, dx:(Math.random()-0.5)*0.3, dy:(Math.random()-0.5)*0.3,
        o:Math.random()*0.5+0.2
    }));
    function draw(){
        ctx.clearRect(0,0,W,H);
        for(const d of dots){
            d.x+=d.dx; d.y+=d.dy;
            if(d.x<0)d.x=W; if(d.x>W)d.x=0;
            if(d.y<0)d.y=H; if(d.y>H)d.y=0;
            ctx.beginPath(); ctx.arc(d.x,d.y,d.r,0,Math.PI*2);
            ctx.fillStyle=`rgba(255,215,0,${d.o})`; ctx.fill();
        }
        requestAnimationFrame(draw);
    }
    draw();
})();

// ---- Balance ----
let balance = 0;
window.addEventListener('message', e => {
    if (e.data.type === 'SYNC_BALANCE') { balance = e.data.balance; updateBal(); }
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

// ---- Navigation ----
const screens = document.querySelectorAll('.screen');
document.querySelectorAll('.gc').forEach(card => {
    card.onclick = () => {
        screens.forEach(s => s.classList.add('hidden'));
        document.getElementById(card.dataset.target).classList.remove('hidden');
    };
});
document.querySelectorAll('.btn-back').forEach(btn => {
    btn.onclick = () => {
        screens.forEach(s => s.classList.add('hidden'));
        document.getElementById('hub-menu').classList.remove('hidden');
    };
});

// ---- Helpers ----
function showMsg(el, text, type) {
    el.innerText = text;
    el.classList.remove('msg-win', 'msg-lose');
    if (type === 'win') { el.classList.add('msg-win'); el.style.color = ''; }
    else if (type === 'lose') { el.classList.add('msg-lose'); el.style.color = ''; }
    else { el.style.color = ''; }
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// ===================================================
// 1. SLOTS — Only 🦍🦍 pair = x2, three of a kind = mult
// ===================================================
const SYMS = [
    { e:'🍒', m:2 }, { e:'🍋', m:3 }, { e:'🍺', m:5 },
    { e:'🍔', m:10 }, { e:'💎', m:50 }, { e:'🦍', m:100 }
];
let sBet = 10, sSpinning = false;
const sBetEl = document.getElementById('slot-bet');
const sMsg = document.getElementById('slot-msg');
const reelEls = [document.getElementById('reel-0'), document.getElementById('reel-1'), document.getElementById('reel-2')];

document.getElementById('slot-up').onclick = () => { if(!sSpinning){ sBet = clamp(sBet+10,10,500); sBetEl.innerText=sBet; }};
document.getElementById('slot-down').onclick = () => { if(!sSpinning){ sBet = clamp(sBet-10,10,500); sBetEl.innerText=sBet; }};

document.getElementById('btn-spin-slots').onclick = () => {
    if (sSpinning) return;
    if (balance < sBet) { showMsg(sMsg, 'НЕТ ДЕНЕГ!', 'lose'); return; }
    sSpinning = true;
    addBal(-sBet);
    showMsg(sMsg, 'КРУТИМ...');
    reelEls.forEach(r => { r.innerText = '❓'; r.classList.add('spinning'); r.classList.remove('won'); });

    const stops = [0,0,0];
    const revealReel = (i, delay) => setTimeout(() => {
        stops[i] = Math.floor(Math.random() * SYMS.length);
        reelEls[i].classList.remove('spinning');
        reelEls[i].innerText = SYMS[stops[i]].e;
    }, delay);

    revealReel(0, 700);
    revealReel(1, 1400);
    setTimeout(() => {
        stops[2] = Math.floor(Math.random() * SYMS.length);
        reelEls[2].classList.remove('spinning');
        reelEls[2].innerText = SYMS[stops[2]].e;

        let win = 0;
        // Three of a kind
        if (stops[0] === stops[1] && stops[1] === stops[2]) {
            win = sBet * SYMS[stops[0]].m;
            reelEls.forEach(r => r.classList.add('won'));
        }
        // Only gorilla pair (index 5) gives x2
        else {
            const gorilla = 5;
            const count = stops.filter(s => s === gorilla).length;
            if (count === 2) {
                win = sBet * 2;
                reelEls.forEach((r,idx) => { if(stops[idx]===gorilla) r.classList.add('won'); });
            }
        }

        if (win > 0) {
            addBal(win);
            showMsg(sMsg, `ВЫИГРЫШ +${win} 💰!`, 'win');
        } else {
            showMsg(sMsg, 'МИМО 😭', 'lose');
        }
        sSpinning = false;
    }, 2200);
};

// ===================================================
// 2. WHEEL — Canvas, always spins forward, correct results
//    Segments: x0 x0 x0 x0 x0 x0.5 x2 x3 x5 x10 x100
// ===================================================
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

function drawWheel(angle) {
    const cx = 160, cy = 160, r = 152;
    wCtx.clearRect(0, 0, 320, 320);
    wCtx.save();

    for (let i = 0; i < SEG_COUNT; i++) {
        const a0 = angle + i * ARC;
        const a1 = a0 + ARC;
        // Segment
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
        wCtx.font = `bold ${WSEGS[i].m >= 100 ? 14 : 16}px Orbitron, sans-serif`;
        wCtx.textAlign = 'center';
        wCtx.textBaseline = 'middle';
        wCtx.shadowColor = '#000';
        wCtx.shadowBlur = 5;
        wCtx.fillText(WSEGS[i].label, r * 0.62, 0);
        wCtx.restore();
    }
    // Center
    wCtx.beginPath();
    wCtx.arc(cx, cy, 20, 0, Math.PI*2);
    wCtx.fillStyle = '#0a0a18';
    wCtx.fill();
    wCtx.strokeStyle = '#ffd700';
    wCtx.lineWidth = 3;
    wCtx.stroke();
    wCtx.restore();
}
drawWheel(0);

document.getElementById('wheel-up').onclick = () => { if(!wSpinning){ wBet=clamp(wBet+10,10,500); wBetEl.innerText=wBet; }};
document.getElementById('wheel-down').onclick = () => { if(!wSpinning){ wBet=clamp(wBet-10,10,500); wBetEl.innerText=wBet; }};

document.getElementById('btn-spin-wheel').onclick = () => {
    if (wSpinning) return;
    if (balance < wBet) { showMsg(wMsg, 'НЕТ ДЕНЕГ!', 'lose'); return; }
    wSpinning = true;
    addBal(-wBet);
    showMsg(wMsg, 'ВРАЩЕНИЕ...');

    const targetIdx = Math.floor(Math.random() * SEG_COUNT);

    // Pointer is at top = -PI/2 (270°).
    // We need segment targetIdx center to be at angle -PI/2 when done.
    // Segment i center angle relative to wheel = wAngle + i*ARC + ARC/2
    // We need: finalAngle + targetIdx*ARC + ARC/2 ≡ -PI/2 (mod 2PI)
    // finalAngle = -PI/2 - targetIdx*ARC - ARC/2

    const baseTarget = -Math.PI/2 - targetIdx * ARC - ARC/2;
    // Normalize to always spin forward (clockwise = negative angle increase)
    // Add several full rotations (always spin forward = subtract full rotations)
    const fullSpins = (5 + Math.random() * 4) * Math.PI * 2;
    const finalAngle = baseTarget - fullSpins;
    // Make sure we always go in the same direction (angle decreases = clockwise)
    // If somehow finalAngle > wAngle, subtract more
    let target = finalAngle;
    while (target >= wAngle) target -= Math.PI * 2;

    const startAngle = wAngle;
    const delta = target - startAngle;
    const duration = 5000;
    const startTime = performance.now();

    function animate(now) {
        let t = Math.min((now - startTime) / duration, 1);
        // Quartic ease-out for smooth deceleration
        t = 1 - Math.pow(1 - t, 4);
        const currentAngle = startAngle + delta * t;
        drawWheel(currentAngle);

        if (t < 1) {
            requestAnimationFrame(animate);
        } else {
            wAngle = target;
            drawWheel(wAngle);
            // Calculate result
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

// ===================================================
// 3. HORSES — 6 horses, all x2, then risk for x5
//    Dramatic race with overtaking and random bursts
// ===================================================
const HORSES = [
    { name:'Молния', e:'🐎' },
    { name:'Единорог', e:'🦄' },
    { name:'Ракета', e:'🐴' },
    { name:'Зебра', e:'🦓' },
    { name:'Тень', e:'🏇' },
    { name:'Буря', e:'🎠' },
];
let selHorse = 0, hBet = 10, racing = false, raceWinAmt = 0;
const hBetEl = document.getElementById('horse-bet');
const hMsg = document.getElementById('horse-msg');
const horsePick = document.getElementById('horse-pick');
const raceTrack = document.getElementById('race-track');
const horseResult = document.getElementById('horse-result');
const hrText = document.getElementById('hr-text');
const horseCtrls = document.getElementById('horse-ctrls');
const btnRace = document.getElementById('btn-race');

// Build horse picker
HORSES.forEach((h, i) => {
    const d = document.createElement('div');
    d.className = 'hp' + (i===0 ? ' sel' : '');
    d.dataset.idx = i;
    d.innerHTML = `<span class="hp-emoji">${h.e}</span><span class="hp-name">${h.name}</span>`;
    d.onclick = () => {
        if (racing) return;
        document.querySelectorAll('.hp').forEach(x => x.classList.remove('sel'));
        d.classList.add('sel');
        selHorse = i;
    };
    horsePick.appendChild(d);
});

// Build lanes
HORSES.forEach((h, i) => {
    const lane = document.createElement('div');
    lane.className = 'lane';
    lane.innerHTML = `<span class="lane-num">${i+1}</span><span class="runner" id="runner-${i}">${h.e}</span><div class="finish-flag"></div>`;
    raceTrack.appendChild(lane);
});

document.getElementById('horse-up').onclick = () => { if(!racing){ hBet=clamp(hBet+10,10,500); hBetEl.innerText=hBet; }};
document.getElementById('horse-down').onclick = () => { if(!racing){ hBet=clamp(hBet-10,10,500); hBetEl.innerText=hBet; }};

document.getElementById('btn-race').onclick = startRace;

function startRace() {
    if (racing) return;
    if (balance < hBet) { showMsg(hMsg, 'НЕТ ДЕНЕГ!', 'lose'); return; }
    racing = true;
    addBal(-hBet);
    showMsg(hMsg, '🏁 ЗАЕЗД!');
    horseResult.style.display = 'none';
    horseCtrls.style.display = 'none';
    btnRace.style.display = 'none';

    const runners = HORSES.map((_, i) => document.getElementById(`runner-${i}`));
    runners.forEach(r => r.style.left = '20px');

    const trackW = raceTrack.querySelector('.lane').offsetWidth - 50;
    const pos = new Float32Array(6);
    // Each horse gets random speed profile that changes over time
    const speedBase = HORSES.map(() => 0.8 + Math.random() * 0.6);
    let winner = -1;
    let frame = 0;

    function step() {
        frame++;
        for (let i = 0; i < 6; i++) {
            if (winner >= 0) break;
            // Speed varies: base + random burst + periodic boost
            let spd = speedBase[i];
            // Random burst every ~30 frames
            if (Math.random() < 0.06) spd *= 2.5 + Math.random() * 2;
            // Periodic boost (different phase per horse)
            spd *= 1 + 0.4 * Math.sin(frame * 0.05 + i * 1.5);
            // General randomness
            spd *= 0.3 + Math.random() * 1.2;
            // Slowdown near finish (tension)
            if (pos[i] > trackW * 0.85) spd *= 0.6 + Math.random() * 0.5;

            pos[i] = Math.min(pos[i] + spd, trackW);
            runners[i].style.left = (20 + pos[i]) + 'px';

            if (pos[i] >= trackW && winner < 0) winner = i;
        }

        if (winner < 0) {
            requestAnimationFrame(step);
        } else {
            setTimeout(() => {
                if (winner === selHorse) {
                    raceWinAmt = hBet * 2;
                    hrText.innerText = `${HORSES[winner].e} ПОБЕДА! +${raceWinAmt} 💰`;
                    hrText.style.color = '#00e676';
                    horseResult.style.display = '';
                    showMsg(hMsg, 'ЗАБРАТЬ ИЛИ РИСКНУТЬ?', 'win');
                } else {
                    showMsg(hMsg, `${HORSES[winner].e} ${HORSES[winner].name} ПОБЕДИЛ!`, 'lose');
                    endRace();
                }
            }, 400);
        }
    }
    requestAnimationFrame(step);
}

document.getElementById('btn-take').onclick = () => {
    addBal(raceWinAmt);
    showMsg(hMsg, `ЗАБРАЛ +${raceWinAmt} 💰`, 'win');
    endRace();
};

document.getElementById('btn-risk').onclick = () => {
    horseResult.style.display = 'none';
    showMsg(hMsg, '🔥 РИСКУЕМ! x5 ИЛИ НИЧЕГО...');
    // 35% chance to win x5
    setTimeout(() => {
        if (Math.random() < 0.35) {
            const big = hBet * 5;
            addBal(big);
            showMsg(hMsg, `🔥🔥🔥 РИСК ОКУПИЛСЯ! +${big} 💰`, 'win');
        } else {
            showMsg(hMsg, 'ПРОИГРАЛ ВСЁ 😭', 'lose');
        }
        endRace();
    }, 1500);
};

function endRace() {
    racing = false;
    horseResult.style.display = 'none';
    horseCtrls.style.display = '';
    btnRace.style.display = '';
}

// ===================================================
// 4. BLACKJACK — Proper ace, proper scoring, no bugs
// ===================================================
const SUITS = ['♠','♥','♦','♣'];
const RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];

let bjBet = 10, bjOn = false;
let pCards = [], dCards = [], deck = [];
const bjBetEl = document.getElementById('bj-bet');
const bjMsg = document.getElementById('bj-msg');
const dHandEl = document.getElementById('dealer-hand');
const pHandEl = document.getElementById('player-hand');
const dScoreEl = document.getElementById('dealer-score');
const pScoreEl = document.getElementById('player-score');
const bjBetCtrls = document.getElementById('bj-bet-ctrls');
const bjPlayBtns = document.getElementById('bj-play-btns');
const btnDeal = document.getElementById('btn-deal');

document.getElementById('bj-up').onclick = () => { if(!bjOn){ bjBet=clamp(bjBet+10,10,500); bjBetEl.innerText=bjBet; }};
document.getElementById('bj-down').onclick = () => { if(!bjOn){ bjBet=clamp(bjBet-10,10,500); bjBetEl.innerText=bjBet; }};

function freshDeck() {
    const d = [];
    // Use 2 decks for more cards
    for (let n = 0; n < 2; n++) {
        for (const s of SUITS) for (const r of RANKS) d.push({ suit: s, rank: r });
    }
    // Fisher-Yates shuffle
    for (let i = d.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [d[i], d[j]] = [d[j], d[i]];
    }
    return d;
}

function handValue(cards) {
    let total = 0, aces = 0;
    for (const c of cards) {
        if (c.rank === 'A') { total += 11; aces++; }
        else if ('JQK'.includes(c.rank[0]) && c.rank.length <= 2 && isNaN(c.rank)) total += 10;
        else total += parseInt(c.rank, 10);
    }
    while (total > 21 && aces > 0) { total -= 10; aces--; }
    return total;
}

function makeCardEl(card, faceDown) {
    const d = document.createElement('div');
    const isRed = card.suit === '♥' || card.suit === '♦';
    if (faceDown) {
        d.className = 'card card-down';
    } else {
        d.className = 'card card-up ' + (isRed ? 'c-red' : 'c-black');
        d.innerHTML = `<span class="c-corner">${card.rank}${card.suit}</span><span class="c-center">${card.rank}<br>${card.suit}</span>`;
    }
    return d;
}

function renderBJ(showHole) {
    dHandEl.innerHTML = '';
    pHandEl.innerHTML = '';
    dCards.forEach((c, i) => {
        const delay = i * 100;
        const el = makeCardEl(c, i === 1 && !showHole);
        el.style.animationDelay = delay + 'ms';
        dHandEl.appendChild(el);
    });
    pCards.forEach((c, i) => {
        const el = makeCardEl(c, false);
        el.style.animationDelay = (i * 100 + 200) + 'ms';
        pHandEl.appendChild(el);
    });

    pScoreEl.innerText = handValue(pCards);
    dScoreEl.innerText = showHole ? handValue(dCards) : handValue([dCards[0]]);
}

btnDeal.onclick = () => {
    if (bjOn) return;
    if (balance < bjBet) { showMsg(bjMsg, 'НЕТ ДЕНЕГ!', 'lose'); return; }
    bjOn = true;
    addBal(-bjBet);

    deck = freshDeck();
    pCards = [deck.pop(), deck.pop()];
    dCards = [deck.pop(), deck.pop()];

    renderBJ(false);
    bjBetCtrls.style.display = 'none';
    btnDeal.style.display = 'none';
    bjPlayBtns.style.display = 'flex';

    if (handValue(pCards) === 21) {
        // Natural blackjack
        setTimeout(() => doStand(), 500);
    } else {
        showMsg(bjMsg, 'ЕЩЁ ИЛИ СТОП?');
    }
};

document.getElementById('btn-hit').onclick = () => {
    if (!bjOn) return;
    pCards.push(deck.pop());
    renderBJ(false);
    const v = handValue(pCards);
    if (v > 21) {
        renderBJ(true);
        showMsg(bjMsg, `ПЕРЕБОР ${v}! −${bjBet} 💰`, 'lose');
        endBJ();
    } else if (v === 21) {
        setTimeout(() => doStand(), 400);
    }
};
document.getElementById('btn-stand').onclick = () => doStand();

function doStand() {
    if (!bjOn) return;
    // Dealer draws to 17
    while (handValue(dCards) < 17) dCards.push(deck.pop());
    renderBJ(true);

    const pv = handValue(pCards);
    const dv = handValue(dCards);

    setTimeout(() => {
        if (dv > 21 || pv > dv) {
            // Blackjack pays 2.5x, normal win pays 2x
            const isNatural = pv === 21 && pCards.length === 2;
            const winAmt = isNatural ? Math.floor(bjBet * 2.5) : bjBet * 2;
            addBal(winAmt);
            showMsg(bjMsg, `${isNatural ? 'БЛЭКДЖЕК!' : 'ПОБЕДА!'} +${winAmt} 💰`, 'win');
        } else if (pv === dv) {
            addBal(bjBet);
            showMsg(bjMsg, 'НИЧЬЯ — ВОЗВРАТ');
        } else {
            showMsg(bjMsg, `ДИЛЕР ${dv} — ПРОИГРЫШ 😭`, 'lose');
        }
        endBJ();
    }, 500);
}

function endBJ() {
    bjOn = false;
    bjPlayBtns.style.display = 'none';
    bjBetCtrls.style.display = '';
    btnDeal.style.display = '';
}

// ===================================================
// 5. CASES — CS:GO style, 6 tiers, gradual slowdown spinner
// ===================================================
const TIERS = [
    {
        name:'Бронза', icon:'🥉', price:20,
        items:[
            { label:'5 💰',   prize:5,   chance:0.35, rarity:'common' },
            { label:'10 💰',  prize:10,  chance:0.28, rarity:'common' },
            { label:'20 💰',  prize:20,  chance:0.20, rarity:'uncommon' },
            { label:'40 💰',  prize:40,  chance:0.10, rarity:'rare' },
            { label:'80 💰',  prize:80,  chance:0.05, rarity:'epic' },
            { label:'150 💰', prize:150, chance:0.02, rarity:'legendary' },
        ]
    },
    {
        name:'Серебро', icon:'🥈', price:50,
        items:[
            { label:'10 💰',  prize:10,  chance:0.28, rarity:'common' },
            { label:'30 💰',  prize:30,  chance:0.27, rarity:'common' },
            { label:'50 💰',  prize:50,  chance:0.22, rarity:'uncommon' },
            { label:'100 💰', prize:100, chance:0.13, rarity:'rare' },
            { label:'200 💰', prize:200, chance:0.07, rarity:'epic' },
            { label:'500 💰', prize:500, chance:0.03, rarity:'legendary' },
        ]
    },
    {
        name:'Золото', icon:'🥇', price:100,
        items:[
            { label:'20 💰',   prize:20,   chance:0.26, rarity:'common' },
            { label:'60 💰',   prize:60,   chance:0.25, rarity:'common' },
            { label:'100 💰',  prize:100,  chance:0.22, rarity:'uncommon' },
            { label:'250 💰',  prize:250,  chance:0.14, rarity:'rare' },
            { label:'500 💰',  prize:500,  chance:0.09, rarity:'epic' },
            { label:'1000 💰', prize:1000, chance:0.04, rarity:'legendary' },
        ]
    },
    {
        name:'Платина', icon:'💠', price:250,
        items:[
            { label:'50 💰',   prize:50,   chance:0.24, rarity:'common' },
            { label:'150 💰',  prize:150,  chance:0.24, rarity:'common' },
            { label:'250 💰',  prize:250,  chance:0.22, rarity:'uncommon' },
            { label:'500 💰',  prize:500,  chance:0.15, rarity:'rare' },
            { label:'1000 💰', prize:1000, chance:0.10, rarity:'epic' },
            { label:'2500 💰', prize:2500, chance:0.05, rarity:'legendary' },
        ]
    },
    {
        name:'Алмаз', icon:'💎', price:500,
        items:[
            { label:'100 💰',  prize:100,  chance:0.22, rarity:'common' },
            { label:'300 💰',  prize:300,  chance:0.24, rarity:'common' },
            { label:'500 💰',  prize:500,  chance:0.22, rarity:'uncommon' },
            { label:'1000 💰', prize:1000, chance:0.16, rarity:'rare' },
            { label:'2500 💰', prize:2500, chance:0.10, rarity:'epic' },
            { label:'5000 💰', prize:5000, chance:0.06, rarity:'legendary' },
        ]
    },
    {
        name:'MELL VIP', icon:'👑', price:1000,
        items:[
            { label:'200 💰',   prize:200,   chance:0.20, rarity:'common' },
            { label:'500 💰',   prize:500,   chance:0.22, rarity:'uncommon' },
            { label:'1000 💰',  prize:1000,  chance:0.22, rarity:'uncommon' },
            { label:'2500 💰',  prize:2500,  chance:0.18, rarity:'rare' },
            { label:'5000 💰',  prize:5000,  chance:0.12, rarity:'epic' },
            { label:'10000 💰', prize:10000, chance:0.06, rarity:'legendary' },
        ]
    },
];

const RCOLS = {
    common:'#666', uncommon:'#4488ff', rare:'#b388ff', epic:'#ff3355', legendary:'#ffd700'
};

let selTier = 0, caseSpinning = false;
const caseTiersEl = document.getElementById('case-tiers');
const caseContents = document.getElementById('case-contents');
const caseMsg = document.getElementById('case-msg');
const spinnerBox = document.getElementById('spinner-box');
const spStrip = document.getElementById('sp-strip');

// Build tier buttons
TIERS.forEach((t, i) => {
    const d = document.createElement('div');
    d.className = 'ct' + (i === 0 ? ' sel' : '');
    d.innerHTML = `<span class="ct-ico">${t.icon}</span><span class="ct-name">${t.name}</span><span class="ct-price">${t.price} 💰</span>`;
    d.onclick = () => {
        if (caseSpinning) return;
        document.querySelectorAll('.ct').forEach(x => x.classList.remove('sel'));
        d.classList.add('sel');
        selTier = i;
        renderContents(i);
        spinnerBox.style.display = 'none';
    };
    caseTiersEl.appendChild(d);
});

function renderContents(idx) {
    const tier = TIERS[idx];
    caseContents.innerHTML = '';
    tier.items.forEach(item => {
        const row = document.createElement('div');
        row.className = 'cc-row';
        row.innerHTML = `
            <div class="cc-bar r-${item.rarity}"></div>
            <div class="cc-label">${item.label}</div>
            <div class="cc-chance">${(item.chance*100).toFixed(0)}%</div>
            <div class="cc-prize">${item.prize}</div>
        `;
        caseContents.appendChild(row);
    });
}
renderContents(0);

function pickItem(idx) {
    const items = TIERS[idx].items;
    const r = Math.random();
    let c = 0;
    for (const item of items) { c += item.chance; if (r < c) return item; }
    return items[items.length - 1];
}

document.getElementById('btn-open-case').onclick = () => {
    if (caseSpinning) return;
    const tier = TIERS[selTier];
    if (balance < tier.price) { showMsg(caseMsg, 'НЕТ ДЕНЕГ!', 'lose'); return; }
    caseSpinning = true;
    addBal(-tier.price);
    showMsg(caseMsg, 'ОТКРЫВАЕМ...');

    const winItem = pickItem(selTier);
    const TOTAL = 60;
    const WIN_POS = 48; // Near the end for longer spin
    const itemList = [];
    for (let i = 0; i < TOTAL; i++) {
        if (i === WIN_POS) {
            itemList.push(winItem);
        } else {
            itemList.push(tier.items[Math.floor(Math.random() * tier.items.length)]);
        }
    }

    spStrip.innerHTML = '';
    itemList.forEach((item, i) => {
        const el = document.createElement('div');
        el.className = 'sp-item';
        el.id = i === WIN_POS ? 'sp-winner-item' : '';
        el.style.borderColor = RCOLS[item.rarity];
        const valText = item.label.split(' ')[0];
        el.innerHTML = `<span style="color:${RCOLS[item.rarity]};font-size:10px">${valText}</span><span class="sp-val">💰</span>`;
        spStrip.appendChild(el);
    });

    spinnerBox.style.display = '';
    caseContents.style.display = 'none';

    // Animate with requestAnimationFrame for smooth gradual slowdown
    const ITEM_W = 76; // 70 + 6 gap
    const vpCenter = spinnerBox.querySelector('.sp-viewport').offsetWidth / 2;
    const targetOffset = WIN_POS * ITEM_W + ITEM_W / 2 - vpCenter;

    const duration = 5500; // Longer spin
    const startTime = performance.now();
    let currentOffset = 0;

    function animateSpinner(now) {
        let t = Math.min((now - startTime) / duration, 1);
        // Custom easing: fast start, very gradual slowdown at end
        // Use quintic ease-out for dramatic deceleration
        const eased = 1 - Math.pow(1 - t, 5);
        currentOffset = targetOffset * eased;
        spStrip.style.transform = `translateX(-${currentOffset}px)`;

        if (t < 1) {
            requestAnimationFrame(animateSpinner);
        } else {
            // Done
            spStrip.style.transform = `translateX(-${targetOffset}px)`;
            // Highlight winner
            const winEl = document.getElementById('sp-winner-item');
            if (winEl) winEl.classList.add('sp-winner');

            setTimeout(() => {
                addBal(winItem.prize);
                showMsg(caseMsg, `ВЫПАЛО: +${winItem.prize} 💰!`, 'win');

                setTimeout(() => {
                    caseSpinning = false;
                    spinnerBox.style.display = 'none';
                    caseContents.style.display = '';
                    showMsg(caseMsg, 'ВЫБЕРИ КЕЙС');
                }, 2500);
            }, 500);
        }
    }
    requestAnimationFrame(animateSpinner);
};
