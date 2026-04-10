/* ============================================
   MELL CASINO — wheel.js (MEGA 24-SEGMENT & SMART RNG)
   ============================================ */

// Инъекция критических стилей для апгрейда колеса (обход кэша)
const styleId = 'wheel-pro-styles';
if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = `
        .wf-container {
            width: 360px !important;
            height: 360px !important;
            border: 16px solid #0f0f0f !important;
            box-shadow: 0 0 0 4px #fbbf24, 0 0 80px 20px rgba(251, 191, 36, 0.4), inset 0 0 80px rgba(0,0,0,0.9) !important;
        }
        @media (min-width: 1024px) {
            .wf-container {
                width: 650px !important;
                height: 650px !important;
            }
        }
        .wf-separator {
            position: absolute;
            top: 0; left: 50%;
            width: 3px;
            height: 50%;
            background: linear-gradient(to bottom, #facc15 0%, #ca8a04 40%, transparent 100%);
            transform-origin: bottom center;
            z-index: 15;
            box-shadow: 0 0 5px rgba(250, 204, 21, 0.5);
        }
        .wf-slice-item {
            width: 50px !important;
        }
        .wf-slice-item span.material-symbols-outlined {
            font-size: 1.2rem;
            margin-bottom: 2px;
        }
        .wf-slice-item span.lbl {
            font-size: 0.7rem;
        }
        @media (min-width: 1024px) {
            .wf-slice-item { width: 80px !important; }
            .wf-slice-item span.material-symbols-outlined { font-size: 2rem; }
            .wf-slice-item span.lbl { font-size: 1.1rem; }
        }
    `;
    const gameWheelBlock = document.getElementById('game-wheel');
    if (gameWheelBlock) gameWheelBlock.appendChild(style);
}

// 24 Сектора: Чем больше X, тем меньше шансов.
const WHEEL_SEGMENTS = [
    { mult: 0,   color: '#111111', label: 'LOSE', icon: 'close' },
    { mult: 0.5, color: '#312e81', label: 'x0.5', icon: 'trending_down' },
    { mult: 0,   color: '#1a1a1a', label: 'LOSE', icon: 'close' },
    { mult: 1.2, color: '#166534', label: 'x1.2', icon: 'payments' },
    { mult: 0,   color: '#111111', label: 'LOSE', icon: 'close' },
    { mult: 0.5, color: '#312e81', label: 'x0.5', icon: 'trending_down' },
    { mult: 2,   color: '#1e3a8a', label: 'x2',   icon: 'diamond' },
    { mult: 0,   color: '#1a1a1a', label: 'LOSE', icon: 'close' },
    { mult: 0.5, color: '#312e81', label: 'x0.5', icon: 'trending_down' },
    { mult: 0,   color: '#111111', label: 'LOSE', icon: 'close' },
    { mult: 1.2, color: '#166534', label: 'x1.2', icon: 'payments' },
    { mult: 5,   color: '#991b1b', label: 'x5',   icon: 'local_fire_department' },
    { mult: 0,   color: '#1a1a1a', label: 'LOSE', icon: 'close' },
    { mult: 0.5, color: '#312e81', label: 'x0.5', icon: 'trending_down' },
    { mult: 0,   color: '#111111', label: 'LOSE', icon: 'close' },
    { mult: 1.2, color: '#166534', label: 'x1.2', icon: 'payments' },
    { mult: 0,   color: '#1a1a1a', label: 'LOSE', icon: 'close' },
    { mult: 0.5, color: '#312e81', label: 'x0.5', icon: 'trending_down' },
    { mult: 2,   color: '#1e3a8a', label: 'x2',   icon: 'diamond' },
    { mult: 0,   color: '#111111', label: 'LOSE', icon: 'close' },
    { mult: 0.5, color: '#312e81', label: 'x0.5', icon: 'trending_down' },
    { mult: 0,   color: '#1a1a1a', label: 'LOSE', icon: 'close' },
    { mult: 10,  color: '#b45309', label: 'x10',  icon: 'star' },
    { mult: 0,   color: '#111111', label: 'LOSE', icon: 'close' }
];

let wheelBet = 10;
let isWheelSpinning = false;
let currentWheelRotation = 0;
let spinHistory = []; // Память для анти-стрик системы

const wheelBetEl = document.getElementById('wheel-bet');
const wheelMsg = document.getElementById('wheel-msg');
const btnSpinWheel = document.getElementById('btn-spin-wheel');          
const btnSpinWheelLeft = document.getElementById('btn-spin-wheel-left');  
const wheelRing = document.getElementById('wheel-ring');
const wheelSlices = document.getElementById('wheel-slices');
const wheelItems = document.getElementById('wheel-items');

if (btnSpinWheel && wheelRing && wheelSlices && wheelItems) {
    
    document.getElementById('wheel-up').onclick = () => { if(!isWheelSpinning) { wheelBet = Math.min(wheelBet+10, 1000); wheelBetEl.innerText = wheelBet; }};
    document.getElementById('wheel-down').onclick = () => { if(!isWheelSpinning) { wheelBet = Math.max(wheelBet-10, 10); wheelBetEl.innerText = wheelBet; }};

    function drawWheel() {
        const total = WHEEL_SEGMENTS.length;
        const sliceAngle = 360 / total;

        // Рисуем фон секторов
        let gradient = 'conic-gradient(';
        WHEEL_SEGMENTS.forEach((seg, i) => {
            gradient += `${seg.color} ${i * sliceAngle}deg ${(i + 1) * sliceAngle}deg, `;
        });
        gradient = gradient.slice(0, -2) + ')';
        wheelSlices.style.background = gradient;

        wheelItems.innerHTML = '';
        
        // Динамический расчет радиуса в зависимости от размера экрана
        const containerWidth = document.querySelector('.wf-container').clientWidth;
        const radius = containerWidth / 2;
        const textOffset = radius * 0.75; // Текст стоит на 75% от центра к краю

        WHEEL_SEGMENTS.forEach((seg, i) => {
            const centerAngle = (i * sliceAngle) + (sliceAngle / 2);
            
            // Добавляем разделители (грани)
            const separator = document.createElement('div');
            separator.className = 'wf-separator';
            separator.style.transform = `translateX(-50%) rotate(${i * sliceAngle}deg)`;
            wheelItems.appendChild(separator);

            // Добавляем контент сектора
            const item = document.createElement('div');
            item.className = 'wf-slice-item';
            // Текст повернут наружу для удобного чтения
            item.style.transform = `translate(-50%, -50%) rotate(${centerAngle}deg) translateY(-${textOffset}px)`;

            let textColor = seg.mult >= 2 ? 'text-yellow-400' : 'text-white/80';
            
            item.innerHTML = `
                <span class="material-symbols-outlined ${textColor} drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">${seg.icon}</span>
                <span class="lbl tracking-wider font-black uppercase ${textColor} drop-shadow-md">${seg.label}</span>
            `;
            wheelItems.appendChild(item);
        });
    }

    // Инициализация и ререндеринг при изменении размера окна
    setTimeout(drawWheel, 100); 
    window.addEventListener('resize', drawWheel);

    // Умный рандом: предотвращает бесящие долгие лузстрики
    function getSmartWinIndex() {
        let index;
        let attempts = 0;
        
        while (attempts < 5) {
            index = Math.floor(Math.random() * WHEEL_SEGMENTS.length);
            let rolledMult = WHEEL_SEGMENTS[index].mult;
            
            // Если последние 2 спина были ТАКИМ ЖЕ множителем - делаем реролл (до 5 попыток)
            if (spinHistory.length >= 2 && spinHistory[0] === rolledMult && spinHistory[1] === rolledMult) {
                attempts++;
                continue;
            }
            break;
        }
        
        // Обновляем историю
        spinHistory.unshift(WHEEL_SEGMENTS[index].mult);
        if (spinHistory.length > 3) spinHistory.pop();
        
        return index;
    }

    const spinAction = () => {
        if (isWheelSpinning) return;
        if (typeof balance !== 'undefined' && balance < wheelBet) { 
            if(typeof showMsg === 'function') showMsg(wheelMsg, 'НЕТ БАЛАНСА, БРО!', 'lose'); 
            return; 
        }

        isWheelSpinning = true;
        if(typeof addBal === 'function') addBal(-wheelBet);
        
        wheelMsg.className = "text-white text-sm md:text-base font-bold uppercase tracking-widest bg-blue-900/60 px-8 py-3 rounded-xl border border-blue-500/30 backdrop-blur-md transition-all";
        wheelMsg.innerText = 'КОЛЕСО КРУТИТСЯ...';
        
        const winIndex = getSmartWinIndex();
        const winSegment = WHEEL_SEGMENTS[winIndex];
        
        const totalSegments = WHEEL_SEGMENTS.length;
        const sliceAngle = 360 / totalSegments;
        const centerAngle = (winIndex * sliceAngle) + (sliceAngle / 2);
        
        const rotationToTop = 360 - centerAngle;
        // Рандомный отступ, чтобы стрелка не смотрела тупо в центр сектора
        const randomOffset = (Math.random() - 0.5) * (sliceAngle - 4); 
        // Крутим 6-9 раз для интриги
        const extraSpins = (6 + Math.floor(Math.random() * 4)) * 360; 
        
        const targetRotation = currentWheelRotation + extraSpins + rotationToTop - (currentWheelRotation % 360) + randomOffset;
        currentWheelRotation = targetRotation;

        // Плавная математическая анимация (CSS transition)
        wheelRing.style.transition = 'transform 6.5s cubic-bezier(0.15, 0.9, 0.15, 1)';
        wheelRing.style.transform = `rotate(${currentWheelRotation}deg)`;

        setTimeout(() => {
            const winAmount = Math.floor(wheelBet * winSegment.mult);
            if (winAmount > 0) {
                if(typeof addBal === 'function') addBal(winAmount);
                
                let glowClass = winSegment.mult >= 5 ? 'shadow-[0_0_50px_rgba(234,179,8,1)] border-yellow-400 bg-yellow-900/50' : 'shadow-[0_0_20px_rgba(34,197,94,0.6)] border-green-500/50 bg-green-900/50';
                wheelMsg.className = `text-white text-sm md:text-base font-black uppercase tracking-widest px-8 py-3 rounded-xl border backdrop-blur-md transition-all ${glowClass}`;
                
                if (winSegment.mult >= 5) {
                    wheelMsg.innerText = `МЕГА ЗАНОС! +${winAmount} 💰`;
                } else {
                    wheelMsg.innerText = `АЙ ХОРОШ! +${winAmount} 💰`;
                }

                setTimeout(() => {
                    wheelMsg.classList.remove('shadow-[0_0_50px_rgba(234,179,8,1)]', 'shadow-[0_0_20px_rgba(34,197,94,0.6)]');
                }, 2000);
            } else {
                wheelMsg.className = "text-stone-300 text-sm md:text-base font-bold uppercase tracking-widest bg-red-900/40 px-8 py-3 rounded-xl border border-red-500/30 backdrop-blur-md transition-all";
                wheelMsg.innerText = 'БРИТЬЕ... МИМО';
            }
            isWheelSpinning = false;
        }, 6500);
    };

    btnSpinWheel.onclick = spinAction;
    if (btnSpinWheelLeft) btnSpinWheelLeft.onclick = spinAction;
}
