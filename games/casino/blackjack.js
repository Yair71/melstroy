/* ============================================
   MELL CASINO — blackjack.js
   Анимации по одной карте + 6-deck True Random
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

// Генерация "Шуза" (6 колод, как в реальном казино) для полного рандома
function freshDeck() {
    const d = [];
    for (let n = 0; n < 6; n++) { // 6 колод = 312 карт
        for (const s of SUITS) for (const r of RANKS) d.push({ suit: s, rank: r });
    }
    // Алгоритм Фишера-Йетса для идеального перемешивания
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

// Создает HTML-элемент карты, НО не добавляет его сразу на стол
function makeCardEl(card, faceDown) {
    const d = document.createElement('div');
    const isRed = card.suit === '♥' || card.suit === '♦';
    
    const randomRot = (Math.random() * 8 - 4).toFixed(1);
    d.style.setProperty('--rot', `${randomRot}deg`);

    if (faceDown) {
        d.className = 'playing-card playing-card-face-down card-anim';
        d.id = 'dealer-hole-card'; // Метка для скрытой карты, чтобы потом ее перевернуть
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

// Добавляет карту на стол (с анимацией)
function appendCard(handEl, cardObj, faceDown, isFirst) {
    const cardNode = makeCardEl(cardObj, faceDown);
    if (isFirst) cardNode.style.marginLeft = "0px"; // Первой карте убираем сдвиг
    handEl.appendChild(cardNode);
}

function updateScores(showHole) {
    pScoreEl.innerText = handValue(pCards);
    dScoreEl.innerText = showHole ? handValue(dCards) : handValue([dCards[0]]);
}

// Начальная раздача (Карты вылетают по одной с задержкой)
btnDeal.onclick = () => {
    if (bjOn) return;
    if (typeof balance !== 'undefined' && balance < bjBet) { 
        if(typeof showMsg === 'function') showMsg(bjMsg, 'НЕТ ДЕНЕГ!', 'lose'); 
        return; 
    }
    
    bjOn = true;
    if(typeof addBal === 'function') addBal(-bjBet);

    // Полностью новая рандомная колода каждый раз!
    deck = freshDeck();
    pCards = [deck.pop(), deck.pop()];
    dCards = [deck.pop(), deck.pop()];

    // Очищаем стол перед новой игрой
    dHandEl.innerHTML = '';
    pHandEl.innerHTML = '';
    updateScores(false);

    bjBetCtrls.style.display = 'none';

    // Раздаем карты поочередно (Твоя -> Дилер -> Твоя -> Дилер скрытая)
    setTimeout(() => { appendCard(pHandEl, pCards[0], false, true); updateScores(false); }, 100);
    setTimeout(() => { appendCard(dHandEl, dCards[0], false, true); updateScores(false); }, 400);
    setTimeout(() => { appendCard(pHandEl, pCards[1], false, false); updateScores(false); }, 700);
    setTimeout(() => { 
        appendCard(dHandEl, dCards[1], true, false); 
        
        bjPlayBtns.style.display = 'flex';
        
        // Проверка на Блэкджек с раздачи
        if (handValue(pCards) === 21) {
            setTimeout(() => doStand(), 500);
        } else {
            if(typeof showMsg === 'function') showMsg(bjMsg, 'ЕЩЁ ИЛИ СТОП?');
        }
    }, 1000);
};

// Игрок берет ЕЩЁ
document.getElementById('btn-hit').onclick = () => {
    if (!bjOn) return;
    
    const newCard = deck.pop();
    pCards.push(newCard);
    
    // ДОБАВЛЯЕМ ТОЛЬКО ОДНУ НОВУЮ КАРТУ (остальные не пропадают)
    appendCard(pHandEl, newCard, false, false);
    updateScores(false);
    
    const v = handValue(pCards);
    if (v > 21) {
        flipDealerCard();
        if(typeof showMsg === 'function') showMsg(bjMsg, `ПЕРЕБОР ${v}! −${bjBet} 💰`, 'lose');
        endBJ();
    } else if (v === 21) {
        setTimeout(() => doStand(), 500);
    }
};

document.getElementById('btn-stand').onclick = () => doStand();

// Переворачиваем скрытую карту дилера (без повторной анимации вылета)
function flipDealerCard() {
    const holeCard = document.getElementById('dealer-hole-card');
    if (holeCard) {
        const c = dCards[1];
        const isRed = c.suit === '♥' || c.suit === '♦';
        // Убираем класс card-anim, чтобы она просто перевернулась на месте
        holeCard.className = `playing-card ${isRed ? 'red' : 'black'}`; 
        holeCard.style.transition = "all 0.3s ease";
        holeCard.removeAttribute('id');
        holeCard.innerHTML = `
            <div class="text-sm leading-none">${c.rank}<br>${c.suit}</div>
            <div class="absolute inset-0 flex items-center justify-center opacity-20 text-5xl">${c.suit}</div>
            <div class="text-sm leading-none self-end rotate-180">${c.rank}<br>${c.suit}</div>
        `;
        updateScores(true);
    }
}

// Ход дилера
function doStand() {
    if (!bjOn) return;
    bjPlayBtns.style.display = 'none'; // Скрываем кнопки, пока дилер думает
    
    flipDealerCard();

    // Дилер добирает карты по одной с задержкой
    function dealerDrawLoop() {
        if (handValue(dCards) < 17) {
            const newCard = deck.pop();
            dCards.push(newCard);
            appendCard(dHandEl, newCard, false, false);
            updateScores(true);
            setTimeout(dealerDrawLoop, 600); // Задержка между картами дилера
        } else {
            finishGame();
        }
    }
    
    setTimeout(dealerDrawLoop, 600);
}

function finishGame() {
    const pv = handValue(pCards);
    const dv = handValue(dCards);

    if (dv > 21 || pv > dv) {
        const isNatural = pv === 21 && pCards.length === 2;
        const winAmt = isNatural ? Math.floor(bjBet * 2.5) : bjBet * 2;
        if(typeof addBal === 'function') addBal(winAmt);
        if(typeof showMsg === 'function') showMsg(bjMsg, `${isNatural ? 'БЛЭКДЖЕК!' : 'ПОБЕДА!'} +${winAmt} 💰`, 'win');
    } else if (pv === dv) {
        if(typeof addBal === 'function') addBal(bjBet);
        if(typeof showMsg === 'function') showMsg(bjMsg, 'НИЧЬЯ — ВОЗВРАТ');
    } else {
        if(typeof showMsg === 'function') showMsg(bjMsg, `ДИЛЕР ${dv} — ПРОИГРЫШ 😭`, 'lose');
    }
    endBJ();
}

function endBJ() {
    bjOn = false;
    setTimeout(() => {
        bjPlayBtns.style.display = 'none';
        bjBetCtrls.style.display = 'flex';
    }, 1500); 
}
