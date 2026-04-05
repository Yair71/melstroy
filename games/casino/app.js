/* ============================================
   MELL CASINO — Full Game Logic
   ============================================ */

let balance = 0;

// ---- API sync ----
window.addEventListener('message', e => {
    if (e.data.type === 'SYNC_BALANCE') {
        balance = e.data.balance;
        updateBalanceUI();
    }
});
window.parent.postMessage({ type: 'REQUEST_BALANCE' }, '*');

function addBalance(amount) {
    balance += amount;
    updateBalanceUI();
    window.parent.postMessage({ type: 'ADD_BALANCE', amount }, '*');
}

function updateBalanceUI() {
    document.querySelectorAll('.cash-value').forEach(el => el.innerText = balance);
}

// ---- Navigation ----
const screens = document.querySelectorAll('.screen');

document.querySelectorAll('.game-card').forEach(card => {
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

// Helper
function showMsg(el, text, color) {
    el.innerText = text;
    el.style.color = color || '#f5c518';
    el.classList.remove('win-flash', 'lose-flash');
    void el.offsetWidth; // reflow
    if (color === '#34d058') el.classList.add('win-flash');
    if (color === '#ff2d55') el.classList.add('lose-flash');
}

// ===================================
// 1. SLOTS
// ===================================
const SYMBOLS = [
    { emoji: '🍒', mult: 2 },  { emoji: '🍋', mult: 3 },
    { emoji: '🍺', mult: 5 },  { emoji: '🍔', mult: 10 },
    { emoji: '💎', mult: 50 }, { emoji: '🦍', mult: 100 }
];
let slotBet = 10, slotSpinning = false;
const slotBetEl = document.getElementById('slot-bet');
const slotMsg = document.getElementById('slot-msg');

document.getElementById('slot-up').onclick = () => { if (!slotSpinning) { slotBet = Math.min(slotBet + 10, 500); slotBetEl.innerText = slotBet; } };
document.getElementById('slot-down').onclick = () => { if (!slotSpinning && slotBet > 10) { slotBet -= 10; slotBetEl.innerText = slotBet; } };

document.getElementById('btn-spin-slots').onclick = () => {
    if (slotSpinning) return;
    if (balance < slotBet) { showMsg(slotMsg, 'НЕТ ДЕНЕГ!', '#ff2d55'); return; }
    slotSpinning = true;
    addBalance(-slotBet);
    showMsg(slotMsg, 'КРУТИМ...', '#fff');

    const reels = [document.getElementById('reel-0'), document.getElementById('reel-1'), document.getElementById('reel-2')];
    reels.forEach(r => { r.innerText = '❓'; r.classList.add('spinning'); });

    const stops = [0, 0, 0];
    const reveal = (i, delay) => setTimeout(() => {
        stops[i] = Math.floor(Math.random() * SYMBOLS.length);
        reels[i].classList.remove('spinning');
        reels[i].innerText = SYMBOLS[stops[i]].emoji;
        reels[i].style.borderColor = '#f5c518';
        setTimeout(() => reels[i].style.borderColor = '#222', 400);
    }, delay);

    reveal(0, 800);
    reveal(1, 1500);
    setTimeout(() => {
        stops[2] = Math.floor(Math.random() * SYMBOLS.length);
        reels[2].classList.remove('spinning');
        reels[2].innerText = SYMBOLS[stops[2]].emoji;

        let win = 0;
        if (stops[0] === stops[1] && stops[1] === stops[2]) win = slotBet * SYMBOLS[stops[0]].mult;
        else if (stops[0] === stops[1] || stops[1] === stops[2] || stops[0] === stops[2]) win = slotBet * 2;

        if (win > 0) {
            addBalance(win);
            showMsg(slotMsg, `+${win} 💰`, '#34d058');
        } else {
            showMsg(slotMsg, 'МИМО 😭', '#ff2d55');
        }
        slotSpinning = false;
    }, 2400);
};

// ===================================
// 2. WHEEL OF FORTUNE (Canvas)
// ===================================
const wheelSegments = [
    { label: 'x0', mult: 0, color: '#222' },
    { label: 'x2', mult: 2, color: '#ff2d55' },
    { label: 'x0', mult: 0, color: '#1a1a2e' },
    { label: 'x3', mult: 3, color: '#34d058' },
    { label: 'x0.5', mult: 0.5, color: '#16213e' },
    { label: 'x5', mult: 5, color: '#f5c518' },
    { label: 'x0', mult: 0, color: '#111' },
    { label: 'x10', mult: 10, color: '#a855f7' },
];

const wheelCanvas = document.getElementById('wheel-canvas');
const wCtx = wheelCanvas.getContext('2d');
let wheelAngle = 0;
let wheelBet = 10, wheelSpinning = false;
const wheelBetEl = document.getElementById('wheel-bet');
const wheelMsg = document.getElementById('wheel-msg');

function drawWheel(angle) {
    const cx = 150, cy = 150, r = 145;
    const seg = wheelSegments.length;
    const arc = (Math.PI * 2) / seg;
    wCtx.clearRect(0, 0, 300, 300);

    for (let i = 0; i < seg; i++) {
        const a = angle + i * arc;
        wCtx.beginPath();
        wCtx.moveTo(cx, cy);
        wCtx.arc(cx, cy, r, a, a + arc);
        wCtx.closePath();
        wCtx.fillStyle = wheelSegments[i].color;
        wCtx.fill();
        wCtx.strokeStyle = 'rgba(255,255,255,0.15)';
        wCtx.lineWidth = 1;
        wCtx.stroke();

        // Label
        wCtx.save();
        wCtx.translate(cx, cy);
        wCtx.rotate(a + arc / 2);
        wCtx.fillStyle = '#fff';
        wCtx.font = 'bold 18px Orbitron, sans-serif';
        wCtx.textAlign = 'center';
        wCtx.shadowColor = '#000';
        wCtx.shadowBlur = 6;
        wCtx.fillText(wheelSegments[i].label, r * 0.65, 6);
        wCtx.restore();
    }

    // Center circle
    wCtx.beginPath();
    wCtx.arc(cx, cy, 22, 0, Math.PI * 2);
    wCtx.fillStyle = '#0c0c1a';
    wCtx.fill();
    wCtx.strokeStyle = '#f5c518';
    wCtx.lineWidth = 3;
    wCtx.stroke();
}
drawWheel(0);

document.getElementById('wheel-up').onclick = () => { if (!wheelSpinning) { wheelBet = Math.min(wheelBet + 10, 500); wheelBetEl.innerText = wheelBet; } };
document.getElementById('wheel-down').onclick = () => { if (!wheelSpinning && wheelBet > 10) { wheelBet -= 10; wheelBetEl.innerText = wheelBet; } };

document.getElementById('btn-spin-wheel').onclick = () => {
    if (wheelSpinning) return;
    if (balance < wheelBet) { showMsg(wheelMsg, 'НЕТ ДЕНЕГ!', '#ff2d55'); return; }
    wheelSpinning = true;
    addBalance(-wheelBet);
    showMsg(wheelMsg, 'ВРАЩЕНИЕ...', '#fff');

    const seg = wheelSegments.length;
    const arc = (Math.PI * 2) / seg;
    const targetIdx = Math.floor(Math.random() * seg);
    // Pointer is at top (270° = -PI/2). We need the middle of targetIdx segment to land there.
    const targetAngle = -arc * targetIdx - arc / 2 - Math.PI / 2;
    const fullSpins = (4 + Math.random() * 3) * Math.PI * 2;
    const finalAngle = targetAngle - fullSpins;

    const startAngle = wheelAngle;
    const totalDelta = finalAngle - startAngle;
    const duration = 4000;
    const startTime = performance.now();

    function animate(now) {
        let t = Math.min((now - startTime) / duration, 1);
        // Cubic ease-out
        t = 1 - Math.pow(1 - t, 3);
        wheelAngle = startAngle + totalDelta * t;
        drawWheel(wheelAngle);
        if (t < 1) {
            requestAnimationFrame(animate);
        } else {
            wheelAngle = finalAngle;
            drawWheel(wheelAngle);
            const win = Math.floor(wheelBet * wheelSegments[targetIdx].mult);
            if (win > 0) {
                addBalance(win);
                showMsg(wheelMsg, `+${win} 💰`, '#34d058');
            } else {
                showMsg(wheelMsg, 'МИМО 😭', '#ff2d55');
            }
            wheelSpinning = false;
        }
    }
    requestAnimationFrame(animate);
};

// ===================================
// 3. HORSE RACING
// ===================================
const HORSES = [
    { name: 'Молния', emoji: '🐎', odds: 2 },
    { name: 'Единорог', emoji: '🦄', odds: 3 },
    { name: 'Ракета', emoji: '🐴', odds: 5 },
    { name: 'Зебра', emoji: '🦓', odds: 8 },
];
let selectedHorse = 0, horseBet = 10, raceRunning = false;
const horseBetEl = document.getElementById('horse-bet');
const horseMsg = document.getElementById('horse-msg');
const runners = document.querySelectorAll('.runner');

document.querySelectorAll('.horse-option').forEach(opt => {
    opt.onclick = () => {
        if (raceRunning) return;
        document.querySelectorAll('.horse-option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        selectedHorse = parseInt(opt.dataset.horse);
    };
});

document.getElementById('horse-up').onclick = () => { if (!raceRunning) { horseBet = Math.min(horseBet + 10, 500); horseBetEl.innerText = horseBet; } };
document.getElementById('horse-down').onclick = () => { if (!raceRunning && horseBet > 10) { horseBet -= 10; horseBetEl.innerText = horseBet; } };

document.getElementById('btn-race').onclick = () => {
    if (raceRunning) return;
    if (balance < horseBet) { showMsg(horseMsg, 'НЕТ ДЕНЕГ!', '#ff2d55'); return; }
    raceRunning = true;
    addBalance(-horseBet);
    showMsg(horseMsg, 'ЗАЕЗД!', '#fff');

    // Reset positions
    runners.forEach(r => r.style.left = '0px');

    const trackWidth = document.querySelector('.track-lane').offsetWidth - 50;
    const positions = [0, 0, 0, 0];
    const speeds = HORSES.map(h => 0.6 + Math.random() * 0.4); // base speed bias
    let winner = -1;

    function raceStep() {
        for (let i = 0; i < 4; i++) {
            if (winner >= 0) break;
            const boost = speeds[i] * (0.5 + Math.random() * 2.5);
            positions[i] = Math.min(positions[i] + boost, trackWidth);
            runners[i].style.left = positions[i] + 'px';

            if (positions[i] >= trackWidth && winner < 0) {
                winner = i;
            }
        }
        if (winner < 0) {
            requestAnimationFrame(raceStep);
        } else {
            // Race over
            setTimeout(() => {
                if (winner === selectedHorse) {
                    const win = horseBet * HORSES[winner].odds;
                    addBalance(win);
                    showMsg(horseMsg, `${HORSES[winner].emoji} ПОБЕДА! +${win} 💰`, '#34d058');
                } else {
                    showMsg(horseMsg, `${HORSES[winner].emoji} ${HORSES[winner].name} победил!`, '#ff2d55');
                }
                raceRunning = false;
            }, 300);
        }
    }
    requestAnimationFrame(raceStep);
};

// ===================================
// 4. BLACKJACK
// ===================================
const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

let bjBet = 10, bjActive = false;
let playerCards = [], dealerCards = [];
const bjBetEl = document.getElementById('bj-bet');
const bjMsg = document.getElementById('bj-msg');
const dealerHandEl = document.getElementById('dealer-hand');
const playerHandEl = document.getElementById('player-hand');
const dealerScoreEl = document.getElementById('dealer-score');
const playerScoreEl = document.getElementById('player-score');
const bjBetControls = document.getElementById('bj-bet-controls');
const bjActions = document.getElementById('bj-actions');
const btnDeal = document.getElementById('btn-deal');

document.getElementById('bj-up').onclick = () => { if (!bjActive) { bjBet = Math.min(bjBet + 10, 500); bjBetEl.innerText = bjBet; } };
document.getElementById('bj-down').onclick = () => { if (!bjActive && bjBet > 10) { bjBet -= 10; bjBetEl.innerText = bjBet; } };

function makeDeck() {
    const d = [];
    for (const s of SUITS) for (const r of RANKS) d.push({ suit: s, rank: r });
    // Shuffle
    for (let i = d.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [d[i], d[j]] = [d[j], d[i]]; }
    return d;
}

function cardValue(cards) {
    let val = 0, aces = 0;
    for (const c of cards) {
        if (c.rank === 'A') { val += 11; aces++; }
        else if (['K', 'Q', 'J'].includes(c.rank)) val += 10;
        else val += parseInt(c.rank);
    }
    while (val > 21 && aces > 0) { val -= 10; aces--; }
    return val;
}

function renderCard(card, faceDown) {
    const div = document.createElement('div');
    div.className = 'playing-card ' + (faceDown ? 'face-down' : 'face-up');
    if (!faceDown) {
        const isRed = card.suit === '♥' || card.suit === '♦';
        div.className += isRed ? ' card-red' : ' card-black';
        div.innerHTML = `<span>${card.rank}${card.suit}</span>`;
    }
    return div;
}

function renderHands(showDealerHole) {
    dealerHandEl.innerHTML = '';
    playerHandEl.innerHTML = '';
    dealerCards.forEach((c, i) => dealerHandEl.appendChild(renderCard(c, i === 1 && !showDealerHole)));
    playerCards.forEach(c => playerHandEl.appendChild(renderCard(c, false)));

    playerScoreEl.innerText = cardValue(playerCards);
    dealerScoreEl.innerText = showDealerHole ? cardValue(dealerCards) : cardValue([dealerCards[0]]);
}

let deck = [];

btnDeal.onclick = () => {
    if (bjActive) return;
    if (balance < bjBet) { showMsg(bjMsg, 'НЕТ ДЕНЕГ!', '#ff2d55'); return; }
    bjActive = true;
    addBalance(-bjBet);

    deck = makeDeck();
    playerCards = [deck.pop(), deck.pop()];
    dealerCards = [deck.pop(), deck.pop()];

    renderHands(false);
    bjBetControls.style.display = 'none';
    btnDeal.style.display = 'none';
    bjActions.style.display = 'flex';

    if (cardValue(playerCards) === 21) {
        bjStand(); // natural blackjack
    } else {
        showMsg(bjMsg, 'ЕЩЁ ИЛИ СТОП?', '#f5c518');
    }
};

document.getElementById('btn-hit').onclick = () => {
    if (!bjActive) return;
    playerCards.push(deck.pop());
    renderHands(false);
    if (cardValue(playerCards) > 21) {
        showMsg(bjMsg, `ПЕРЕБОР! −${bjBet} 💰`, '#ff2d55');
        endBJ();
    } else if (cardValue(playerCards) === 21) {
        bjStand();
    }
};

document.getElementById('btn-stand').onclick = bjStand;

function bjStand() {
    if (!bjActive) return;
    // Dealer draws
    while (cardValue(dealerCards) < 17) dealerCards.push(deck.pop());
    renderHands(true);

    const pv = cardValue(playerCards), dv = cardValue(dealerCards);
    setTimeout(() => {
        if (dv > 21 || pv > dv) {
            const winAmt = pv === 21 && playerCards.length === 2 ? Math.floor(bjBet * 2.5) : bjBet * 2;
            addBalance(winAmt);
            showMsg(bjMsg, `ПОБЕДА! +${winAmt} 💰`, '#34d058');
        } else if (pv === dv) {
            addBalance(bjBet);
            showMsg(bjMsg, 'НИЧЬЯ — ВОЗВРАТ', '#f5c518');
        } else {
            showMsg(bjMsg, `ДИЛЕР ВЫИГРАЛ 😭`, '#ff2d55');
        }
        endBJ();
    }, 600);
}

function endBJ() {
    bjActive = false;
    bjActions.style.display = 'none';
    bjBetControls.style.display = 'flex';
    btnDeal.style.display = '';
}

// ===================================
// 5. CASES — CS:GO Style with 6 tiers
// ===================================
const CASE_TIERS = [
    {
        name: 'Бронза', icon: '🥉', price: 20,
        items: [
            { label: '5 💰',   prize: 5,   chance: 0.35, rarity: 'common' },
            { label: '10 💰',  prize: 10,  chance: 0.30, rarity: 'common' },
            { label: '20 💰',  prize: 20,  chance: 0.20, rarity: 'uncommon' },
            { label: '40 💰',  prize: 40,  chance: 0.10, rarity: 'rare' },
            { label: '80 💰',  prize: 80,  chance: 0.04, rarity: 'epic' },
            { label: '150 💰', prize: 150, chance: 0.01, rarity: 'legendary' },
        ]
    },
    {
        name: 'Серебро', icon: '🥈', price: 50,
        items: [
            { label: '10 💰',  prize: 10,  chance: 0.30, rarity: 'common' },
            { label: '30 💰',  prize: 30,  chance: 0.28, rarity: 'common' },
            { label: '50 💰',  prize: 50,  chance: 0.22, rarity: 'uncommon' },
            { label: '100 💰', prize: 100, chance: 0.12, rarity: 'rare' },
            { label: '200 💰', prize: 200, chance: 0.06, rarity: 'epic' },
            { label: '500 💰', prize: 500, chance: 0.02, rarity: 'legendary' },
        ]
    },
    {
        name: 'Золото', icon: '🥇', price: 100,
        items: [
            { label: '20 💰',   prize: 20,   chance: 0.28, rarity: 'common' },
            { label: '60 💰',   prize: 60,   chance: 0.25, rarity: 'common' },
            { label: '100 💰',  prize: 100,  chance: 0.22, rarity: 'uncommon' },
            { label: '250 💰',  prize: 250,  chance: 0.14, rarity: 'rare' },
            { label: '500 💰',  prize: 500,  chance: 0.08, rarity: 'epic' },
            { label: '1000 💰', prize: 1000, chance: 0.03, rarity: 'legendary' },
        ]
    },
    {
        name: 'Платина', icon: '💠', price: 250,
        items: [
            { label: '50 💰',   prize: 50,   chance: 0.25, rarity: 'common' },
            { label: '150 💰',  prize: 150,  chance: 0.25, rarity: 'common' },
            { label: '250 💰',  prize: 250,  chance: 0.22, rarity: 'uncommon' },
            { label: '500 💰',  prize: 500,  chance: 0.15, rarity: 'rare' },
            { label: '1000 💰', prize: 1000, chance: 0.09, rarity: 'epic' },
            { label: '2500 💰', prize: 2500, chance: 0.04, rarity: 'legendary' },
        ]
    },
    {
        name: 'Алмаз', icon: '💎', price: 500,
        items: [
            { label: '100 💰',  prize: 100,  chance: 0.22, rarity: 'common' },
            { label: '300 💰',  prize: 300,  chance: 0.25, rarity: 'common' },
            { label: '500 💰',  prize: 500,  chance: 0.22, rarity: 'uncommon' },
            { label: '1000 💰', prize: 1000, chance: 0.16, rarity: 'rare' },
            { label: '2500 💰', prize: 2500, chance: 0.10, rarity: 'epic' },
            { label: '5000 💰', prize: 5000, chance: 0.05, rarity: 'legendary' },
        ]
    },
    {
        name: 'MELL VIP', icon: '👑', price: 1000,
        items: [
            { label: '200 💰',   prize: 200,   chance: 0.20, rarity: 'common' },
            { label: '500 💰',   prize: 500,   chance: 0.22, rarity: 'uncommon' },
            { label: '1000 💰',  prize: 1000,  chance: 0.22, rarity: 'uncommon' },
            { label: '2500 💰',  prize: 2500,  chance: 0.18, rarity: 'rare' },
            { label: '5000 💰',  prize: 5000,  chance: 0.12, rarity: 'epic' },
            { label: '10000 💰', prize: 10000, chance: 0.06, rarity: 'legendary' },
        ]
    },
];

let selectedTier = 0;
let caseSpinning = false;
const caseTiersEl = document.getElementById('case-tiers');
const casePreview = document.getElementById('case-preview');
const caseMsg = document.getElementById('case-msg');
const spinnerWrap = document.getElementById('case-spinner-wrap');
const spinnerStrip = document.getElementById('spinner-strip');

// Render tier buttons
CASE_TIERS.forEach((tier, i) => {
    const div = document.createElement('div');
    div.className = 'case-tier' + (i === 0 ? ' selected' : '');
    div.innerHTML = `<span class="tier-icon">${tier.icon}</span><span class="tier-name">${tier.name}</span><span class="tier-price">${tier.price} 💰</span>`;
    div.onclick = () => {
        if (caseSpinning) return;
        document.querySelectorAll('.case-tier').forEach(t => t.classList.remove('selected'));
        div.classList.add('selected');
        selectedTier = i;
        renderCasePreview(i);
        spinnerWrap.style.display = 'none';
    };
    caseTiersEl.appendChild(div);
});

const RARITY_COLORS = {
    common: '#888', uncommon: '#4b83ff', rare: '#a855f7', epic: '#ff2d55', legendary: '#f5c518'
};

function renderCasePreview(tierIdx) {
    const tier = CASE_TIERS[tierIdx];
    casePreview.innerHTML = '';
    tier.items.forEach(item => {
        const row = document.createElement('div');
        row.className = 'case-item-row';
        row.innerHTML = `
            <div class="item-rarity rarity-${item.rarity}"></div>
            <div class="item-label">${item.label}</div>
            <div class="item-chance">${(item.chance * 100).toFixed(0)}%</div>
            <div class="item-prize" style="color:${RARITY_COLORS[item.rarity]}">${item.prize}</div>
        `;
        casePreview.appendChild(row);
    });
}
renderCasePreview(0);

function pickCaseItem(tierIdx) {
    const items = CASE_TIERS[tierIdx].items;
    const r = Math.random();
    let cumulative = 0;
    for (const item of items) {
        cumulative += item.chance;
        if (r < cumulative) return item;
    }
    return items[items.length - 1];
}

document.getElementById('btn-open-case').onclick = () => {
    if (caseSpinning) return;
    const tier = CASE_TIERS[selectedTier];
    if (balance < tier.price) { showMsg(caseMsg, 'НЕТ ДЕНЕГ!', '#ff2d55'); return; }
    caseSpinning = true;
    addBalance(-tier.price);
    showMsg(caseMsg, 'ОТКРЫВАЕМ...', '#fff');

    // Build spinner strip
    const winItem = pickCaseItem(selectedTier);
    const TOTAL_ITEMS = 50;
    const WIN_POS = 38; // position where the winning item will be
    const items = [];
    for (let i = 0; i < TOTAL_ITEMS; i++) {
        if (i === WIN_POS) {
            items.push(winItem);
        } else {
            // Random filler from same tier
            const rndItem = tier.items[Math.floor(Math.random() * tier.items.length)];
            items.push(rndItem);
        }
    }

    spinnerStrip.innerHTML = '';
    items.forEach(item => {
        const el = document.createElement('div');
        el.className = 'spinner-item';
        el.style.borderColor = RARITY_COLORS[item.rarity];
        el.innerHTML = `<span style="color:${RARITY_COLORS[item.rarity]}">${item.label.split(' ')[0]}</span><span class="si-amount">💰</span>`;
        spinnerStrip.appendChild(el);
    });

    spinnerWrap.style.display = '';
    casePreview.style.display = 'none';

    // Animate
    const itemWidth = 76; // 70 + 6 gap
    const viewportCenter = spinnerWrap.querySelector('.spinner-viewport').offsetWidth / 2;
    const targetOffset = WIN_POS * itemWidth + itemWidth / 2 - viewportCenter;

    spinnerStrip.style.transition = 'none';
    spinnerStrip.style.transform = 'translateX(0)';
    void spinnerStrip.offsetWidth; // reflow

    spinnerStrip.style.transition = 'transform 4s cubic-bezier(0.15, 0.85, 0.25, 1)';
    spinnerStrip.style.transform = `translateX(-${targetOffset}px)`;

    setTimeout(() => {
        if (winItem.prize > 0) {
            addBalance(winItem.prize);
            showMsg(caseMsg, `ВЫПАЛО: +${winItem.prize} 💰!`, '#34d058');
        } else {
            showMsg(caseMsg, 'ПУСТО 😭', '#ff2d55');
        }

        setTimeout(() => {
            caseSpinning = false;
            spinnerWrap.style.display = 'none';
            casePreview.style.display = '';
            showMsg(caseMsg, 'ВЫБЕРИ КЕЙС', '#f5c518');
        }, 2500);
    }, 4200);
};
