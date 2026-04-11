/* ============================================
   MELL CASINO — cases.js  v4.1
   CS:GO-AUTHENTIC CASE OPENER
   Фикс: Исправлено отображение рулетки (перебиваем inline style из HTML)
   ============================================ */

// ── STYLE INJECTION ──────────────────────────────────────────
const caseStyleId = 'cases-pro-styles-v4';
if (!document.getElementById(caseStyleId)) {
    const style = document.createElement('style');
    style.id = caseStyleId;
    style.innerHTML = `
        /* ═══════ СИСТЕМА РЕДКОСТИ ═══════ */
        :root {
            --r-consumer: #b0c3d9;
            --r-industrial: #5e98d9;
            --r-milspec: #4b69ff;
            --r-restricted: #8847ff;
            --r-classified: #d32ce6;
            --r-covert: #eb4b4b;
            --r-gold: #ffd700;
            --r-consumer-bg: rgba(176,195,217,0.1);
            --r-industrial-bg: rgba(94,152,217,0.1);
            --r-milspec-bg: rgba(75,105,255,0.1);
            --r-restricted-bg: rgba(136,71,255,0.1);
            --r-classified-bg: rgba(211,44,230,0.1);
            --r-covert-bg: rgba(235,75,75,0.1);
            --r-gold-bg: rgba(255,215,0,0.15);
        }

        /* ═══════ КАРТОЧКИ ВЫБОРА КЕЙСОВ ═══════ */
        .case-card-v3 {
            cursor: pointer;
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
            background: linear-gradient(180deg, rgba(20,20,30,0.95) 0%, rgba(10,10,18,0.98) 100%);
            border: 2px solid rgba(255,255,255,0.06);
            border-radius: 14px;
            padding: 12px 8px 10px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 6px;
            min-width: 0;
        }
        .case-card-v3:hover {
            border-color: rgba(255,255,255,0.15);
            transform: translateY(-3px);
        }
        .case-card-v3.selected-v3 {
            border-color: var(--case-accent, #dfb7ff);
            box-shadow: 0 0 25px var(--case-accent-glow, rgba(157,0,255,0.3)),
                        inset 0 0 20px var(--case-accent-glow, rgba(157,0,255,0.1));
            transform: translateY(-4px) scale(1.03);
            background: linear-gradient(180deg, rgba(30,30,40,0.95) 0%, rgba(15,15,25,0.98) 100%);
        }
        .case-card-v3 .case-img-v3 {
            width: 60px; height: 60px;
            object-fit: contain;
            filter: drop-shadow(0 4px 10px rgba(0,0,0,0.6));
            transition: transform 0.3s, filter 0.3s;
        }
        .case-card-v3:hover .case-img-v3,
        .case-card-v3.selected-v3 .case-img-v3 {
            transform: scale(1.15) rotate(-3deg);
            filter: drop-shadow(0 0 15px var(--case-accent-glow, rgba(255,255,255,0.3)));
        }
        .case-card-v3 .case-name-v3 {
            font-size: 11px; font-weight: 900; text-transform: uppercase;
            letter-spacing: 1px; text-align: center;
        }
        .case-card-v3 .case-price-v3 { font-size: 14px; font-weight: 900; color: white; }

        /* ═══════ РУЛЕТКА / СПИННЕР ═══════ */
        .spinner-wrapper-v3 {
            position: relative; width: 100%; height: 150px;
            background: linear-gradient(180deg, #0a0a12 0%, #151520 50%, #0a0a12 100%);
            border-radius: 16px; border: 2px solid rgba(255,255,255,0.08);
            overflow: hidden; box-shadow: inset 0 0 60px rgba(0,0,0,0.9), 0 10px 30px rgba(0,0,0,0.6);
        }
        .spinner-marker-v3 {
            position: absolute; top: 0; bottom: 0; left: 50%; transform: translateX(-50%);
            width: 3px; background: linear-gradient(180deg, #facc15, #f59e0b); z-index: 30;
            box-shadow: 0 0 15px rgba(250,204,21,0.8);
        }
        .spinner-marker-top-v3, .spinner-marker-bot-v3 {
            position: absolute; left: 50%; transform: translateX(-50%);
            width: 0; height: 0; border-left: 12px solid transparent; border-right: 12px solid transparent; z-index: 31;
        }
        .spinner-marker-top-v3 { top: -2px; border-top: 16px solid #facc15; filter: drop-shadow(0 3px 5px rgba(250,204,21,0.8)); }
        .spinner-marker-bot-v3 { bottom: -2px; border-bottom: 16px solid #facc15; filter: drop-shadow(0 -3px 5px rgba(250,204,21,0.8)); }

        .spinner-fade-l-v3 { position: absolute; top: 0; bottom: 0; left: 0; width: 100px; background: linear-gradient(90deg, #0a0a12 0%, transparent 100%); z-index: 20; pointer-events: none; }
        .spinner-fade-r-v3 { position: absolute; top: 0; bottom: 0; right: 0; width: 100px; background: linear-gradient(270deg, #0a0a12 0%, transparent 100%); z-index: 20; pointer-events: none; }

        .spinner-strip-v3 {
            position: absolute; top: 0; left: 0; height: 100%;
            display: flex; align-items: center; gap: 6px; padding-left: 6px;
            will-change: transform;
        }
        .spinner-strip-v3.animating {
            transition: transform 7s cubic-bezier(0.05, 0.85, 0.15, 1);
        }
        .spinner-strip-v3.no-transition { transition: none !important; }

        /* Элементы внутри рулетки */
        .sp-item-v3 {
            width: 130px; height: 120px; flex-shrink: 0; border-radius: 10px;
            display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px;
            position: relative; overflow: hidden;
            background: linear-gradient(180deg, rgba(20,20,30,0.95) 0%, rgba(10,10,15,0.98) 100%);
            border: 2px solid rgba(255,255,255,0.05); border-bottom: 4px solid var(--item-rarity, #555);
        }
        .sp-item-v3::before {
            content: ''; position: absolute; top: 0; left: 0; right: 0; height: 60%;
            background: radial-gradient(ellipse at 50% 0%, var(--item-rarity-bg, rgba(100,100,100,0.15)), transparent 70%); pointer-events: none;
        }
        .sp-item-v3 img {
            width: 65px; height: 65px; object-fit: contain; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.6)); position: relative; z-index: 2;
        }
        .sp-item-v3 .sp-name-v3 { font-size: 10px; font-weight: 800; color: rgba(255,255,255,0.7); z-index: 2; text-transform: uppercase; text-align: center; }
        .sp-item-v3 .sp-amount-v3 { font-size: 14px; font-weight: 900; z-index: 2; text-shadow: 0 1px 4px rgba(0,0,0,0.8); }

        .sp-item-v3.winner-glow-v3 {
            border-color: var(--item-rarity, #facc15) !important;
            box-shadow: 0 0 30px var(--item-rarity-glow, rgba(250,204,21,0.5)), inset 0 0 20px var(--item-rarity-glow, rgba(250,204,21,0.2));
            transform: scale(1.05); z-index: 10;
        }

        /* ═══════ СОДЕРЖИМОЕ КЕЙСА (СЕТКА) ═══════ */
        .contents-header { width: 100%; text-align: center; font-size: 14px; font-weight: 900; color: #fff; text-transform: uppercase; letter-spacing: 2px; margin: 15px 0 10px; opacity: 0.7; }
        .contents-grid-v3 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; width: 100%; }
        @media (min-width: 640px) { .contents-grid-v3 { grid-template-columns: repeat(3, 1fr); } }
        @media (min-width: 1024px) { .contents-grid-v3 { grid-template-columns: repeat(6, 1fr); } }

        .content-item-v3 {
            background: linear-gradient(180deg, rgba(20,20,30,0.9), rgba(10,10,15,0.95));
            border: 1px solid rgba(255,255,255,0.05); border-bottom: 3px solid var(--item-rarity, #555);
            border-radius: 12px; padding: 12px 8px; display: flex; flex-direction: column; align-items: center; gap: 4px;
            position: relative; overflow: hidden; transition: all 0.2s;
        }
        .content-item-v3::before {
            content: ''; position: absolute; top: 0; left: 0; right: 0; height: 60%;
            background: radial-gradient(ellipse at 50% 0%, var(--item-rarity-bg, rgba(100,100,100,0.15)), transparent 70%); pointer-events: none;
        }
        .content-item-v3:hover { transform: translateY(-3px); border-color: var(--item-rarity, #555); box-shadow: 0 8px 20px rgba(0,0,0,0.4); }
        .content-item-v3 img { width: 55px; height: 55px; object-fit: contain; filter: drop-shadow(0 3px 6px rgba(0,0,0,0.5)); position: relative; z-index: 2; margin-bottom: 4px; }
        .content-item-v3 .ci-name { font-size: 11px; font-weight: 800; text-transform: uppercase; color: rgba(255,255,255,0.8); z-index: 2; text-align: center; }
        .content-item-v3 .ci-val { font-size: 14px; font-weight: 900; letter-spacing: 1px; z-index: 2; }
        .content-item-v3 .ci-chance { font-size: 11px; font-weight: 700; background: rgba(0,0,0,0.5); padding: 2px 8px; border-radius: 6px; margin-top: 4px; z-index: 2; border: 1px solid rgba(255,255,255,0.05); }

        /* Кнопка открытия и контролы */
        .btn-open-v3 {
            position: relative; overflow: hidden; width: 100%; max-width: 420px; padding: 18px 32px; border: none; border-radius: 14px;
            font-size: 18px; font-weight: 900; letter-spacing: 3px; text-transform: uppercase; color: white; cursor: pointer; transition: all 0.25s;
            background: linear-gradient(135deg, #7c3aed, #a855f7); box-shadow: 0 8px 30px rgba(124,58,237,0.4);
        }
        .btn-open-v3:hover { transform: translateY(-3px); box-shadow: 0 12px 40px rgba(124,58,237,0.6); }
        .btn-open-v3:active { transform: scale(0.97); }
        .btn-open-v3:disabled { opacity: 0.5; cursor: not-allowed; transform: none !important; box-shadow: none !important; filter: grayscale(1); }
    `;
    document.head.appendChild(style);
}

// ── КОНФИГ КЕЙСОВ И ДРОПОВ (Заполняй своими картинками) ──
const CASES = [
    {
        id: 'case_20', name: 'БИЧ ПАКЕТ', cost: 20, img: 'img.png', 
        accent: '#6b7280', accentGlow: 'rgba(107,114,128,0.3)',
        payouts: [
            { mult: 0.3, prob: 0.35, rarity: 'consumer', name: 'Мусор', itemImg: 'assest/consumer20.png' },
            { mult: 0.6, prob: 0.30, rarity: 'industrial', name: 'Ширп', itemImg: 'assest/industrial20.png' },
            { mult: 0.9, prob: 0.20, rarity: 'milspec', name: 'Норма', itemImg: 'assest/milspec20.png' },
            { mult: 1.5, prob: 0.10, rarity: 'restricted', name: 'Окуп', itemImg: 'assest/restricted20.png' },
            { mult: 3.0, prob: 0.04, rarity: 'classified', name: 'Топчик', itemImg: 'assest/classified20.png' },
            { mult: 10.0, prob: 0.01, rarity: 'gold', name: 'ЛЕГЕНДА', itemImg: 'assest/gold20.png' }
        ]
    },
    {
        id: 'case_100', name: 'РАБОТЯГА', cost: 100, img: 'img.png',
        accent: '#3b82f6', accentGlow: 'rgba(59,130,246,0.3)',
        payouts: [
            { mult: 0.3, prob: 0.40, rarity: 'consumer', name: 'Дешевка', itemImg: 'assest/consumer100.png' },
            { mult: 0.5, prob: 0.25, rarity: 'industrial', name: 'Лох', itemImg: 'assest/industrial100.png' },
            { mult: 0.8, prob: 0.20, rarity: 'milspec', name: 'Терпила', itemImg: 'assest/milspec100.png' },
            { mult: 2.0, prob: 0.10, rarity: 'restricted', name: 'Счастливчик', itemImg: 'assest/restricted100.png' },
            { mult: 5.0, prob: 0.04, rarity: 'classified', name: 'Сияние', itemImg: 'assest/classified100.png' },
            { mult: 20.0, prob: 0.01, rarity: 'gold', name: 'ДЖЕКПОТ', itemImg: 'assest/gold100.png' }
        ]
    },
    {
        id: 'case_250', name: 'ПРЕМИУМ', cost: 250, img: 'img.png',
        accent: '#a855f7', accentGlow: 'rgba(168,85,247,0.3)',
        payouts: [
            { mult: 0.3, prob: 0.45, rarity: 'consumer', name: 'Слив', itemImg: 'assest/consumer250.png' },
            { mult: 0.6, prob: 0.25, rarity: 'industrial', name: 'Утешение', itemImg: 'assest/industrial250.png' },
            { mult: 0.8, prob: 0.15, rarity: 'milspec', name: 'Почти', itemImg: 'assest/milspec250.png' },
            { mult: 2.0, prob: 0.10, rarity: 'restricted', name: 'Х2 ОКУП', itemImg: 'assest/restricted250.png' },
            { mult: 5.0, prob: 0.03, rarity: 'classified', name: 'ПУШКА', itemImg: 'assest/classified250.png' },
            { mult: 25.0, prob: 0.02, rarity: 'gold', name: 'МЕЛСТРОЙ', itemImg: 'assest/gold250.png' }
        ]
    },
    {
        id: 'case_500', name: 'ЛУДОМАН', cost: 500, img: 'img.png',
        accent: '#ec4899', accentGlow: 'rgba(236,72,153,0.3)',
        payouts: [
            { mult: 0.3, prob: 0.50, rarity: 'consumer', name: 'Огрызки', itemImg: 'assest/consumer500.png' },
            { mult: 0.6, prob: 0.25, rarity: 'industrial', name: 'Бюджетка', itemImg: 'assest/industrial500.png' },
            { mult: 0.8, prob: 0.10, rarity: 'milspec', name: 'Пустышка', itemImg: 'assest/milspec500.png' },
            { mult: 2.0, prob: 0.08, rarity: 'restricted', name: 'Работяга', itemImg: 'assest/restricted500.png' },
            { mult: 5.0, prob: 0.04, rarity: 'classified', name: 'Элитка', itemImg: 'assest/classified500.png' },
            { mult: 30.0, prob: 0.03, rarity: 'gold', name: 'АРТЕФАКТ', itemImg: 'assest/gold500.png' }
        ]
    },
    {
        id: 'case_1000', name: 'МЕЛСТРОЙ', cost: 1000, img: 'img.png',
        accent: '#eab308', accentGlow: 'rgba(234,179,8,0.3)',
        payouts: [
            { mult: 0.3, prob: 0.55, rarity: 'consumer', name: 'Биомусор', itemImg: 'assest/consumer1000.png' },
            { mult: 0.6, prob: 0.25, rarity: 'industrial', name: 'Ржавчина', itemImg: 'assest/industrial1000.png' },
            { mult: 0.8, prob: 0.10, rarity: 'milspec', name: 'Массовка', itemImg: 'assest/milspec1000.png' },
            { mult: 2.0, prob: 0.05, rarity: 'restricted', name: 'Козырь', itemImg: 'assest/restricted1000.png' },
            { mult: 5.0, prob: 0.03, rarity: 'classified', name: 'Хайпожор', itemImg: 'assest/classified1000.png' },
            { mult: 40.0, prob: 0.02, rarity: 'gold', name: 'LORE', itemImg: 'assest/gold1000.png' }
        ]
    },
    {
        id: 'case_5000', name: 'VIP КИТ', cost: 5000, img: 'img.png',
        accent: '#ef4444', accentGlow: 'rgba(239,68,68,0.3)',
        payouts: [
            { mult: 0.3, prob: 0.60, rarity: 'consumer', name: 'Боль', itemImg: 'assest/consumer5000.png' },
            { mult: 0.6, prob: 0.25, rarity: 'industrial', name: 'Слезы', itemImg: 'assest/industrial5000.png' },
            { mult: 0.8, prob: 0.10, rarity: 'milspec', name: 'Надежда', itemImg: 'assest/milspec5000.png' },
            { mult: 2.0, prob: 0.03, rarity: 'restricted', name: 'Радость', itemImg: 'assest/restricted5000.png' },
            { mult: 5.0, prob: 0.015, rarity: 'classified', name: 'Эйфория', itemImg: 'assest/classified5000.png' },
            { mult: 50.0, prob: 0.005, rarity: 'gold', name: 'ULTRA FLEX', itemImg: 'assest/gold5000.png' }
        ]
    }
];

// Цвета редкости для CSS (CS:GO style)
const RARITY_COLORS = {
    consumer:   { color: '#b0c3d9', bg: 'rgba(176,195,217,0.15)', glow: 'rgba(176,195,217,0.3)' },
    industrial: { color: '#5e98d9', bg: 'rgba(94,152,217,0.15)',  glow: 'rgba(94,152,217,0.3)' },
    milspec:    { color: '#4b69ff', bg: 'rgba(75,105,255,0.15)',  glow: 'rgba(75,105,255,0.3)' },
    restricted: { color: '#8847ff', bg: 'rgba(136,71,255,0.15)', glow: 'rgba(136,71,255,0.3)' },
    classified: { color: '#d32ce6', bg: 'rgba(211,44,230,0.15)', glow: 'rgba(211,44,230,0.3)' },
    covert:     { color: '#eb4b4b', bg: 'rgba(235,75,75,0.15)',  glow: 'rgba(235,75,75,0.3)' },
    gold:       { color: '#ffd700', bg: 'rgba(255,215,0,0.2)',   glow: 'rgba(255,215,0,0.5)' }
};

// ── STATE ──
let currentCase = CASES[0];
let isCaseSpinning = false;

// ── DOM РЕФЕРЕНСЫ ──
const caseTiers = document.getElementById('case-tiers');
const spinnerBox = document.getElementById('spinner-box');
const spStripV3 = document.getElementById('sp-strip');
const caseContents = document.getElementById('case-contents');
const btnOpenCase = document.getElementById('btn-open-case');
const priceDisplay = document.getElementById('case-price-display');

// Обновление верстки контейнеров (Используем style.display для перекрытия HTML)
if (spinnerBox) {
    spinnerBox.className = 'spinner-wrapper-v3'; 
    spinnerBox.style.display = 'none'; // ФИКС: Жестко прячем блок при загрузке
}
if (caseContents) caseContents.className = 'contents-grid-v3';
if (btnOpenCase) btnOpenCase.className = 'btn-open-v3';

// ── ХЕЛПЕРЫ ──
function getRarityVars(rarity) { return RARITY_COLORS[rarity] || RARITY_COLORS.consumer; }
function updatePrice() { if (priceDisplay) priceDisplay.innerText = currentCase.cost; }

function getRandomPayout(payouts) {
    let total = payouts.reduce((s, p) => s + p.prob, 0);
    let r = Math.random() * total;
    let acc = 0;
    for (const p of payouts) {
        acc += p.prob;
        if (r <= acc) return p;
    }
    return payouts[payouts.length - 1];
}

// ── РЕНДЕР КАРТОЧЕК ВЫБОРА ──
function renderCasesList() {
    if (!caseTiers) return;
    caseTiers.innerHTML = '';
    
    CASES.forEach((c) => {
        const el = document.createElement('div');
        const isSelected = currentCase.id === c.id;
        el.className = `case-card-v3 w-[90px] md:w-[120px] ${isSelected ? 'selected-v3' : ''}`;
        el.style.setProperty('--case-accent', c.accent);
        el.style.setProperty('--case-accent-glow', c.accentGlow);

        el.innerHTML = `
            <img src="${c.img}" class="case-img-v3" alt="${c.name}">
            <div class="case-name-v3" style="color: ${c.accent}">${c.name}</div>
            <div class="case-price-v3">${c.cost} 💰</div>
        `;

        el.onclick = () => {
            if (isCaseSpinning) return;
            currentCase = c;
            renderCasesList();
            renderContents();
            updatePrice();
            
            // ФИКС: Сбрасываем рулетку и показываем сетку дропов
            if (spinnerBox) spinnerBox.style.display = 'none';
            if (caseContents) caseContents.style.display = 'grid';
            
            // Заголовок над сеткой
            const header = document.getElementById('contents-header-id');
            if(header) header.style.display = 'block';
        };

        caseTiers.appendChild(el);
    });
}

// ── РЕНДЕР СОДЕРЖИМОГО КЕЙСА (Что может выпасть) ──
function renderContents() {
    if (!caseContents) return;
    
    // Добавляем заголовок перед сеткой, если его нет
    let header = document.getElementById('contents-header-id');
    if (!header) {
        header = document.createElement('div');
        header.id = 'contents-header-id';
        header.className = 'contents-header';
        caseContents.parentNode.insertBefore(header, caseContents);
    }
    header.innerText = `СОДЕРЖИМОЕ КЕЙСА "${currentCase.name}"`;
    header.style.display = 'block';

    caseContents.innerHTML = '';

    currentCase.payouts.forEach((p) => {
        const rv = getRarityVars(p.rarity);
        const amount = Math.floor(currentCase.cost * p.mult);
        
        const el = document.createElement('div');
        el.className = 'content-item-v3';
        el.style.setProperty('--item-rarity', rv.color);
        el.style.setProperty('--item-rarity-bg', rv.bg);

        // Используем p.itemImg если есть, иначе дефолт case img
        const imageSrc = p.itemImg || currentCase.img;

        el.innerHTML = `
            <img src="${imageSrc}" alt="${p.name}">
            <div class="ci-name">${p.name}</div>
            <div class="ci-val" style="color: ${rv.color}">${amount} 💰</div>
            <div class="ci-chance" style="color: ${rv.color}">${(p.prob * 100).toFixed(1)}%</div>
        `;
        caseContents.appendChild(el);
    });
}

// ── ГЕНЕРАТОР ЭЛЕМЕНТОВ ДЛЯ РУЛЕТКИ ──
function makeSpinnerItem(payout, caseData) {
    const rv = getRarityVars(payout.rarity);
    const amount = Math.floor(caseData.cost * payout.mult);
    const el = document.createElement('div');
    el.className = 'sp-item-v3';
    el.style.setProperty('--item-rarity', rv.color);
    el.style.setProperty('--item-rarity-bg', rv.bg);
    el.style.setProperty('--item-rarity-glow', rv.glow);

    const imageSrc = payout.itemImg || caseData.img;

    el.innerHTML = `
        <img src="${imageSrc}" alt="">
        <span class="sp-name-v3">${payout.name}</span>
        <span class="sp-amount-v3" style="color: ${rv.color}">${amount} 💰</span>
    `;
    return el;
}

// ── ГЛАВНАЯ ФУНКЦИЯ КРУТКИ ──
function openCasesAction() {
    if (isCaseSpinning) return;
    
    // Проверка баланса (работает если есть глобальный balance)
    if (typeof balance !== 'undefined' && balance < currentCase.cost) {
        alert("Недостаточно баланса!"); // Либо используй свою систему уведомлений
        return;
    }

    isCaseSpinning = true;
    if (btnOpenCase) btnOpenCase.disabled = true;
    if (typeof addBal === 'function') addBal(-currentCase.cost); // Снимаем деньги

    // ФИКС: Скрываем список лута, показываем рулетку через style.display
    const header = document.getElementById('contents-header-id');
    if(header) header.style.display = 'none';
    if (caseContents) caseContents.style.display = 'none';
    if (spinnerBox) spinnerBox.style.display = 'block';

    const strip = spStripV3 || document.getElementById('sp-strip');
    if (!strip) { isCaseSpinning = false; return; }

    // Сбрасываем ленту БЕЗ АНИМАЦИИ
    strip.className = 'spinner-strip-v3 no-transition';
    strip.style.transform = 'translateX(0px)';
    strip.innerHTML = '';

    // Определяем выигрыш
    const winnerPayout = getRandomPayout(currentCase.payouts);
    const winAmount = Math.floor(currentCase.cost * winnerPayout.mult);

    // Настройки крутки
    const ITEM_W = 136; // Ширина 130 + gap 6
    const TOTAL_ITEMS = 70; // Длина рулетки
    const WIN_INDEX = 60; // На каком элементе остановится

    // Генерируем элементы
    for (let i = 0; i < TOTAL_ITEMS; i++) {
        let payout = (i === WIN_INDEX) ? winnerPayout : getRandomPayout(currentCase.payouts);
        const itemEl = makeSpinnerItem(payout, currentCase);
        if (i === WIN_INDEX) itemEl.id = 'win-item-v3';
        strip.appendChild(itemEl);
    }

    // 🚀 МАГИЯ ФИКСА АНИМАЦИИ: Принудительный рефлоу теперь точно сработает, 
    // потому что блок стал видимым благодаря spinnerBox.style.display = 'block'.
    void strip.offsetWidth; 

    // Высчитываем, куда должна прокрутиться лента
    const containerW = spinnerBox.clientWidth || 300;
    const centerOffset = containerW / 2;
    // Немного рандома, чтобы останавливалось не ровно по центру пиксель-в-пиксель
    const randomStop = (Math.random() - 0.5) * 80; 
    const targetX = (WIN_INDEX * ITEM_W) + (ITEM_W / 2) - centerOffset + randomStop;

    // Включаем анимацию и задаем конечную точку
    strip.className = 'spinner-strip-v3 animating';
    strip.style.transform = `translateX(-${targetX}px)`;

    // Ждем окончания CSS анимации (7 секунд)
    setTimeout(() => {
        const winEl = document.getElementById('win-item-v3');
        if (winEl) winEl.classList.add('winner-glow-v3');

        // Выдаем деньги
        if (typeof addBal === 'function') addBal(winAmount);

        // Разблокируем кнопку
        setTimeout(() => {
            isCaseSpinning = false;
            if (btnOpenCase) btnOpenCase.disabled = false;
        }, 1000); // Даем секунду насладиться победой перед новой круткой
        
    }, 7100);
}

// ── ИНИЦИАЛИЗАЦИЯ ──
renderCasesList();
renderContents();
updatePrice();
if (btnOpenCase) btnOpenCase.onclick = openCasesAction;
