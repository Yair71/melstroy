/* ============================================
   MELL CASINO — slots.js
   5x3 Neon Dynasty Slot Machine
   ============================================ */

// Массив с твоими топовыми картинками
const SLOT_SYMBOLS = [
    'games/casino/assest/neon-banana.png',
    'games/casino/assest/neon-cherries.png',
    'games/casino/assest/neon-grapes.png',
    'games/casino/assest/neon-greenapple.png',
    'games/casino/assest/neon-kick.png',
    'games/casino/assest/neon-lemon.png',
    'games/casino/assest/neon-lol.png',
    'games/casino/assest/neon-lychee.png',
    'games/casino/assest/neon-orange.png',
    'games/casino/assest/neon-peach.png',
    'games/casino/assest/neon-pineapple.png',
    'games/casino/assest/neon-strawberry.png',
    'games/casino/assest/neon-watermelon.png',
    'games/casino/assest/adultsonly-neon.png'
];

let slotBet = 10;
let isSpinningSlots = false;
let currentReels = [[], [], [], [], []]; // Хранит 3 символа для каждого из 5 столбцов

const slotBetEl = document.getElementById('slot-bet');
const slotWinDisplay = document.getElementById('slot-win-display');
const slotMsg = document.getElementById('slot-msg');
const btnSpinSlots = document.getElementById('btn-spin-slots');
const slotContainer = document.getElementById('slot-reels-container');
const winBox = document.getElementById('slot-win-box');

// Управление ставкой
document.getElementById('slot-up').onclick = () => { if(!isSpinningSlots) { slotBet = Math.min(slotBet+10, 1000); slotBetEl.innerText = slotBet; } };
document.getElementById('slot-down').onclick = () => { if(!isSpinningSlots) { slotBet = Math.max(slotBet-10, 10); slotBetEl.innerText = slotBet; } };

function getRandomSymbol() {
    return SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)];
}

// Инициализация стартового экрана
function initSlots() {
    slotContainer.innerHTML = '';
    for(let c = 0; c < 5; c++) {
        const col = document.createElement('div');
        col.className = 'bg-stone-950/80 rounded-2xl overflow-hidden relative border-x border-white/5 h-full w-full flex justify-center';
        
        const strip = document.createElement('div');
        strip.className = 'absolute top-0 w-full flex flex-col';
        strip.id = `slot-strip-${c}`;
        
        currentReels[c] = [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()];
        
        currentReels[c].forEach(sym => {
            const item = document.createElement('div');
            item.className = 'slot-item flex items-center justify-center w-full';
            item.innerHTML = `<img src="${sym}" class="max-h-[75%] max-w-[75%] object-contain drop-shadow-[0_0_12px_rgba(255,255,255,0.3)]" />`;
            strip.appendChild(item);
        });
        
        col.appendChild(strip);
        slotContainer.appendChild(col);
    }
    resizeItems();
}

// Расчет высоты карточек (чтобы всегда идеально вписывались в экран)
function resizeItems() {
    const cols = slotContainer.children;
    if(!cols.length) return;
    const itemHeight = cols[0].clientHeight / 3;
    
    document.querySelectorAll('.slot-item').forEach(el => {
        el.style.height = `${itemHeight}px`;
    });
}
window.addEventListener('resize', resizeItems);

// Запуск вращения
btnSpinSlots.onclick = () => {
    if (isSpinningSlots) return;
    if (typeof balance !== 'undefined' && balance < slotBet) {
        if(typeof showMsg === 'function') showMsg(slotMsg, 'НЕТ ДЕНЕГ!', 'lose');
        return;
    }
    
    isSpinningSlots = true;
    if(typeof addBal === 'function') addBal(-slotBet); // Снимаем ставку
    slotWinDisplay.innerText = "0";
    if(typeof showMsg === 'function') showMsg(slotMsg, 'КРУТИМ...', 'normal');
    
    const itemHeight = slotContainer.children[0].clientHeight / 3;
    const totalItems = 35; // Длина ленты для анимации
    let finishedCols = 0;
    
    // Генерируем финальный результат заранее
    const finalReels = [[], [], [], [], []];
    for(let c = 0; c < 5; c++) {
        for(let r = 0; r < 3; r++) finalReels[c].push(getRandomSymbol());
    }
    
    for(let c = 0; c < 5; c++) {
        const strip = document.getElementById(`slot-strip-${c}`);
        const allSymsForStrip = [...currentReels[c]];
        
        // Добавляем рандомные картинки для "прокрутки"
        for(let i = 0; i < totalItems - 6; i++) {
            allSymsForStrip.push(getRandomSymbol());
        }
        
        // В конец ставим наш финальный результат
        allSymsForStrip.push(...finalReels[c]);
        
        strip.innerHTML = '';
        allSymsForStrip.forEach(sym => {
            const item = document.createElement('div');
            item.className = 'slot-item flex items-center justify-center w-full';
            item.style.height = `${itemHeight}px`;
            item.innerHTML = `<img src="${sym}" class="max-h-[75%] max-w-[75%] object-contain drop-shadow-[0_0_12px_rgba(255,255,255,0.3)]" />`;
            strip.appendChild(item);
        });
        
        strip.style.transition = 'none';
        strip.style.transform = `translateY(0px)`;
        strip.offsetHeight; // Форсируем перерисовку браузером
        
        // Настройка задержки: барабаны останавливаются по очереди слева направо
        const delay = c * 250;
        const duration = 2000 + c * 300; 
        
        setTimeout(() => {
            strip.style.transition = `transform ${duration}ms cubic-bezier(0.15, 0.85, 0.25, 1)`;
            const targetY = -(allSymsForStrip.length - 3) * itemHeight;
            strip.style.transform = `translateY(${targetY}px)`;
            
            setTimeout(() => {
                finishedCols++;
                if(finishedCols === 5) {
                    endSpin(finalReels);
                }
            }, duration);
        }, delay);
    }
};

// Проверка выигрыша и сброс ленты
function endSpin(finalReels) {
    for(let c = 0; c < 5; c++) {
        currentReels[c] = finalReels[c];
        const strip = document.getElementById(`slot-strip-${c}`);
        strip.style.transition = 'none';
        strip.style.transform = `translateY(0px)`;
        strip.innerHTML = '';
        
        const colHeight = slotContainer.children[0].clientHeight;
        currentReels[c].forEach(sym => {
            const item = document.createElement('div');
            item.className = 'slot-item flex items-center justify-center w-full';
            item.style.height = `${colHeight/3}px`;
            item.innerHTML = `<img src="${sym}" class="max-h-[75%] max-w-[75%] object-contain drop-shadow-[0_0_12px_rgba(255,255,255,0.3)]" />`;
            strip.appendChild(item);
        });
    }
    
    // Проверка центральной линии (наиболее очевидная для игрока)
    let winMult = 0;
    const midRow = [finalReels[0][1], finalReels[1][1], finalReels[2][1], finalReels[3][1], finalReels[4][1]];
    
    // Считаем одинаковые символы на центральной линии
    const counts = {};
    midRow.forEach(s => counts[s] = (counts[s] || 0) + 1);
    
    let maxMatches = 0;
    Object.values(counts).forEach(v => { if(v > maxMatches) maxMatches = v; });
    
    if (maxMatches === 5) winMult = 50; // МЕГА ДЖЕКПОТ
    else if (maxMatches === 4) winMult = 10;
    else if (maxMatches === 3) winMult = 3;
    
    if (winMult > 0) {
        const winAmount = slotBet * winMult;
        if(typeof addBal === 'function') addBal(winAmount);
        slotWinDisplay.innerText = winAmount;
        if(typeof showMsg === 'function') showMsg(slotMsg, `МЕГА ЗАНОС! +${winAmount}`, 'win');
        
        // Подсвечиваем блок выигрыша
        winBox.classList.add('shadow-[0_0_40px_rgba(234,179,8,0.6)]', 'border-yellow-500');
        setTimeout(() => winBox.classList.remove('shadow-[0_0_40px_rgba(234,179,8,0.6)]', 'border-yellow-500'), 2000);
    } else {
        if(typeof showMsg === 'function') showMsg(slotMsg, 'МИМО...', 'normal');
    }
    
    isSpinningSlots = false;
}

// Запускаем отрисовку стартовых слотов при загрузке
setTimeout(initSlots, 100);
