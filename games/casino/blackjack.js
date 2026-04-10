/* ============================================
   MELL CASINO — blackjack.js
   Интеграция с дизайном Stich
   ============================================ */

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
    for (let n = 0; n < 2; n++) {
        for (const s of SUITS) for (const r of RANKS) d.push({ suit: s, rank: r });
    }
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

// Генерация красивых HTML карточек
function makeCardEl(card, faceDown) {
    const d = document.createElement('div');
    const isRed = card.suit === '♥' || card.suit === '♦';
    
    // Рандомный поворот карты, чтобы они лежали небрежно
    const randomRot = (Math.random() * 8 - 4).toFixed(1);
    d.style.setProperty('--rot', `${randomRot}deg`);

    if (faceDown) {
        d.className = 'playing-card playing-card-face-down card-anim';
        d.style.marginLeft = "-20px";
    } else {
        d.className = `playing-card card-anim ${isRed ? 'red' : 'black'}`;
        d.style.marginLeft = "-20px";
        d.innerHTML = `
            <div class="text-sm leading-none">${card.rank}<br>${card.suit}</div>
            <div class="absolute inset-0 flex items-center justify-center opacity-20 text-5xl">${card.suit}</div>
            <div class="text-sm leading-none self-end rotate-180">${card.rank}<br>${card.suit}</div>
        `;
    }
    return d;
}

function renderBJ(showHole) {
    dHandEl.innerHTML = '';
    pHandEl.innerHTML = '';
    
    // Выкладываем карты дилера
    dCards.forEach((c, i) => {
        const delay = i * 150;
        const el = makeCardEl(c, i === 1 && !showHole);
        el.style.animationDelay = delay + 'ms';
        if(i === 0) el.style.marginLeft = "0px";
        dHandEl.appendChild(el);
    });
    
    // Выкладываем карты игрока
    pCards.forEach((c, i) => {
        const el = makeCardEl(c, false);
        el.style.animationDelay = (i * 150 + 300) + 'ms';
        if(i === 0) el.style.marginLeft = "0px";
        pHandEl.appendChild(el);
    });

    pScoreEl.innerText = handValue(pCards);
    dScoreEl.innerText = showHole ? handValue(dCards) : handValue([dCards[0]]);
}

btnDeal.onclick = () => {
    if (bjOn) return;
    
    // Берем твою функцию showMsg и переменную balance из core.js
    if (balance < bjBet) { showMsg(bjMsg, 'НЕТ ДЕНЕГ!', 'lose'); return; }
    
    bjOn = true;
    addBal(-bjBet); // Твоя функция из core.js

    deck = freshDeck();
    pCards = [deck.pop(), deck.pop()];
    dCards = [deck.pop(), deck.pop()];

    renderBJ(false);
    
    // Прячем ставки, показываем кнопки ЕЩЕ/СТОП
    bjBetCtrls.style.display = 'none';
    bjPlayBtns.style.display = 'flex';

    if (handValue(pCards) === 21) {
        setTimeout(() => doStand(), 800);
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
        setTimeout(() => doStand(), 500);
    }
};

document.getElementById('btn-stand').onclick = () => doStand();

function doStand() {
    if (!bjOn) return;
    while (handValue(dCards) < 17) dCards.push(deck.pop());
    renderBJ(true);

    const pv = handValue(pCards);
    const dv = handValue(dCards);

    setTimeout(() => {
        if (dv > 21 || pv > dv) {
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
    }, 1000); // Даем время насладиться победой/страданием
}

function endBJ() {
    bjOn = false;
    setTimeout(() => {
        // Возвращаем интерфейс обратно к ставкам
        bjPlayBtns.style.display = 'none';
        bjBetCtrls.style.display = 'flex';
    }, 1500); 
}
