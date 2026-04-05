/* ============================================
   MELL CASINO — blackjack.js
   Blackjack: Proper ace, proper scoring, no bugs
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
