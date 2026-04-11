/* ============================================
   MELL CASINO — cases.js (FIXED: DROPDOWN & REALISTIC SPIN)
   ============================================ */

// 1. Безопасная инъекция стилей (чтобы ничего не ломалось)
const caseStyleId = 'cases-pro-styles';
if (!document.getElementById(caseStyleId)) {
    const style = document.createElement('style');
    style.id = caseStyleId;
    style.innerHTML = `
        .multi-result-item {
            animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
            opacity: 0; transform: scale(0.5);
            background: linear-gradient(135deg, rgba(20,20,20,0.9), rgba(10,10,10,0.9));
        }
        @keyframes popIn {
            to { opacity: 1; transform: scale(1); }
        }
        .case-item-glow {
            box-shadow: 0 0 30px rgba(234,179,8,0.8) !important;
            border-color: #facc15 !important;
            background: rgba(133,77,14,0.3) !important;
            transform: scale(1.05);
            transition: all 0.2s;
            z-index: 10;
        }
        .sp-strip-anim {
            /* Реалистичная долгая крутка (7.5 сек) с плавным торможением */
            transition: transform 7.5s cubic-bezier(0.12, 0.8, 0.15, 1); 
        }
        .sp-strip-instant { transition: none !important; }
        .case-card { cursor: pointer; transition: all 0.2s; }
        .case-card.selected { border-color: #dfb7ff; box-shadow: 0 0 20px rgba(157,0,255,0.4); transform: translateY(-5px); background: rgba(157,0,255,0.1); }
    `;
    document.head.appendChild(style);
}

// 2. Твоя математика (Сбалансированная база кейсов)
const CASES = [
    {
        id: 'case_20', name: 'БИЧ ПАКЕТ', cost: 20, img: 'assest/melcase.png', color: 'text-stone-400',
        payouts: [
            {mult: 0.3, prob: 0.35, color: '#94a3b8'}, {mult: 0.6, prob: 0.30, color: '#94a3b8'},
            {mult: 0.9, prob: 0.20, color: '#38bdf8'}, {mult: 1.5, prob: 0.10, color: '#c084fc'},
            {mult: 3.0, prob: 0.04, color: '#f472b6'}, {mult: 10.0, prob: 0.01, color: '#facc15'}
        ]
    },
    {
        id: 'case_100', name: 'РАБОТЯГА', cost: 100, img: 'assest/melcase.png', color: 'text-blue-400',
        payouts: [
            {mult: 0.3, prob: 0.40, color: '#94a3b8'}, {mult: 0.5, prob: 0.25, color: '#94a3b8'},
            {mult: 0.8, prob: 0.20, color: '#38bdf8'}, {mult: 2.0, prob: 0.10, color: '#c084fc'},
            {mult: 5.0, prob: 0.04, color: '#f472b6'}, {mult: 20.0, prob: 0.01, color: '#facc15'}
        ]
    },
    {
        id: 'case_250', name: 'ПРЕМИУМ', cost: 250, img: 'assest/melcase.png', color: 'text-purple-400',
        payouts: [
            {mult: 0.3, prob: 0.45, color: '#94a3b8'}, {mult: 0.6, prob: 0.25, color: '#94a3b8'},
            {mult: 0.8, prob: 0.15, color: '#38bdf8'}, {mult: 2.0, prob: 0.10, color: '#c084fc'},
            {mult: 5.0, prob: 0.05, color: '#f472b6'}, {mult: 25.0, prob: 0.03, color: '#facc15'}
        ]
    },
    {
        id: 'case_500', name: 'ЛУДОМАН', cost: 500, img: 'assest/melcase.png', color: 'text-pink-400',
        payouts: [
            {mult: 0.3, prob: 0.50, color: '#94a3b8'}, {mult: 0.6, prob: 0.25, color: '#94a3b8'},
            {mult: 0.8, prob: 0.10, color: '#38bdf8'}, {mult: 2.0, prob: 0.08, color: '#c084fc'},
            {mult: 5.0, prob: 0.04, color: '#f472b6'}, {mult: 30.0, prob: 0.03, color: '#facc15'}
        ]
    },
    {
        id: 'case_1000', name: 'МЕЛСТРОЙ', cost: 1000, img: 'assest/melcase.png', color: 'text-yellow-400',
        payouts: [
            {mult: 0.3, prob: 0.55, color: '#94a3b8'}, {mult: 0.6, prob: 0.25, color: '#94a3b8'},
            {mult: 0.8, prob: 0.10, color: '#38bdf8'}, {mult: 2.0, prob: 0.05, color: '#c084fc'},
            {mult: 5.0, prob: 0.03, color: '#f472b6'}, {mult: 40.0, prob: 0.02, color: '#facc15'}
        ]
    },
    {
        id: 'case_5000', name: 'VIP КИТ', cost: 5000, img: 'assest/melcase.png', color: 'text-red-500',
        payouts: [
            {mult: 0.3, prob: 0.60, color: '#94a3b8'}, {mult: 0.6, prob: 0.25, color: '#94a3b8'},
            {mult: 0.8, prob: 0.10, color: '#38bdf8'}, {mult: 2.0, prob: 0.03, color: '#c084fc'},
            {mult: 5.0, prob: 0.015, color: '#f472b6'}, {mult: 50.0, prob: 0.005, color: '#facc15'}
        ]
    }
];

let currentCase = CASES[0];
let isCaseSpinning = false;
let currentQty = 1;
let isFastOpen = false;

// Получаем все нужные элементы DOM
const caseTiers = document.getElementById('case-tiers');
const spinnerBox = document.getElementById('spinner-box');
const spStrip = document.getElementById('sp-strip');
const caseContents = document.getElementById('case-contents');
const btnOpenCase = document.getElementById('btn-open-case');
const caseMsg = document.getElementById('case-msg');
const priceDisplay = document.getElementById('case-price-display');

// 3. Безопасное добавление Выпадающего Списка (Dropdown) и Галочки
if (btnOpenCase && !document.getElementById('pro-controls-container')) {
    const controlsContainer = document.createElement('div');
    controlsContainer.id = 'pro-controls-container';
    controlsContainer.className = 'w-full max-w-lg mx-auto flex flex-col items-center mb-4';
    
    controlsContainer.innerHTML = `
        <div class="flex flex-row gap-4 items-center justify-center mb-2 w-full">
            <div class="flex items-center gap-2 bg-black/60 border border-white/10 rounded-xl px-3 py-2 backdrop-blur-sm">
                <span class="text-[10px] md:text-xs text-stone-400 font-label uppercase tracking-widest">Кейсов:</span>
                <select id="case-qty-select" class="bg-transparent text-white font-bold outline-none text-sm cursor-pointer">
                    <option value="1" class="bg-stone-900">1 шт.</option>
                    <option value="2" class="bg-stone-900">2 шт.</option>
                    <option value="3" class="bg-stone-900">3 шт.</option>
                    <option value="5" class="bg-stone-900">5 шт.</option>
                    <option value="10" class="bg-stone-900">10 шт.</option>
                </select>
            </div>
            
            <label class="flex items-center gap-2 cursor-pointer bg-black/60 border border-white/10 rounded-xl px-3 py-2 backdrop-blur-sm hover:bg-white/5 transition-colors">
                <input type="checkbox" id="fast-open-checkbox" class="w-4 h-4 accent-green-500 cursor-pointer">
                <span class="text-[10px] md:text-xs text-stone-300 font-label uppercase tracking-widest">Фаст Опен</span>
            </label>
        </div>
        <div id="multi-case-results" class="flex flex-wrap justify-center gap-2 min-h-[10px] w-full"></div>
    `;
    
    // Вставляем аккуратно перед кнопкой открытия
    btnOpenCase.parentNode.insertBefore(controlsContainer, btnOpenCase);

    // Слушатель для выпадающего списка
    const qtySelect = document.getElementById('case-qty-select');
    if(qtySelect) {
        qtySelect.addEventListener('change', (e) => {
            if(isCaseSpinning) {
                e.target.value = currentQty; // Блокируем изменение во время крутки
                return;
            }
            currentQty = parseInt(e.target.value);
            if(priceDisplay) priceDisplay.innerText = currentCase.cost * currentQty;
        });
    }

    // Слушатель для галочки Фаст Опен
    const fastCheckbox = document.getElementById('fast-open-checkbox');
    if(fastCheckbox) {
        fastCheckbox.addEventListener('change', (e) => {
            if(isCaseSpinning) {
                e.target.checked = isFastOpen; // Блокируем изменение во время крутки
                return;
            }
            isFastOpen = e.target.checked;
        });
    }
}

// 4. Отрисовка списка кейсов
function renderCasesList() {
    if(!caseTiers) return;
    caseTiers.innerHTML = '';
    CASES.forEach((c) => {
        const el = document.createElement('div');
        el.className = `case-card flex flex-col items-center bg-black/40 border border-white/10 rounded-2xl p-4 w-[100px] md:w-36 ${currentCase.id === c.id ? 'selected' : 'hover:border-white/30'}`;
        el.innerHTML = `
            <img src="${c.img}" class="w-14 h-14 md:w-20 md:h-20 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] mb-2">
            <span class="text-[9px] md:text-xs font-label font-bold uppercase tracking-widest ${c.color} text-center leading-tight mb-1 h-8 flex items-center justify-center">${c.name}</span>
            <span class="text-white font-headline font-black text-sm md:text-base">${c.cost} 💰</span>
        `;
        el.onclick = () => {
            if(isCaseSpinning) return;
            currentCase = c;
            renderCasesList();
            if(priceDisplay) priceDisplay.innerText = currentCase.cost * currentQty;
            const multiRes = document.getElementById('multi-case-results');
            if(multiRes) multiRes.innerHTML = ''; 
            if(spinnerBox) spinnerBox.style.display = 'none';
            if(caseContents) caseContents.style.display = 'grid'; 
        };
        caseTiers.appendChild(el);
    });
}

function getRandomPayout(payouts) {
    let totalProb = payouts.reduce((sum, p) => sum + p.prob, 0);
    let rand = Math.random() * totalProb;
    let accum = 0;
    for (let p of payouts) {
        accum += p.prob;
        if (rand <= accum) return p;
    }
    return payouts[payouts.length - 1];
}

// 5. Логика крутки
function openCasesAction() {
    if (isCaseSpinning) return;
    const totalCost = currentCase.cost * currentQty;
    
    if (typeof balance !== 'undefined' && balance < totalCost) {
        if(typeof showMsg === 'function') showMsg(caseMsg, 'БРО, У ТЕБЯ НЕТ БАБОК!', 'lose');
        return;
    }

    isCaseSpinning = true;
    if(typeof addBal === 'function') addBal(-totalCost);
    if(typeof showMsg === 'function') showMsg(caseMsg, 'ОТКРЫВАЕМ...', 'normal');
    
    const multiRes = document.getElementById('multi-case-results');
    if(multiRes) multiRes.innerHTML = '';
    if(caseContents) caseContents.style.display = 'none';

    // Генерируем результаты
    let wins = [];
    let totalWinAmt = 0;
    for(let i = 0; i < currentQty; i++) {
        let winObj = getRandomPayout(currentCase.payouts);
        let winAmt = Math.floor(currentCase.cost * winObj.mult);
        wins.push({ ...winObj, amount: winAmt });
        totalWinAmt += winAmt;
    }

    if (isFastOpen) {
        // МГНОВЕННОЕ ОТКРЫТИЕ (Скипаем анимацию)
        if(spinnerBox) spinnerBox.style.display = 'none';
        finishOpening(wins, totalWinAmt, true);
    } else {
        // РЕАЛИСТИЧНАЯ КРУТКА
        if(spinnerBox) spinnerBox.style.display = 'block';
        spStrip.style.transition = 'none';
        spStrip.style.transform = 'translateX(0px)';
        spStrip.innerHTML = '';

        const totalItems = 75; // Генерируем много предметов для долгой крутки
        const winIndex = 65;   // Приз выпадает ближе к концу ленты
        const ITEM_WIDTH = 124; 

        for(let i = 0; i < totalItems; i++) {
            let p = (i === winIndex) ? wins[0] : getRandomPayout(currentCase.payouts);
            let itemEl = document.createElement('div');
            itemEl.className = 'w-[120px] h-[120px] flex-shrink-0 flex flex-col items-center justify-center p-2 mx-[2px] bg-stone-950 border border-white/5 rounded-xl relative overflow-hidden shadow-inner';
            
            itemEl.innerHTML = `
                <div class="absolute inset-0 opacity-20" style="background: radial-gradient(circle, ${p.color} 0%, transparent 70%)"></div>
                <img src="${currentCase.img}" class="w-14 h-14 object-contain drop-shadow-md z-10 mb-1 opacity-90" />
                <span class="text-sm font-black z-10 tracking-widest drop-shadow-md" style="color: ${p.color}">${p.mult}x</span>
                <span class="text-[10px] text-stone-400 font-bold z-10 mt-1">${Math.floor(currentCase.cost * p.mult)} 💰</span>
            `;
            if(i === winIndex) itemEl.id = 'win-item-el';
            spStrip.appendChild(itemEl);
        }

        // Запуск реалистичной анимации
        setTimeout(() => {
            const containerWidth = spinnerBox.clientWidth || 300; 
            const centerOffset = containerWidth / 2;
            const randomStop = (Math.random() - 0.5) * 80; 
            
            const targetX = (winIndex * ITEM_WIDTH) + (ITEM_WIDTH / 2) - centerOffset + randomStop;
            
            spStrip.classList.remove('sp-strip-instant');
            spStrip.classList.add('sp-strip-anim');
            spStrip.style.transform = `translateX(-${targetX}px)`;

            // Возвращаем долгую задержку для интриги (7.5 секунд)
            setTimeout(() => {
                const winEl = document.getElementById('win-item-el');
                if(winEl) winEl.classList.add('case-item-glow');
                finishOpening(wins, totalWinAmt, false);
            }, 7500); 

        }, 50);
    }
}

function finishOpening(wins, totalWinAmt, isInstant) {
    if(typeof addBal === 'function') addBal(totalWinAmt);
    
    const maxMult = Math.max(...wins.map(w => w.mult));
    if (maxMult >= 10) {
        if(typeof showMsg === 'function') showMsg(caseMsg, `ЛЕГЕНДАРНЫЙ ЗАНОС! +${totalWinAmt} 💰`, 'win');
        caseMsg.classList.add('shadow-[0_0_40px_rgba(250,204,21,1)]');
        setTimeout(() => caseMsg.classList.remove('shadow-[0_0_40px_rgba(250,204,21,1)]'), 2000);
    } else if (maxMult >= 2) {
        if(typeof showMsg === 'function') showMsg(caseMsg, `ОКУП! +${totalWinAmt} 💰`, 'win');
    } else {
        if(typeof showMsg === 'function') showMsg(caseMsg, `БРИТЬЕ... +${totalWinAmt} 💰`, 'normal');
    }

    if (currentQty > 1 || isInstant) {
        const multiRes = document.getElementById('multi-case-results');
        if(multiRes) {
            multiRes.innerHTML = '';
            const startIndex = isInstant ? 0 : 1; 
            
            for (let i = startIndex; i < wins.length; i++) {
                let w = wins[i];
                let el = document.createElement('div');
                el.className = 'multi-result-item flex flex-col items-center justify-center p-2 rounded-lg border w-[60px] md:w-[80px] shadow-lg';
                el.style.borderColor = w.color;
                el.style.animationDelay = `${(i - startIndex) * 0.05}s`; 
                
                let glow = w.mult >= 5 ? `box-shadow: 0 0 15px ${w.color}80;` : '';
                el.style = `border-color: ${w.color}; animation-delay: ${(i - startIndex) * 0.05}s; ${glow}`;
                
                el.innerHTML = `
                    <span class="text-[10px] md:text-xs font-black tracking-widest drop-shadow-md" style="color:${w.color}">${w.mult}x</span>
                    <span class="text-white text-[9px] md:text-xs font-bold mt-1">${w.amount}</span>
                `;
                multiRes.appendChild(el);
            }
        }
    }
    
    isCaseSpinning = false;
}

// Инициализация
renderCasesList();
if(btnOpenCase) {
    btnOpenCase.onclick = openCasesAction; // Надежное присвоение без дубликатов
}
if(priceDisplay) priceDisplay.innerText = currentCase.cost;
