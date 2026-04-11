/* ============================================
   MELL CASINO — cases.js  v3.0
   CS:GO-AUTHENTIC CASE OPENER
   Designed like the real thing. No compromises.
   ============================================ */

// ── STYLE INJECTION ──────────────────────────────────────────
const caseStyleId = 'cases-pro-styles-v3';
if (!document.getElementById(caseStyleId)) {
    const style = document.createElement('style');
    style.id = caseStyleId;
    style.innerHTML = `
        /* ═══════ RARITY COLOR SYSTEM (CS:GO exact) ═══════ */
        :root {
            --r-consumer: #b0c3d9;
            --r-industrial: #5e98d9;
            --r-milspec: #4b69ff;
            --r-restricted: #8847ff;
            --r-classified: #d32ce6;
            --r-covert: #eb4b4b;
            --r-gold: #ffd700;
            --r-consumer-bg: rgba(176,195,217,0.08);
            --r-industrial-bg: rgba(94,152,217,0.08);
            --r-milspec-bg: rgba(75,105,255,0.08);
            --r-restricted-bg: rgba(136,71,255,0.08);
            --r-classified-bg: rgba(211,44,230,0.08);
            --r-covert-bg: rgba(235,75,75,0.08);
            --r-gold-bg: rgba(255,215,0,0.08);
        }

        /* ═══════ CASE SELECTOR CARDS ═══════ */
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
        .case-card-v3::before {
            content: '';
            position: absolute;
            inset: 0;
            background: radial-gradient(ellipse at 50% 0%, var(--case-accent, rgba(255,255,255,0.05)) 0%, transparent 70%);
            opacity: 0;
            transition: opacity 0.3s;
        }
        .case-card-v3:hover {
            border-color: rgba(255,255,255,0.15);
            transform: translateY(-3px);
        }
        .case-card-v3:hover::before { opacity: 1; }
        .case-card-v3.selected-v3 {
            border-color: var(--case-accent, #dfb7ff);
            box-shadow: 0 0 25px var(--case-accent-glow, rgba(157,0,255,0.3)),
                        inset 0 0 30px var(--case-accent-glow, rgba(157,0,255,0.1));
            transform: translateY(-4px) scale(1.03);
        }
        .case-card-v3.selected-v3::before { opacity: 1; }
        .case-card-v3:active { transform: scale(0.96); }

        .case-card-v3 .case-img-v3 {
            width: 56px; height: 56px;
            object-fit: contain;
            filter: drop-shadow(0 4px 12px rgba(0,0,0,0.5));
            transition: transform 0.3s, filter 0.3s;
        }
        @media (min-width: 768px) {
            .case-card-v3 .case-img-v3 { width: 72px; height: 72px; }
        }
        .case-card-v3:hover .case-img-v3,
        .case-card-v3.selected-v3 .case-img-v3 {
            transform: scale(1.1) rotate(-3deg);
            filter: drop-shadow(0 0 15px var(--case-accent-glow, rgba(255,255,255,0.2)));
        }
        .case-card-v3 .case-name-v3 {
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            text-align: center;
            line-height: 1.2;
            min-height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .case-card-v3 .case-price-v3 {
            font-size: 14px;
            font-weight: 900;
            color: white;
        }

        /* ═══════ SPINNER (CS:GO authentic) ═══════ */
        .spinner-wrapper-v3 {
            position: relative;
            width: 100%;
            height: 140px;
            background: linear-gradient(180deg, #0a0a12 0%, #111118 50%, #0a0a12 100%);
            border-radius: 16px;
            border: 2px solid rgba(255,255,255,0.06);
            overflow: hidden;
            box-shadow: inset 0 0 60px rgba(0,0,0,0.9), 0 10px 40px rgba(0,0,0,0.5);
        }
        @media (min-width: 768px) {
            .spinner-wrapper-v3 { height: 160px; }
        }

        /* Center marker — the iconic yellow line + triangle */
        .spinner-marker-v3 {
            position: absolute;
            top: 0; bottom: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 2px;
            background: linear-gradient(180deg, #facc15, #f59e0b);
            z-index: 30;
            box-shadow: 0 0 12px rgba(250,204,21,0.6), 0 0 30px rgba(250,204,21,0.2);
        }
        .spinner-marker-top-v3 {
            position: absolute;
            top: -2px; left: 50%;
            transform: translateX(-50%);
            width: 0; height: 0;
            border-left: 10px solid transparent;
            border-right: 10px solid transparent;
            border-top: 14px solid #facc15;
            z-index: 31;
            filter: drop-shadow(0 2px 6px rgba(250,204,21,0.8));
        }
        .spinner-marker-bot-v3 {
            position: absolute;
            bottom: -2px; left: 50%;
            transform: translateX(-50%);
            width: 0; height: 0;
            border-left: 10px solid transparent;
            border-right: 10px solid transparent;
            border-bottom: 14px solid #facc15;
            z-index: 31;
            filter: drop-shadow(0 -2px 6px rgba(250,204,21,0.8));
        }

        /* Edge fade overlays */
        .spinner-fade-l-v3, .spinner-fade-r-v3 {
            position: absolute;
            top: 0; bottom: 0;
            width: 80px;
            z-index: 20;
            pointer-events: none;
        }
        .spinner-fade-l-v3 { left: 0; background: linear-gradient(90deg, #0a0a12 0%, transparent 100%); }
        .spinner-fade-r-v3 { right: 0; background: linear-gradient(270deg, #0a0a12 0%, transparent 100%); }

        /* The moving strip */
        .spinner-strip-v3 {
            position: absolute;
            top: 0; left: 0;
            height: 100%;
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 8px 0 8px 8px;
            will-change: transform;
        }
        .spinner-strip-v3.animating {
            transition: transform 7s cubic-bezier(0.08, 0.82, 0.13, 1);
        }
        .spinner-strip-v3.no-transition {
            transition: none !important;
        }

        /* Individual spinner items */
        .sp-item-v3 {
            width: 120px;
            height: calc(100% - 16px);
            flex-shrink: 0;
            border-radius: 8px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 4px;
            position: relative;
            overflow: hidden;
            background: linear-gradient(180deg, rgba(18,18,28,0.95) 0%, rgba(8,8,14,0.98) 100%);
            border: 2px solid rgba(255,255,255,0.04);
            border-bottom: 3px solid var(--item-rarity, #555);
        }
        .sp-item-v3::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0;
            height: 40%;
            background: radial-gradient(ellipse at 50% 0%, var(--item-rarity-bg, rgba(100,100,100,0.15)), transparent 80%);
            pointer-events: none;
        }
        .sp-item-v3 img {
            width: 56px; height: 56px;
            object-fit: contain;
            filter: drop-shadow(0 2px 8px rgba(0,0,0,0.5));
            position: relative;
            z-index: 2;
        }
        .sp-item-v3 .sp-mult-v3 {
            font-size: 14px;
            font-weight: 900;
            letter-spacing: 1px;
            z-index: 2;
            text-shadow: 0 1px 4px rgba(0,0,0,0.8);
        }
        .sp-item-v3 .sp-amount-v3 {
            font-size: 11px;
            font-weight: 700;
            color: rgba(255,255,255,0.5);
            z-index: 2;
        }

        /* Winner glow animation */
        .sp-item-v3.winner-glow-v3 {
            border-color: var(--item-rarity, #facc15) !important;
            box-shadow: 0 0 35px var(--item-rarity-glow, rgba(250,204,21,0.6)),
                        inset 0 0 20px var(--item-rarity-glow, rgba(250,204,21,0.15));
            transform: scaleY(1.02);
            z-index: 10;
            animation: winnerPulse-v3 1.5s ease-in-out infinite alternate;
        }
        @keyframes winnerPulse-v3 {
            0% { box-shadow: 0 0 25px var(--item-rarity-glow, rgba(250,204,21,0.4)), inset 0 0 15px var(--item-rarity-glow, rgba(250,204,21,0.1)); }
            100% { box-shadow: 0 0 45px var(--item-rarity-glow, rgba(250,204,21,0.8)), inset 0 0 25px var(--item-rarity-glow, rgba(250,204,21,0.2)); }
        }

        /* ═══════ CASE CONTENTS GRID ═══════ */
        .contents-grid-v3 {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
        }
        @media (min-width: 640px) { .contents-grid-v3 { grid-template-columns: repeat(3, 1fr); } }
        @media (min-width: 1024px) { .contents-grid-v3 { grid-template-columns: repeat(6, 1fr); } }

        .content-item-v3 {
            background: linear-gradient(180deg, rgba(18,18,28,0.9) 0%, rgba(8,8,14,0.95) 100%);
            border: 1px solid rgba(255,255,255,0.04);
            border-bottom: 3px solid var(--item-rarity, #555);
            border-radius: 10px;
            padding: 12px 8px 10px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 6px;
            position: relative;
            overflow: hidden;
            transition: all 0.2s;
        }
        .content-item-v3::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0;
            height: 50%;
            background: radial-gradient(ellipse at 50% 0%, var(--item-rarity-bg, rgba(100,100,100,0.1)), transparent 80%);
            pointer-events: none;
        }
        .content-item-v3:hover {
            border-color: var(--item-rarity, #555);
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(0,0,0,0.4);
        }
        .content-item-v3 img {
            width: 48px; height: 48px;
            object-fit: contain;
            filter: drop-shadow(0 2px 6px rgba(0,0,0,0.5));
            position: relative; z-index: 2;
        }
        .content-item-v3 .ci-mult {
            font-size: 13px; font-weight: 900;
            letter-spacing: 1px; z-index: 2;
        }
        .content-item-v3 .ci-name {
            font-size: 9px; font-weight: 700;
            letter-spacing: 1px; text-transform: uppercase;
            color: rgba(255,255,255,0.4); z-index: 2;
        }
        .content-item-v3 .ci-chance {
            font-size: 10px; font-weight: 600;
            color: rgba(255,255,255,0.25); z-index: 2;
        }

        /* ═══════ CONTROLS ═══════ */
        .controls-row-v3 {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            align-items: center;
            justify-content: center;
        }
        .ctrl-pill-v3 {
            display: flex;
            align-items: center;
            gap: 8px;
            background: rgba(0,0,0,0.5);
            border: 1px solid rgba(255,255,255,0.06);
            border-radius: 12px;
            padding: 8px 14px;
            backdrop-filter: blur(8px);
        }
        .ctrl-pill-v3 label {
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            color: rgba(255,255,255,0.4);
        }
        .ctrl-pill-v3 select {
            background: transparent;
            color: white;
            font-weight: 800;
            font-size: 13px;
            border: none;
            outline: none;
            cursor: pointer;
        }
        .ctrl-pill-v3 select option { background: #111; }

        .fast-toggle-v3 {
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
            background: rgba(0,0,0,0.5);
            border: 1px solid rgba(255,255,255,0.06);
            border-radius: 12px;
            padding: 8px 14px;
            transition: all 0.2s;
        }
        .fast-toggle-v3:hover { border-color: rgba(255,255,255,0.15); }
        .fast-toggle-v3 span {
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            color: rgba(255,255,255,0.4);
        }
        .fast-toggle-v3 input { accent-color: #22c55e; cursor: pointer; }

        /* ═══════ MULTI RESULTS ═══════ */
        .multi-results-v3 {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            justify-content: center;
            min-height: 10px;
        }
        .multi-result-item-v3 {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 6px 8px;
            border-radius: 8px;
            border: 1px solid var(--item-rarity, #555);
            border-bottom: 2px solid var(--item-rarity, #555);
            background: linear-gradient(180deg, rgba(18,18,28,0.9), rgba(8,8,14,0.95));
            min-width: 56px;
            animation: multiPop-v3 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
            opacity: 0;
            transform: scale(0.5) translateY(10px);
            position: relative;
            overflow: hidden;
        }
        .multi-result-item-v3::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0;
            height: 50%;
            background: radial-gradient(ellipse at 50% 0%, var(--item-rarity-bg, rgba(100,100,100,0.1)), transparent);
            pointer-events: none;
        }
        @keyframes multiPop-v3 {
            to { opacity: 1; transform: scale(1) translateY(0); }
        }

        /* ═══════ OPEN BUTTON ═══════ */
        .btn-open-v3 {
            position: relative;
            overflow: hidden;
            width: 100%;
            max-width: 420px;
            padding: 16px 32px;
            border: none;
            border-radius: 14px;
            font-size: 18px;
            font-weight: 900;
            letter-spacing: 3px;
            text-transform: uppercase;
            color: white;
            cursor: pointer;
            transition: all 0.25s;
            background: linear-gradient(135deg, #7c3aed, #a855f7);
            box-shadow: 0 6px 25px rgba(124,58,237,0.4);
        }
        .btn-open-v3:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 40px rgba(124,58,237,0.6);
        }
        .btn-open-v3:active { transform: scale(0.97); }
        .btn-open-v3::after {
            content: '';
            position: absolute;
            top: 0; left: -100%;
            width: 200%; height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
            transition: left 0.6s;
        }
        .btn-open-v3:hover::after { left: 100%; }

        .btn-open-v3:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none !important;
            box-shadow: none !important;
        }

        /* ═══════ MESSAGE BAR ═══════ */
        .case-msg-v3 {
            font-size: 12px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 2px;
            padding: 8px 20px;
            border-radius: 10px;
            background: rgba(0,0,0,0.4);
            border: 1px solid rgba(255,255,255,0.06);
            backdrop-filter: blur(8px);
            text-align: center;
            transition: all 0.3s;
        }
        .case-msg-v3.msg-win {
            color: #22c55e !important;
            border-color: rgba(34,197,94,0.3);
            background: rgba(34,197,94,0.08);
            text-shadow: 0 0 15px rgba(34,197,94,0.5);
            animation: msgPop-v3 0.4s cubic-bezier(0.175,0.885,0.32,1.275);
        }
        .case-msg-v3.msg-lose {
            color: #ef4444 !important;
            border-color: rgba(239,68,68,0.3);
            background: rgba(239,68,68,0.08);
        }
        .case-msg-v3.msg-mega {
            color: #fbbf24 !important;
            border-color: rgba(251,191,36,0.4);
            background: rgba(251,191,36,0.1);
            text-shadow: 0 0 20px rgba(251,191,36,0.7);
            box-shadow: 0 0 30px rgba(251,191,36,0.2);
            animation: msgPop-v3 0.4s cubic-bezier(0.175,0.885,0.32,1.275);
        }
        @keyframes msgPop-v3 {
            0% { transform: scale(0.8); opacity: 0.5; }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); opacity: 1; }
        }

        /* ═══════ SKIN NAME ITEMS ═══════ */
        .skin-name-v3 {
            font-size: 10px;
            font-weight: 700;
            color: rgba(255,255,255,0.6);
            text-align: center;
            line-height: 1.2;
        }
    `;
    document.head.appendChild(style);
}


// ── CASE DATA (CS:GO style with skin names and rarity tiers) ──
const CASES = [
    {
        id: 'case_20', name: 'БИЧ ПАКЕТ', cost: 20, img: 'assest/melcase.png',
        accent: '#6b7280', accentGlow: 'rgba(107,114,128,0.3)',
        payouts: [
            { mult: 0.1, prob: 0.25, rarity: 'consumer',   skin: 'P250 | Песчаная буря' },
            { mult: 0.3, prob: 0.25, rarity: 'consumer',   skin: 'MP7 | Угольный' },
            { mult: 0.6, prob: 0.20, rarity: 'industrial', skin: 'UMP-45 | Индиго' },
            { mult: 1.0, prob: 0.15, rarity: 'milspec',    skin: 'Glock | Хром' },
            { mult: 2.0, prob: 0.08, rarity: 'restricted', skin: 'AK-47 | Красная линия' },
            { mult: 5.0, prob: 0.04, rarity: 'classified', skin: 'M4A4 | Неонуар' },
            { mult: 15.0, prob: 0.02, rarity: 'covert',    skin: 'AWP | Вулкан' },
            { mult: 50.0, prob: 0.01, rarity: 'gold',      skin: '★ Нож | Бабочка' }
        ]
    },
    {
        id: 'case_100', name: 'РАБОТЯГА', cost: 100, img: 'assest/melcase.png',
        accent: '#3b82f6', accentGlow: 'rgba(59,130,246,0.3)',
        payouts: [
            { mult: 0.1, prob: 0.25, rarity: 'consumer',   skin: 'FAMAS | Колония' },
            { mult: 0.3, prob: 0.25, rarity: 'consumer',   skin: 'MAC-10 | Янтарь' },
            { mult: 0.5, prob: 0.18, rarity: 'industrial', skin: 'P90 | Ашимов' },
            { mult: 1.0, prob: 0.15, rarity: 'milspec',    skin: 'USP-S | Кортекс' },
            { mult: 2.5, prob: 0.08, rarity: 'restricted', skin: 'AK-47 | Вулкан' },
            { mult: 6.0, prob: 0.05, rarity: 'classified', skin: 'M4A1-S | Горячий род' },
            { mult: 20.0, prob: 0.03, rarity: 'covert',    skin: 'AWP | Дракон Лор' },
            { mult: 60.0, prob: 0.01, rarity: 'gold',      skin: '★ Керамбит | Градиент' }
        ]
    },
    {
        id: 'case_250', name: 'ПРЕМИУМ', cost: 250, img: 'assest/melcase.png',
        accent: '#a855f7', accentGlow: 'rgba(168,85,247,0.3)',
        payouts: [
            { mult: 0.1, prob: 0.25, rarity: 'consumer',   skin: 'Galil | Сахара' },
            { mult: 0.3, prob: 0.22, rarity: 'industrial', skin: 'AUG | Торн' },
            { mult: 0.6, prob: 0.18, rarity: 'milspec',    skin: 'SSG 08 | Кровь' },
            { mult: 1.5, prob: 0.15, rarity: 'restricted', skin: 'Desert Eagle | Кримсон' },
            { mult: 3.0, prob: 0.10, rarity: 'classified', skin: 'AK-47 | Огненный змей' },
            { mult: 8.0, prob: 0.06, rarity: 'covert',     skin: 'M4A4 | Вой' },
            { mult: 25.0, prob: 0.03, rarity: 'covert',    skin: 'AWP | Медуза' },
            { mult: 80.0, prob: 0.01, rarity: 'gold',      skin: '★ М9 | Мрамор' }
        ]
    },
    {
        id: 'case_500', name: 'ЛУДОМАН', cost: 500, img: 'assest/melcase.png',
        accent: '#ec4899', accentGlow: 'rgba(236,72,153,0.3)',
        payouts: [
            { mult: 0.1, prob: 0.30, rarity: 'consumer',   skin: 'Sawed-Off | Ржавый' },
            { mult: 0.3, prob: 0.22, rarity: 'industrial', skin: 'MP9 | Буллдог' },
            { mult: 0.5, prob: 0.15, rarity: 'milspec',    skin: 'FAMAS | Мементо' },
            { mult: 1.5, prob: 0.13, rarity: 'restricted', skin: 'M4A1-S | Гиперзверь' },
            { mult: 3.0, prob: 0.08, rarity: 'classified', skin: 'AK-47 | Неоновый Райдер' },
            { mult: 8.0, prob: 0.06, rarity: 'classified', skin: 'AWP | Фавела' },
            { mult: 30.0, prob: 0.04, rarity: 'covert',    skin: 'AWP | Гунгир' },
            { mult: 100.0, prob: 0.02, rarity: 'gold',     skin: '★ Байонет | Доплер' }
        ]
    },
    {
        id: 'case_1000', name: 'МЕЛСТРОЙ', cost: 1000, img: 'assest/melcase.png',
        accent: '#eab308', accentGlow: 'rgba(234,179,8,0.3)',
        payouts: [
            { mult: 0.1, prob: 0.30, rarity: 'consumer',   skin: 'Nova | Конструктор' },
            { mult: 0.3, prob: 0.22, rarity: 'industrial', skin: 'P250 | Сверхновая' },
            { mult: 0.5, prob: 0.15, rarity: 'milspec',    skin: 'Five-SeveN | Обезьяна' },
            { mult: 1.5, prob: 0.12, rarity: 'restricted', skin: 'Deagle | Закат' },
            { mult: 4.0, prob: 0.09, rarity: 'classified', skin: 'AK-47 | Императрица' },
            { mult: 10.0, prob: 0.06, rarity: 'covert',    skin: 'M4A4 | Посейдон' },
            { mult: 40.0, prob: 0.04, rarity: 'covert',    skin: 'AWP | Дракон Лор FN' },
            { mult: 120.0, prob: 0.02, rarity: 'gold',     skin: '★ Тычковые | Сапфир' }
        ]
    },
    {
        id: 'case_5000', name: 'VIP КИТ', cost: 5000, img: 'assest/melcase.png',
        accent: '#ef4444', accentGlow: 'rgba(239,68,68,0.3)',
        payouts: [
            { mult: 0.1, prob: 0.32, rarity: 'consumer',   skin: 'Tec-9 | Плазма' },
            { mult: 0.3, prob: 0.22, rarity: 'industrial', skin: 'PP-Bizon | Антик' },
            { mult: 0.5, prob: 0.15, rarity: 'milspec',    skin: 'SG 553 | Ультрафиолет' },
            { mult: 1.5, prob: 0.12, rarity: 'restricted', skin: 'AK-47 | Голд Арабеск' },
            { mult: 4.0, prob: 0.08, rarity: 'classified', skin: 'M4A1-S | Печатная плата' },
            { mult: 12.0, prob: 0.05, rarity: 'covert',    skin: 'AWP | Воронье гнездо FN' },
            { mult: 50.0, prob: 0.04, rarity: 'covert',    skin: 'AK-47 | Дикий Лотос' },
            { mult: 150.0, prob: 0.02, rarity: 'gold',     skin: '★ Керамбит | Рубин' }
        ]
    }
];

// Rarity → CSS vars mapping
const RARITY_COLORS = {
    consumer:   { color: '#b0c3d9', bg: 'rgba(176,195,217,0.12)', glow: 'rgba(176,195,217,0.3)' },
    industrial: { color: '#5e98d9', bg: 'rgba(94,152,217,0.12)',  glow: 'rgba(94,152,217,0.3)' },
    milspec:    { color: '#4b69ff', bg: 'rgba(75,105,255,0.12)',  glow: 'rgba(75,105,255,0.3)' },
    restricted: { color: '#8847ff', bg: 'rgba(136,71,255,0.12)', glow: 'rgba(136,71,255,0.3)' },
    classified: { color: '#d32ce6', bg: 'rgba(211,44,230,0.12)', glow: 'rgba(211,44,230,0.3)' },
    covert:     { color: '#eb4b4b', bg: 'rgba(235,75,75,0.12)',  glow: 'rgba(235,75,75,0.3)' },
    gold:       { color: '#ffd700', bg: 'rgba(255,215,0,0.15)',  glow: 'rgba(255,215,0,0.5)' }
};

const RARITY_NAMES = {
    consumer:   'ПОТРЕБ.',
    industrial: 'ПРОМЫШЛ.',
    milspec:    'АРМЕЙСКОЕ',
    restricted: 'ЗАПРЕЩЁННОЕ',
    classified: 'ЗАСЕКРЕЧЕННОЕ',
    covert:     'ТАЙНОЕ',
    gold:       '★ ЭКСТРА РЕДКОЕ'
};

// ── STATE ──
let currentCase = CASES[0];
let isCaseSpinning = false;
let currentQty = 1;
let isFastOpen = false;

// ── DOM REFS ──
const caseTiers = document.getElementById('case-tiers');
const spinnerBox = document.getElementById('spinner-box');
const spStrip = document.getElementById('sp-strip');
const caseContents = document.getElementById('case-contents');
const btnOpenCase = document.getElementById('btn-open-case');
const caseMsg = document.getElementById('case-msg');
const priceDisplay = document.getElementById('case-price-display');

// ── UPGRADE DOM STRUCTURE ──
// Replace spinner-box internals with v3 markup
if (spinnerBox) {
    spinnerBox.className = 'spinner-wrapper-v3';
    spinnerBox.style.cssText = 'display: none;';
    spinnerBox.innerHTML = `
        <div class="spinner-marker-v3"></div>
        <div class="spinner-marker-top-v3"></div>
        <div class="spinner-marker-bot-v3"></div>
        <div class="spinner-fade-l-v3"></div>
        <div class="spinner-fade-r-v3"></div>
        <div id="sp-strip" class="spinner-strip-v3 no-transition"></div>
    `;
}
const spStripV3 = document.getElementById('sp-strip');

// Replace case-contents class
if (caseContents) {
    caseContents.className = 'contents-grid-v3';
}

// Upgrade open button
if (btnOpenCase) {
    btnOpenCase.className = 'btn-open-v3';
}

// Upgrade msg
if (caseMsg) {
    caseMsg.className = 'case-msg-v3 text-primary';
}

// ── INJECT CONTROLS ──
if (btnOpenCase && !document.getElementById('pro-controls-v3')) {
    const ctrl = document.createElement('div');
    ctrl.id = 'pro-controls-v3';
    ctrl.className = 'w-full max-w-lg mx-auto flex flex-col items-center gap-3 mb-4';
    ctrl.innerHTML = `
        <div class="controls-row-v3">
            <div class="ctrl-pill-v3">
                <label>Кейсов</label>
                <select id="case-qty-select-v3">
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="5">5</option>
                    <option value="10">10</option>
                </select>
            </div>
            <label class="fast-toggle-v3">
                <input type="checkbox" id="fast-open-v3">
                <span>ФАСТ</span>
            </label>
        </div>
        <div id="multi-results-v3" class="multi-results-v3"></div>
    `;
    btnOpenCase.parentNode.insertBefore(ctrl, btnOpenCase);

    document.getElementById('case-qty-select-v3').addEventListener('change', (e) => {
        if (isCaseSpinning) { e.target.value = currentQty; return; }
        currentQty = parseInt(e.target.value);
        updatePrice();
    });
    document.getElementById('fast-open-v3').addEventListener('change', (e) => {
        if (isCaseSpinning) { e.target.checked = isFastOpen; return; }
        isFastOpen = e.target.checked;
    });
}

// ── HELPERS ──
function getRarityVars(rarity) {
    return RARITY_COLORS[rarity] || RARITY_COLORS.consumer;
}

function updatePrice() {
    if (priceDisplay) priceDisplay.innerText = currentCase.cost * currentQty;
}

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

function setCaseMsg(text, type) {
    if (!caseMsg) return;
    caseMsg.className = 'case-msg-v3';
    caseMsg.innerText = text;
    if (type === 'win') caseMsg.classList.add('msg-win');
    else if (type === 'lose') caseMsg.classList.add('msg-lose');
    else if (type === 'mega') caseMsg.classList.add('msg-mega');
}

// ── RENDER CASE SELECTOR ──
function renderCasesList() {
    if (!caseTiers) return;
    caseTiers.innerHTML = '';
    caseTiers.className = 'flex flex-wrap justify-center gap-3 md:gap-4';

    CASES.forEach((c) => {
        const el = document.createElement('div');
        const isSelected = currentCase.id === c.id;
        el.className = `case-card-v3 w-[80px] md:w-[110px] ${isSelected ? 'selected-v3' : ''}`;
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
            const mr = document.getElementById('multi-results-v3');
            if (mr) mr.innerHTML = '';
            if (spinnerBox) spinnerBox.style.display = 'none';
            if (caseContents) caseContents.style.display = 'grid';
        };

        caseTiers.appendChild(el);
    });
}

// ── RENDER CASE CONTENTS (the drop table) ──
function renderContents() {
    if (!caseContents) return;
    caseContents.innerHTML = '';

    currentCase.payouts.forEach((p) => {
        const rv = getRarityVars(p.rarity);
        const amount = Math.floor(currentCase.cost * p.mult);
        const el = document.createElement('div');
        el.className = 'content-item-v3';
        el.style.setProperty('--item-rarity', rv.color);
        el.style.setProperty('--item-rarity-bg', rv.bg);

        el.innerHTML = `
            <img src="${currentCase.img}" alt="">
            <div class="ci-mult" style="color: ${rv.color}">${p.mult}x</div>
            <div class="skin-name-v3">${p.skin}</div>
            <div class="ci-name" style="color: ${rv.color}">${RARITY_NAMES[p.rarity]}</div>
            <div class="ci-chance">${(p.prob * 100).toFixed(1)}%</div>
        `;
        caseContents.appendChild(el);
    });
}

// ── BUILD A SPINNER ITEM ELEMENT ──
function makeSpinnerItem(payout, caseData) {
    const rv = getRarityVars(payout.rarity);
    const amount = Math.floor(caseData.cost * payout.mult);
    const el = document.createElement('div');
    el.className = 'sp-item-v3';
    el.style.setProperty('--item-rarity', rv.color);
    el.style.setProperty('--item-rarity-bg', rv.bg);
    el.style.setProperty('--item-rarity-glow', rv.glow);

    el.innerHTML = `
        <img src="${caseData.img}" alt="">
        <span class="sp-mult-v3" style="color: ${rv.color}">${payout.mult}x</span>
        <span class="sp-amount-v3">${amount} 💰</span>
    `;
    return el;
}

// ── MAIN OPEN ACTION ──
function openCasesAction() {
    if (isCaseSpinning) return;
    const totalCost = currentCase.cost * currentQty;

    if (typeof balance !== 'undefined' && balance < totalCost) {
        setCaseMsg('НЕТ БАЛАНСА!', 'lose');
        return;
    }

    isCaseSpinning = true;
    if (btnOpenCase) btnOpenCase.disabled = true;
    if (typeof addBal === 'function') addBal(-totalCost);
    setCaseMsg('ОТКРЫВАЕМ...', '');

    const mr = document.getElementById('multi-results-v3');
    if (mr) mr.innerHTML = '';
    if (caseContents) caseContents.style.display = 'none';

    // Generate results
    const wins = [];
    let totalWin = 0;
    for (let i = 0; i < currentQty; i++) {
        const w = getRandomPayout(currentCase.payouts);
        const amt = Math.floor(currentCase.cost * w.mult);
        wins.push({ ...w, amount: amt });
        totalWin += amt;
    }

    if (isFastOpen) {
        // ── FAST OPEN ──
        if (spinnerBox) spinnerBox.style.display = 'none';
        finishOpening(wins, totalWin, true);
    } else {
        // ── ANIMATED SPINNER ──
        if (spinnerBox) spinnerBox.style.display = 'block';

        const strip = spStripV3 || document.getElementById('sp-strip');
        if (!strip) { finishOpening(wins, totalWin, true); return; }

        // Reset
        strip.className = 'spinner-strip-v3 no-transition';
        strip.style.transform = 'translateX(0px)';
        strip.innerHTML = '';

        const ITEM_W = 124; // 120px + 4px gap
        const TOTAL_ITEMS = 80;
        const WIN_INDEX = 68; // Prize lands near end for long spin

        // Populate strip
        for (let i = 0; i < TOTAL_ITEMS; i++) {
            let payout;
            if (i === WIN_INDEX) {
                payout = wins[0];
            } else {
                payout = getRandomPayout(currentCase.payouts);
            }
            const itemEl = makeSpinnerItem(payout, currentCase);
            if (i === WIN_INDEX) itemEl.id = 'win-item-v3';
            strip.appendChild(itemEl);
        }

        // Calculate target position
        requestAnimationFrame(() => {
            const containerW = spinnerBox.clientWidth || 300;
            const centerOffset = containerW / 2;
            const randomStop = (Math.random() - 0.5) * 90; // Randomness within item bounds
            const targetX = (WIN_INDEX * ITEM_W) + (ITEM_W / 2) - centerOffset + randomStop;

            // Start animation
            strip.className = 'spinner-strip-v3 animating';
            strip.style.transform = `translateX(-${targetX}px)`;

            // SFX: case_spin_tick.mp3 — tick sounds would go here

            // Finish after animation
            setTimeout(() => {
                const winEl = document.getElementById('win-item-v3');
                if (winEl) winEl.classList.add('winner-glow-v3');

                // SFX: case_open_reveal.mp3
                finishOpening(wins, totalWin, false);
            }, 7100);
        });
    }
}

// ── FINISH & PAYOUT ──
function finishOpening(wins, totalWin, isInstant) {
    if (typeof addBal === 'function') addBal(totalWin);

    const maxMult = Math.max(...wins.map(w => w.mult));
    const maxRarity = wins.reduce((best, w) => {
        const order = ['consumer','industrial','milspec','restricted','classified','covert','gold'];
        return order.indexOf(w.rarity) > order.indexOf(best.rarity) ? w : best;
    }, wins[0]);

    if (maxMult >= 10) {
        setCaseMsg(`★ ЛЕГЕНДА! +${totalWin} 💰`, 'mega');
    } else if (maxMult >= 2) {
        setCaseMsg(`ОКУП! +${totalWin} 💰`, 'win');
    } else if (maxMult >= 1) {
        setCaseMsg(`+${totalWin} 💰`, '');
    } else {
        setCaseMsg(`БРИТВОЙ... +${totalWin} 💰`, 'lose');
    }

    // Show multi results
    if (currentQty > 1 || isInstant) {
        const mr = document.getElementById('multi-results-v3');
        if (mr) {
            mr.innerHTML = '';
            const startIdx = isInstant ? 0 : 1;
            for (let i = startIdx; i < wins.length; i++) {
                const w = wins[i];
                const rv = getRarityVars(w.rarity);
                const el = document.createElement('div');
                el.className = 'multi-result-item-v3';
                el.style.setProperty('--item-rarity', rv.color);
                el.style.setProperty('--item-rarity-bg', rv.bg);
                el.style.animationDelay = `${(i - startIdx) * 0.06}s`;

                const bigWinGlow = w.mult >= 5 ? `box-shadow: 0 0 15px ${rv.glow};` : '';
                el.style.cssText += bigWinGlow;

                el.innerHTML = `
                    <span style="font-size:11px;font-weight:900;color:${rv.color};letter-spacing:1px">${w.mult}x</span>
                    <span style="font-size:10px;font-weight:700;color:white;margin-top:2px">${w.amount}</span>
                `;
                mr.appendChild(el);
            }
        }
    }

    isCaseSpinning = false;
    if (btnOpenCase) btnOpenCase.disabled = false;
}

// ── INIT ──
renderCasesList();
renderContents();
if (btnOpenCase) btnOpenCase.onclick = openCasesAction;
updatePrice();
