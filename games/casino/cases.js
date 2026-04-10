/* ============================================
   MELL CASINO — cases.js v3.0 (PRO CS:GO STYLE)
   ============================================ */

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

// Цвета редкости (HEX для теней, Tailwind для текста)
const RARITY_COLORS = {
    common: { hex: '#78716c', text: 'text-stone-400' },     // Серый
    uncommon: { hex: '#3b82f6', text: 'text-blue-400' },    // Синий
    rare: { hex: '#a855f7', text: 'text-purple-400' },      // Фиолетовый
    epic: { hex: '#ef4444', text: 'text-red-500' },         // Красный
    legendary: { hex: '#facc15', text: 'text-yellow-400' }  // Золотой
};

let selTier = 0, caseSpinning = false;
const caseTiersEl = document.getElementById('case-tiers');
const caseContents = document.getElementById('case-contents');
const caseMsg = document.getElementById('case-msg');
const spinnerBox = document.getElementById('spinner-box');
const spStrip = document.getElementById('sp-strip');
const casePriceDisplay = document.getElementById('case-price-display');

// 1. Отрисовка кнопок выбора кейсов
function renderTiers() {
    caseTiersEl.innerHTML = '';
    TIERS.forEach((t, i) => {
        const d = document.createElement('div');
        const isSel = i === selTier;
        
        // Tailwind классы для красивой кнопки
        d.className = `flex flex-col items-center justify-center p-3 w-[100px] md:w-[120px] rounded-xl border-2 transition-all cursor-pointer bg-stone-900/80 hover:bg-stone-800 ${
            isSel ? 'border-primary shadow-[0_0_20px_rgba(157,0,255,0.4)] scale-105' : 'border-white/5 opacity-60 hover:opacity-100'
        }`;
        
        d.innerHTML = `
            <span class="text-3xl mb-1 drop-shadow-md">${t.icon}</span>
            <span class="font-headline font-bold text-white text-xs md:text-sm text-center truncate w-full">${t.name}</span>
            <span class="font-label text-yellow-500 text-xs font-bold">${t.price} 💰</span>
        `;
        
        d.onclick = () => {
            if (caseSpinning) return;
            selTier = i;
            renderTiers(); // Перерисовываем для обновления стилей
            renderContents(i);
            casePriceDisplay.innerText = t.price;
            spinnerBox.style.display = 'none';
            caseContents.style.display = 'grid';
        };
        caseTiersEl.appendChild(d);
    });
}

// 2. Отрисовка "Что внутри"
function renderContents(idx) {
    const tier = TIERS[idx];
    caseContents.innerHTML = '';
    
    tier.items.forEach(item => {
        const color = RARITY_COLORS[item.rarity];
        const card = document.createElement('div');
        
        card.className = 'case-content-card flex flex-col items-center justify-center p-4 rounded-xl relative overflow-hidden transition-transform hover:scale-105';
        card.style.setProperty('--rarity-hex', color.hex);
        
        card.innerHTML = `
            <div class="text-2xl font-black ${color.text} mb-1 drop-shadow-[0_0_8px_var(--rarity-hex)] z-10">${item.label}</div>
            <div class="text-[10px] text-stone-500 font-label uppercase tracking-widest z-10">Шанс: ${(item.chance*100).toFixed(0)}%</div>
            <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-1/2 opacity-20 blur-xl pointer-events-none" style="background-color: ${color.hex}"></div>
        `;
        caseContents.appendChild(card);
    });
}

renderTiers();
renderContents(0);
casePriceDisplay.innerText = TIERS[0].price;

function pickItem(idx) {
    const items = TIERS[idx].items;
    const r = Math.random();
    let c = 0;
    for (const item of items) { c += item.chance; if (r < c) return item; }
    return items[items.length - 1];
}

// Размеры карточек в рулетке
function getSpinnerItemSize() {
    const vw = window.innerWidth;
    if (vw < 380) return { w: 80, gap: 4 };
    if (vw < 600) return { w: 100, gap: 6 };
    return { w: 120, gap: 8 };
}

// 3. Логика вращения рулетки
document.getElementById('btn-open-case').onclick = () => {
    if (caseSpinning) return;
    const tier = TIERS[selTier];
    
    if (typeof balance !== 'undefined' && balance < tier.price) { 
        if(typeof showMsg === 'function') showMsg(caseMsg, 'НЕТ ДЕНЕГ!', 'lose'); 
        return; 
    }
    
    caseSpinning = true;
    if(typeof addBal === 'function') addBal(-tier.price);
    if(typeof showMsg === 'function') showMsg(caseMsg, 'ОТКРЫВАЕМ...', 'normal');

    const winItem = pickItem(selTier);
    const TOTAL = 60;
    const WIN_POS = 50; // Предмет-победитель будет 50-м по счету
    const itemList = [];
    
    // Заполняем ленту случайным мусором, а на позицию WIN_POS ставим победителя
    for (let i = 0; i < TOTAL; i++) {
        if (i === WIN_POS) {
            itemList.push(winItem);
        } else {
            itemList.push(tier.items[Math.floor(Math.random() * tier.items.length)]);
        }
    }

    const { w: ITEM_W, gap: ITEM_GAP } = getSpinnerItemSize();
    const ITEM_TOTAL = ITEM_W + ITEM_GAP;

    spStrip.innerHTML = '';
    spStrip.style.gap = ITEM_GAP + 'px';

    // Создаем DOM-элементы для ленты
    itemList.forEach((item, i) => {
        const color = RARITY_COLORS[item.rarity];
        const el = document.createElement('div');
        
        el.className = 'sp-item shrink-0';
        el.id = i === WIN_POS ? 'sp-winner-item' : '';
        el.style.width = ITEM_W + 'px';
        el.style.height = (ITEM_W * 1.1) + 'px'; // Карточки чуть вытянуты
        el.style.setProperty('--rarity-hex', color.hex);
        
        const valText = item.label.split(' ')[0];
        el.innerHTML = `
            <span class="${color.text} font-black drop-shadow-[0_0_5px_var(--rarity-hex)]" style="font-size:${Math.max(14, ITEM_W/4)}px">${valText}</span>
            <span class="text-sm mt-1 text-yellow-500">💰</span>
        `;
        spStrip.appendChild(el);
    });

    // Прячем сетку содержимого, показываем рулетку
    caseContents.style.display = 'none';
    spinnerBox.style.display = 'block';

    // Рассчитываем точную позицию остановки (чтобы победитель был ровно по центру)
    const vpCenter = spinnerBox.offsetWidth / 2;
    // Добавляем рандомный микро-сдвиг, чтобы останавливалось не ровно по центру пиксель-в-пиксель, а чуть реалистичнее
    const randomOffset = (Math.random() * (ITEM_W - 10)) - (ITEM_W / 2 - 5); 
    const targetOffset = (WIN_POS * ITEM_TOTAL) + (ITEM_W / 2) - vpCenter + randomOffset;

    const duration = 6000; // 6 секунд кручения
    const startTime = performance.now();

    function animateSpinner(now) {
        let t = Math.min((now - startTime) / duration, 1);
        // Кастомное замедление (easeOutQuint) - очень реалистичное торможение
        const eased = 1 - Math.pow(1 - t, 5); 
        const currentOffset = targetOffset * eased;
        
        spStrip.style.transform = `translate3d(-${currentOffset}px, 0, 0)`;

        if (t < 1) {
            requestAnimationFrame(animateSpinner);
        } else {
            // Остановка
            spStrip.style.transform = `translate3d(-${targetOffset}px, 0, 0)`;
            const winEl = document.getElementById('sp-winner-item');
            if (winEl) winEl.classList.add('sp-winner');

            setTimeout(() => {
                if(typeof addBal === 'function') addBal(winItem.prize);
                if(typeof showMsg === 'function') showMsg(caseMsg, `ВЫПАЛО: +${winItem.prize} 💰!`, 'win');

                // Возвращаемся к сетке
                setTimeout(() => {
                    caseSpinning = false;
                    spinnerBox.style.display = 'none';
                    caseContents.style.display = 'grid';
                    if(typeof showMsg === 'function') showMsg(caseMsg, 'ВЫБЕРИ КЕЙС', 'normal');
                }, 3000); // 3 секунды любуемся выигрышем
            }, 300);
        }
    }
    
    // Сброс позиции перед началом
    spStrip.style.transform = `translate3d(0, 0, 0)`;
    requestAnimationFrame(animateSpinner);
};
