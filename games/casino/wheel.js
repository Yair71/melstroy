/* ============================================
   MELL CASINO — wheel.js (GIANT 50/50 LAYOUT)
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
    { mult: 10,  color: '#d97706', label: 'x10',   icon: 'star' } // ЗОЛОТО
];

let wheelBet = 10;
let isWheelSpinning = false;
let currentWheelRotation = 0;

const wheelBetEl = document.getElementById('wheel-bet');
const wheelMsg = document.getElementById('wheel-msg');
const btnSpinWheel = document.getElementById('btn-spin-wheel');          // Кнопка в центре
const btnSpinWheelLeft = document.getElementById('btn-spin-wheel-left');  // Новая большая кнопка слева
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
        wheelSlices.style.boxShadow = 'inset 0 0 60px rgba(0,0,0,0.8)';

        wheelItems.innerHTML = '';
        WHEEL_SEGMENTS.forEach((seg, i) => {
            const centerAngle = (i * sliceAngle) + (sliceAngle / 2);
            const item = document.createElement('div');
            item.className = 'wf-slice-item';
            
            // Задаем радиус под новые большие размеры колеса
            // На мобилке колесо 320px (радиус 160). Ставим текст на 110px.
            // На ПК колесо 550px (радиус 275). Ставим текст на 200px.
            const radius = window.innerWidth >= 1024 ? 200 : 110; 
            
            // ИСПРАВЛЕНИЕ: Убрали rotate(180deg) в конце. Теперь текст смотрит наружу, как надо!
            item.style.transform = `translate(-50%, -50%) rotate(${centerAngle}deg) translateY(-${radius}px)`;

            item.innerHTML = `
                <span class="material-symbols-outlined text-2xl lg:text-4xl mb-1 text-white/90 drop-shadow-lg">${seg.icon}</span>
                <span class="text-xs lg:text-xl tracking-wider font-black uppercase text-white">${seg.label}</span>
            `;
            wheelItems.appendChild(item);
        });
    }

    drawWheel();
    window.addEventListener('resize', drawWheel);

    // Функция запуска вращения
    const spinAction = () => {
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
        const extraSpins = (6 + Math.floor(Math.random() * 4)) * 360; // 6-10 быстрых кругов для экшена
        
        const targetRotation = currentWheelRotation + extraSpins + rotationToTop - (currentWheelRotation % 360) + randomOffset;
        currentWheelRotation = targetRotation;

        wheelRing.style.transition = 'transform 6s cubic-bezier(0.15, 0.85, 0.15, 1)'; // Плавное 6 секундное торможение
        wheelRing.style.transform = `rotate(${currentWheelRotation}deg)`;

        setTimeout(() => {
            const winAmount = Math.floor(wheelBet * winSegment.mult);
            if (winAmount > 0) {
                if(typeof addBal === 'function') addBal(winAmount);
                if(typeof showMsg === 'function') showMsg(wheelMsg, `ПОБЕДА! +${winAmount} 💰`, 'win');
                if(winSegment.mult >= 3) {
                    wheelMsg.classList.add('shadow-[0_0_50px_rgba(234,179,8,1)]');
                    setTimeout(() => wheelMsg.classList.remove('shadow-[0_0_50px_rgba(234,179,8,1)]'), 2000);
                }
            } else {
                if(typeof showMsg === 'function') showMsg(wheelMsg, 'МИМО...', 'lose');
            }
            isWheelSpinning = false;
        }, 6000); // 6 секунд
    };

    // Привязываем обе кнопки к запуску
    btnSpinWheel.onclick = spinAction;
    if (btnSpinWheelLeft) btnSpinWheelLeft.onclick = spinAction;
}
