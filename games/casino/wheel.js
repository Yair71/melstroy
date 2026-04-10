/* ============================================
   MELL CASINO — wheel.js (FIXED VERSION)
   ============================================ */

const WHEEL_SEGMENTS = [
    { mult: 0,   color: '#1e1b4b', label: 'LOSE',  icon: 'close' },
    { mult: 1.5, color: '#6b21a8', label: 'x1.5',  icon: 'payments' },
    { mult: 0.5, color: '#1e1b4b', label: 'x0.5',  icon: 'trending_down' },
    { mult: 2,   color: '#2563eb', label: 'x2',    icon: 'diamond' },
    { mult: 0,   color: '#1e1b4b', label: 'LOSE',  icon: 'close' },
    { mult: 1.5, color: '#6b21a8', label: 'x1.5',  icon: 'payments' },
    { mult: 0.5, color: '#1e1b4b', label: 'x0.5',  icon: 'trending_down' },
    { mult: 3,   color: '#dc2626', label: 'x3',    icon: 'local_fire_department' },
    { mult: 0,   color: '#1e1b4b', label: 'LOSE',  icon: 'close' },
    { mult: 1.5, color: '#6b21a8', label: 'x1.5',  icon: 'payments' },
    { mult: 0.5, color: '#1e1b4b', label: 'x0.5',  icon: 'trending_down' },
    { mult: 10,  color: '#d97706', label: 'x10',   icon: 'star' }
];

let wheelBet = 10;
let isWheelSpinning = false;
let currentWheelRotation = 0;

// Безопасное получение элементов
const wheelBetEl = document.getElementById('wheel-bet');
const wheelMsg = document.getElementById('wheel-msg');
const btnSpinWheel = document.getElementById('btn-spin-wheel');
const wheelRing = document.getElementById('wheel-ring');
const wheelSlices = document.getElementById('wheel-slices');
const wheelItems = document.getElementById('wheel-items');

// Запускаем только если все элементы загрузились (защита от ошибок)
if (btnSpinWheel && wheelRing && wheelSlices && wheelItems) {
    
    document.getElementById('wheel-up').onclick = () => { if(!isWheelSpinning) { wheelBet = Math.min(wheelBet+10, 1000); wheelBetEl.innerText = wheelBet; }};
    document.getElementById('wheel-down').onclick = () => { if(!isWheelSpinning) { wheelBet = Math.max(wheelBet-10, 10); wheelBetEl.innerText = wheelBet; }};

    function drawWheel() {
        const total = WHEEL_SEGMENTS.length;
        const sliceAngle = 360 / total;

        // Рисуем фон
        let gradient = 'conic-gradient(';
        WHEEL_SEGMENTS.forEach((seg, i) => {
            gradient += `${seg.color} ${i * sliceAngle}deg ${(i + 1) * sliceAngle}deg, `;
        });
        gradient = gradient.slice(0, -2) + ')';
        wheelSlices.style.background = gradient;
        wheelSlices.style.boxShadow = 'inset 0 0 40px rgba(0,0,0,0.8)';

        // Рисуем иконки
        wheelItems.innerHTML = '';
        WHEEL_SEGMENTS.forEach((seg, i) => {
            const centerAngle = (i * sliceAngle) + (sliceAngle / 2);
            const item = document.createElement('div');
            item.className = 'wf-slice-item';
            
            // Динамический сдвиг по радиусу (от центра к краю) в зависимости от экрана
            const radius = window.innerWidth >= 768 ? 160 : 110; 
            item.style.transform = `translate(-50%, -50%) rotate(${centerAngle}deg) translateY(-${radius}px) rotate(180deg)`;

            item.innerHTML = `
                <span class="material-symbols-outlined text-2xl md:text-3xl mb-1 text-white/90 drop-shadow-md">${seg.icon}</span>
                <span class="text-[10px] md:text-sm tracking-wider font-black">${seg.label}</span>
            `;
            wheelItems.appendChild(item);
        });
    }

    drawWheel();
    window.addEventListener('resize', drawWheel);

    // Вращение (математика точной остановки)
    btnSpinWheel.onclick = () => {
        if (isWheelSpinning) return;
        if (typeof balance !== 'undefined' && balance < wheelBet) { 
            if(typeof showMsg === 'function') showMsg(wheelMsg, 'НЕТ ДЕНЕГ!', 'lose'); 
            return; 
        }

        isWheelSpinning = true;
        if(typeof addBal === 'function') addBal(-wheelBet);
        if(typeof showMsg === 'function') showMsg(wheelMsg, 'ВРАЩАЕМ...', 'normal');
        
        const winIndex = Math.floor(Math.random() * WHEEL_SEGMENTS.length);
        const winSegment = WHEEL_SEGMENTS[winIndex];
        const sliceAngle = 360 / WHEEL_SEGMENTS.length;
        const centerAngle = (winIndex * sliceAngle) + (sliceAngle / 2);
        
        const rotationToTop = 360 - centerAngle;
        const randomOffset = (Math.random() - 0.5) * (sliceAngle - 10); 
        const extraSpins = (5 + Math.floor(Math.random() * 3)) * 360;
        
        const targetRotation = currentWheelRotation + extraSpins + rotationToTop - (currentWheelRotation % 360) + randomOffset;
        currentWheelRotation = targetRotation;

        wheelRing.style.transition = 'transform 5s cubic-bezier(0.15, 0.85, 0.25, 1)';
        wheelRing.style.transform = `rotate(${currentWheelRotation}deg)`;

        setTimeout(() => {
            const winAmount = Math.floor(wheelBet * winSegment.mult);
            if (winAmount > 0) {
                if(typeof addBal === 'function') addBal(winAmount);
                if(typeof showMsg === 'function') showMsg(wheelMsg, `ПОБЕДА! +${winAmount} 💰`, 'win');
                if(winSegment.mult >= 3) {
                    wheelMsg.classList.add('shadow-[0_0_40px_rgba(234,179,8,1)]');
                    setTimeout(() => wheelMsg.classList.remove('shadow-[0_0_40px_rgba(234,179,8,1)]'), 2000);
                }
            } else {
                if(typeof showMsg === 'function') showMsg(wheelMsg, 'МИМО...', 'lose');
            }
            isWheelSpinning = false;
        }, 5000);
    };
}
