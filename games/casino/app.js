let balance = 0;

// -- API СИНХРОНИЗАЦИЯ --
window.addEventListener('message', e => {
    if (e.data.type === 'SYNC_BALANCE') {
        balance = e.data.balance;
        document.querySelectorAll('.cash-value').forEach(el => el.innerText = balance);
    }
});
window.parent.postMessage({ type: 'REQUEST_BALANCE' }, '*');

function addBalance(amount) {
    balance += amount;
    document.querySelectorAll('.cash-value').forEach(el => el.innerText = balance);
    window.parent.postMessage({ type: 'ADD_BALANCE', amount: amount }, '*');
}

// -- НАВИГАЦИЯ ХАБА --
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

// ===================================
// 1. СЛОТЫ (DOM-версия)
// ===================================
const SYMBOLS = [
    { emoji: '🍒', mult: 2 }, { emoji: '🍋', mult: 3 },
    { emoji: '🍺', mult: 5 }, { emoji: '🍔', mult: 10 },
    { emoji: '💎', mult: 50 }, { emoji: '🦍', mult: 100 }
];
let slotBet = 10;
let slotSpinning = false;
const slotBetEl = document.getElementById('slot-bet');
const slotMsg = document.getElementById('slot-msg');

document.getElementById('slot-up').onclick = () => { if(!slotSpinning) { slotBet += 10; slotBetEl.innerText = slotBet; }};
document.getElementById('slot-down').onclick = () => { if(!slotSpinning && slotBet > 10) { slotBet -= 10; slotBetEl.innerText = slotBet; }};

document.getElementById('btn-spin-slots').onclick = () => {
    if (slotSpinning || balance < slotBet) {
        if(balance < slotBet) slotMsg.innerText = "НЕТ ДЕНЕГ!";
        return;
    }
    slotSpinning = true;
    addBalance(-slotBet);
    slotMsg.innerText = "КРУТИМ...";
    slotMsg.style.color = "#fff";
    
    const reels = [document.getElementById('reel-0'), document.getElementById('reel-1'), document.getElementById('reel-2')];
    reels.forEach(r => { r.innerText = '❓'; r.classList.add('spinning'); });

    const stops = [0,0,0];
    setTimeout(() => { stops[0] = Math.floor(Math.random()*SYMBOLS.length); reels[0].classList.remove('spinning'); reels[0].innerText = SYMBOLS[stops[0]].emoji; }, 1000);
    setTimeout(() => { stops[1] = Math.floor(Math.random()*SYMBOLS.length); reels[1].classList.remove('spinning'); reels[1].innerText = SYMBOLS[stops[1]].emoji; }, 1800);
    setTimeout(() => { 
        stops[2] = Math.floor(Math.random()*SYMBOLS.length); reels[2].classList.remove('spinning'); reels[2].innerText = SYMBOLS[stops[2]].emoji; 
        
        let win = 0;
        if(stops[0] === stops[1] && stops[1] === stops[2]) win = slotBet * SYMBOLS[stops[0]].mult;
        else if(stops[0] === stops[1] || stops[1] === stops[2] || stops[0] === stops[2]) win = slotBet * 2;
        
        if (win > 0) {
            addBalance(win);
            slotMsg.innerText = `ВЫЙГРЫШ: +${win} 💰!`;
            slotMsg.style.color = "#00FF41";
        } else {
            slotMsg.innerText = "СКАМ 😭";
            slotMsg.style.color = "#FF003C";
        }
        slotSpinning = false;
    }, 2800);
};

// ===================================
// 2. КОЛЕСО ФОРТУНЫ
// ===================================
const wheel = document.getElementById('wheel');
const wheelSegments = [
    { label: 'x0', mult: 0 }, { label: 'x2', mult: 2 },
    { label: 'x0', mult: 0 }, { label: 'x3', mult: 3 },
    { label: 'x0', mult: 0 }, { label: 'x5', mult: 5 }
];

// Рендерим текст секторов
wheelSegments.forEach((seg, i) => {
    let el = document.createElement('div');
    el.className = 'wheel-seg';
    el.style.transform = `rotate(${i * 60}deg)`;
    el.innerText = seg.label;
    wheel.appendChild(el);
});

let wheelBet = 10;
let wheelSpinning = false;
let currentRotation = 0;
const wheelBetEl = document.getElementById('wheel-bet');
const wheelMsg = document.getElementById('wheel-msg');

document.getElementById('wheel-up').onclick = () => { if(!wheelSpinning) { wheelBet += 10; wheelBetEl.innerText = wheelBet; }};
document.getElementById('wheel-down').onclick = () => { if(!wheelSpinning && wheelBet > 10) { wheelBet -= 10; wheelBetEl.innerText = wheelBet; }};

document.getElementById('btn-spin-wheel').onclick = () => {
    if(wheelSpinning || balance < wheelBet) {
        if(balance < wheelBet) wheelMsg.innerText = "НЕТ ДЕНЕГ!";
        return;
    }
    wheelSpinning = true;
    addBalance(-wheelBet);
    wheelMsg.innerText = "ВРАЩЕНИЕ...";
    wheelMsg.style.color = "#fff";

    const extraSpins = 5 * 360; 
    const randomSegIndex = Math.floor(Math.random() * 6);
    
    // Вычисляем угол, чтобы стрелка (на 0 градусов) показала на нужный сектор
    const targetDeg = extraSpins + (360 - randomSegIndex * 60);
    currentRotation += targetDeg - (currentRotation % 360);
    
    wheel.style.transform = `rotate(${currentRotation}deg)`;
    
    setTimeout(() => {
        const win = Math.floor(wheelBet * wheelSegments[randomSegIndex].mult);
        if(win > 0) {
            addBalance(win);
            wheelMsg.innerText = `ВЫЙГРЫШ: +${win} 💰!`;
            wheelMsg.style.color = "#00FF41";
        } else {
            wheelMsg.innerText = "СКАМ 😭";
            wheelMsg.style.color = "#FF003C";
        }
        wheelSpinning = false;
    }, 3500); 
};

// ===================================
// 3. МЕЛЛ-КЕЙСЫ
// ===================================
const cases = document.querySelectorAll('.case');
let casesActive = true;
const casesMsg = document.getElementById('cases-msg');

cases.forEach(c => {
    c.onclick = () => {
        if(!casesActive || balance < 50) {
            if(balance < 50) casesMsg.innerText = "НУЖНО 50 💰!";
            return;
        }
        casesActive = false;
        addBalance(-50);
        casesMsg.innerText = "ОТКРЫВАЕМ...";
        casesMsg.style.color = "#fff";
        
        c.innerText = '🔄';
        c.classList.add('shake');
        
        setTimeout(() => {
            c.classList.remove('shake');
            const r = Math.random();
            let win = 0, emoji = '💩';
            
            if (r < 0.05) { win = 500; emoji = '💎'; }       // Шанс 5%
            else if (r < 0.20) { win = 150; emoji = '🦍'; }  // Шанс 15%
            else if (r < 0.45) { win = 50; emoji = '💵'; }   // Шанс 25% (окуп)
            
            c.innerText = emoji;
            if(win > 0) {
                addBalance(win);
                casesMsg.innerText = `ВЫПАЛО: +${win} 💰!`;
                casesMsg.style.color = "#00FF41";
            } else {
                casesMsg.innerText = "ПУСТО 😭";
                casesMsg.style.color = "#FF003C";
            }
            
            setTimeout(() => {
                cases.forEach(box => box.innerText = '📦');
                casesMsg.innerText = "ВЫБЕРИ КЕЙС";
                casesMsg.style.color = "#FFD700";
                casesActive = true;
            }, 2000);
            
        }, 1200);
    };
});
