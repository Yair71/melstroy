/* ============================================
   MELL CASINO — cases.js (PRO UPGRADE: FAST OPEN & MULTI)
   ============================================ */

// 1. Добавляем стили для новых кнопок и анимаций (обход кэша)
const caseStyleId = 'cases-pro-styles';
if (!document.getElementById(caseStyleId)) {
    const style = document.createElement('style');
    style.id = caseStyleId;
    style.innerHTML = `
        .case-qty-btn {
            background: #1c1917; color: #a8a29e; border: 1px solid #292524;
            border-radius: 8px; padding: 6px 14px; font-size: 0.8rem; font-weight: 800;
            transition: all 0.2s; box-shadow: inset 0 2px 4px rgba(255,255,255,0.05);
        }
        .case-qty-btn.active {
            background: #9d00ff; color: #fff; border-color: #dfb7ff;
            box-shadow: 0 0 15px rgba(157,0,255,0.5), inset 0 2px 4px rgba(255,255,255,0.3);
            transform: translateY(-1px);
        }
        #btn-fast-open { transition: all 0.2s; }
        #btn-fast-open.active {
            background: rgba(22, 101, 52, 0.8); border-color: #22c55e;
            box-shadow: 0 0 15px rgba(34,197,94,0.3);
        }
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
            transition: transform 3s cubic-bezier(0.05, 0.9, 0.15, 1); /* Быстрая и резкая прокрутка */
        }
        .sp-strip-instant { transition: none !important; }
        .case-card { cursor: pointer; transition: all 0.2s; }
        .case-card.selected { border-color: #dfb7ff; box-shadow: 0 0 20px rgba(157,0,255,0.4); transform: translateY(-5px); background: rgba(157,0,255,0.1); }
    `;
    const gameCasesBlock = document.getElementById('game-cases');
    if (gameCasesBlock) gameCasesBlock.appendChild(style);
}

// 2. Новая база кейсов с твоей математикой
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
let controlsInjected = false;

const caseTiers = document.getElementById('case-tiers');
const spinnerBox = document.getElementById('spinner-box');
const spStrip = document.getElementById('sp-strip');
const caseContents = document.getElementById('case-contents');
const btnOpenCase = document.getElementById('btn-open-case');
const caseMsg = document.getElementById('case-msg');
const priceDisplay = document.getElementById('case-price-display');

// 3. Инъекция UI элементов для массового/быстрого открытия
if (btnOpenCase && !controlsInjected) {
    const btnWrapper = btnOpenCase.parentElement;
    
    const proControls = document.createElement('div');
    proControls.className = 'flex flex-col gap-3 w-full max-w-lg mx-auto mb-4';
    proControls.innerHTML = `
        <div class="flex justify-between items-center bg-black/50 p-2 md:p-3 rounded-xl border border-white/10 backdrop-blur-md">
            <span class="text-[10px] md:text-xs text-stone-400 font-label uppercase ml-2 tracking-widest hidden md:block">Количество:</span>
            <div class="flex gap-2 mx-auto md:mx-0">
                <button class="case-qty-btn active" data-qty="1">1</button>
                <button class="case-qty-btn" data-qty="2">2</button>
                <button class="case-qty-btn" data-qty="3">3</button>
                <button class="case-qty-btn" data-qty="5">5</button>
                <button class="case-qty-btn" data-qty="10">10</button>
            </div>
        </div>
        <button id="btn-fast-open" class="text-[10px] md:text-xs text-stone-400 uppercase font-bold p-3 border border-stone-800 rounded-xl bg-stone-900/80 hover:bg-stone-800 transition-colors tracking-widest flex items-center justify-center gap-2">
            <span class="material-symbols-outlined text-[16px] md:text-[20px]">bolt</span> МГНОВЕННОЕ ОТКРЫТИЕ: <span id="fast-open-state" class="text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]">ВЫКЛ</span>
        </button>
        <div id="multi-case-results" class="flex flex-wrap justify-center gap-2 min-h-[10px] mt-2"></div>
    `;
    
    btnWrapper.insertBefore(proControls, btnOpenCase);
    controlsInjected = true;

    // Ивенты для новых кнопок
    document.querySelectorAll('.case-qty-btn').forEach(btn => {
        btn.onclick = (e) => {
            if(isCaseSpinning) return;
            document.querySelectorAll('.case-qty-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentQty = parseInt(e.target.getAttribute('data-qty'));
            if(priceDisplay) priceDisplay.innerText = currentCase.cost * currentQty;
        }
    });

    document.getElementById('btn-fast-open').onclick = (e) => {
        if(isCaseSpinning) return;
        isFastOpen = !isFastOpen;
        const btn = document.getElementById('btn-fast-open');
        const stateText = document.getElementById('fast-open-state');
        if(isFastOpen) {
            btn.classList.add('active');
            stateText.innerText = 'ВКЛ';
            stateText.className = 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]';
        } else {
            btn.classList.remove('active');
            stateText.innerText = 'ВЫКЛ';
            stateText.className = 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]';
        }
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
            if(caseContents) caseContents.style.display = 'grid'; // Возвращаем демо лута
        };
        caseTiers.appendChild(el);
    });
}

// Умный рандом на основе шансов
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

// 5. Логика открытия (Крутка + Фаст Опен)
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
        // МГНОВЕННОЕ ОТКРЫТИЕ
        if(spinnerBox) spinnerBox.style.display = 'none';
        finishOpening(wins, totalWinAmt, true);
    } else {
        // ОБЫЧНАЯ КРУТКА (Быстрая, 3 секунды)
        if(spinnerBox) spinnerBox.style.display = 'block';
        spStrip.style.transition = 'none';
        spStrip.style.transform = 'translateX(0px)';
        spStrip.innerHTML = '';

        const totalItems = 45; 
        const winIndex = 40; // Предмет-победитель
        const ITEM_WIDTH = 124; // 120px + margin

        for(let i = 0; i < totalItems; i++) {
            // Для выигрышного слота берем первый результат из массива wins
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

        // Запуск анимации с небольшой задержкой для рендера
        setTimeout(() => {
            const containerWidth = spinnerBox.clientWidth; 
            const centerOffset = containerWidth / 2;
            const randomStop = (Math.random() - 0.5) * 80; 
            
            const targetX = (winIndex * ITEM_WIDTH) + (ITEM_WIDTH / 2) - centerOffset + randomStop;
            
            spStrip.classList.remove('sp-strip-instant');
            spStrip.classList.add('sp-strip-anim');
            spStrip.style.transform = `translateX(-${targetX}px)`;

            // РОВНО ЧЕРЕЗ 3 СЕКУНДЫ МОМЕНТАЛЬНО РАЗБЛОКИРУЕМ КНОПКУ
            setTimeout(() => {
                const winEl = document.getElementById('win-item-el');
                if(winEl) winEl.classList.add('case-item-glow');
                finishOpening(wins, totalWinAmt, false);
            }, 3000); 

        }, 50);
    }
}

// Завершение открытия: выдача бабок и отрисовка остальных кейсов
function finishOpening(wins, totalWinAmt, isInstant) {
    if(typeof addBal === 'function') addBal(totalWinAmt);
    
    // Эмоции Мелстроя в зависимости от икса
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

    // Если открыли больше 1 кейса ИЛИ включен Fast Open — показываем результаты снизу
    if (currentQty > 1 || isInstant) {
        const multiRes = document.getElementById('multi-case-results');
        if(multiRes) {
            multiRes.innerHTML = '';
            // Если была анимация, первый кейс уже в рулетке, поэтому показываем остальные (со 2-го). 
            // Если фаст опен - показываем все.
            const startIndex = isInstant ? 0 : 1; 
            
            for (let i = startIndex; i < wins.length; i++) {
                let w = wins[i];
                let el = document.createElement('div');
                el.className = 'multi-result-item flex flex-col items-center justify-center p-2 rounded-lg border w-[60px] md:w-[80px] shadow-lg';
                el.style.borderColor = w.color;
                el.style.animationDelay = `${(i - startIndex) * 0.05}s`; // Красивое поочередное появление
                
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
    
    // МОМЕНТАЛЬНЫЙ АНЛОК. Можно сразу жать "Открыть" еще раз.
    isCaseSpinning = false;
}

// Инициализация
renderCasesList();
if(btnOpenCase) {
    // Удаляем старые листенеры и вешаем новый
    const newBtn = btnOpenCase.cloneNode(true);
    btnOpenCase.parentNode.replaceChild(newBtn, btnOpenCase);
    newBtn.onclick = openCasesAction;
}
if(priceDisplay) priceDisplay.innerText = currentCase.cost;
