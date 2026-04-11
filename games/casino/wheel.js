/* ============================================
   MELL CASINO — wheel.js (PROFITABLE RNG & NEAR-MISS)
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

// 24 Сектора: Казино всегда в плюсе. Иксы окружены нулями для тильта!
// 14x0, 6x0.5, 2x2, 1x5, 1x10
const WHEEL_SEGMENTS = [
    { mult: 0,   color: '#111111', label: 'LOSE', icon: 'close' },
    { mult: 10,  color: '#b45309', label: 'x10',  icon: 'star' },            // Окружен нулями
    { mult: 0,   color: '#1a1a1a', label: 'LOSE', icon: 'close' },
    { mult: 0.5, color: '#312e81', label: 'x0.5', icon: 'trending_down' },
    { mult: 0,   color: '#111111', label: 'LOSE', icon: 'close' },
    { mult: 2,   color: '#1e3a8a', label: 'x2',   icon: 'diamond' },         // Окружен нулями
    { mult: 0,   color: '#1a1a1a', label: 'LOSE', icon: 'close' },
    { mult: 0.5, color: '#312e81', label: 'x0.5', icon: 'trending_down' },
    { mult: 0,   color: '#111111', label: 'LOSE', icon: 'close' },
    { mult: 0,   color: '#1a1a1a', label: 'LOSE', icon: 'close' },
    { mult: 0.5, color: '#312e81', label: 'x0.5', icon: 'trending_down' },
    { mult: 0,   color: '#111111', label: 'LOSE', icon: 'close' },
    { mult: 5,   color: '#991b1b', label: 'x5',   icon: 'local_fire_department' }, // Окружен нулями
    { mult: 0,   color: '#1a1a1a', label: 'LOSE', icon: 'close' },
    { mult: 0.5, color: '#312e81', label: 'x0.5', icon: 'trending_down' },
    { mult: 0,   color: '#111111', label: 'LOSE', icon: 'close' },
    { mult: 2,   color: '#1e3a8a', label: 'x2',   icon: 'diamond' },         // Окружен нулями
    { mult: 0,   color: '#1a1a1a', label: 'LOSE', icon: 'close' },
    { mult: 0.5, color: '#312e81', label: 'x0.5', icon: 'trending_down' },
    { mult: 0,   color: '#111111', label: 'LOSE', icon: 'close' },
    { mult: 0,   color: '#1a1a1a', label: 'LOSE', icon: 'close' },
    { mult: 0.5, color: '#312e81', label: 'x0.5', icon: 'trending_down' },
    { mult: 0,   color: '#111111', label: 'LOSE', icon: 'close' },
    { mult: 0,   color: '#1a1a1a', label: 'LOSE', icon: 'close' }
];

let wheelBet = 10;
let isWheelSpinning = false;
let currentWheelRotation = 0;
let spinHistory = []; 

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

        let gradient = 'conic-gradient(';
        WHEEL_SEGMENTS.forEach((seg, i) => {
            gradient += `${seg.color} ${i * sliceAngle}deg ${(i + 1) * sliceAngle}deg, `;
        });
        gradient = gradient.slice(0, -2) + ')';
        wheelSlices.style.background = gradient;

        wheelItems.innerHTML = '';
        
        const containerWidth = document.querySelector('.wf-container').clientWidth;
        const radius = containerWidth / 2;
        const textOffset = radius * 0.75; 

        WHEEL_SEGMENTS.forEach((seg, i) => {
            const centerAngle = (i * sliceAngle) + (sliceAngle / 2);
            
            const separator = document.createElement('div');
            separator.className = 'wf-separator';
            separator.style.transform = `translateX(-50%) rotate(${i * sliceAngle}deg)`;
            wheelItems.appendChild(separator);

            const item = document.createElement('div');
            item.className = 'wf-slice-item';
            item.style.transform = `translate(-50%, -50%) rotate(${centerAngle}deg) translateY(-${textOffset}px)`;

            let textColor = seg.mult >= 2 ? 'text-yellow-400' : 'text-white/80';
            
            item.innerHTML = `
                <span class="material-symbols-outlined ${textColor} drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">${seg.icon}</span>
                <span class="lbl tracking-wider font-black uppercase ${textColor} drop-shadow-md">${seg.label}</span>
            `;
            wheelItems.appendChild(item);
        });
    }

    setTimeout(drawWheel, 100); 
    window.addEventListener('resize', drawWheel);

    function getSmartWinIndex() {
        let index;
        let attempts = 0;
        
        while (attempts < 5) {
            index = Math.floor(Math.random() * WHEEL_SEGMENTS.length);
            let rolledMult = WHEEL_SEGMENTS[index].mult;
            
            // Если выпадает крупный икс 2 раза подряд, или LOSE 3 раза подряд - рероллим для баланса
            if (spinHistory.length >= 2 && rolledMult >= 2 && spinHistory[0] >= 2) {
                attempts++; continue;
            }
            if (spinHistory.length >= 3 && rolledMult === 0 && spinHistory[0] === 0 && spinHistory[1] === 0 && spinHistory[2] === 0) {
                attempts++; continue;
            }
            break;
        }
        
        spinHistory.unshift(WHEEL_SEGMENTS[index].mult);
        if (spinHistory.length > 5) spinHistory.pop();
        
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
        const randomOffset = (Math.random() - 0.5) * (sliceAngle - 4); 
        const extraSpins = (6 + Math.floor(Math.random() * 4)) * 360; 
        
        const targetRotation = currentWheelRotation + extraSpins + rotationToTop - (currentWheelRotation % 360) + randomOffset;
        currentWheelRotation = targetRotation;

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
