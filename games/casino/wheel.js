/* ============================================
   MELL CASINO — wheel.js (PRO VERSION)
   Bug-free, Deterministic Rotation Math
   ============================================ */

// Настройки секторов колеса (Множители ставки)
const WHEEL_SEGMENTS = [
    { mult: 0,   color: '#1e1b4b', label: 'LOSE',  icon: 'close' },         // Темный
    { mult: 1.5, color: '#6b21a8', label: 'x1.5',  icon: 'payments' },      // Фиолетовый
    { mult: 0.5, color: '#1e1b4b', label: 'x0.5',  icon: 'trending_down' }, // Темный
    { mult: 2,   color: '#2563eb', label: 'x2',    icon: 'diamond' },       // Синий
    { mult: 0,   color: '#1e1b4b', label: 'LOSE',  icon: 'close' },         // Темный
    { mult: 1.5, color: '#6b21a8', label: 'x1.5',  icon: 'payments' },      // Фиолетовый
    { mult: 0.5, color: '#1e1b4b', label: 'x0.5',  icon: 'trending_down' }, // Темный
    { mult: 3,   color: '#dc2626', label: 'x3',    icon: 'local_fire_department' }, // Красный
    { mult: 0,   color: '#1e1b4b', label: 'LOSE',  icon: 'close' },         // Темный
    { mult: 1.5, color: '#6b21a8', label: 'x1.5',  icon: 'payments' },      // Фиолетовый
    { mult: 0.5, color: '#1e1b4b', label: 'x0.5',  icon: 'trending_down' }, // Темный
    { mult: 10,  color: '#d97706', label: 'x10',   icon: 'star' }           // Золотой (ДЖЕКПОТ)
];

let wheelBet = 10;
let isWheelSpinning = false;
let currentWheelRotation = 0; // Сохраняем текущий угол, чтобы крутить дальше, а не дергать назад

const wheelBetEl = document.getElementById('wheel-bet');
const wheelMsg = document.getElementById('wheel-msg');
const btnSpinWheel = document.getElementById('btn-spin-wheel');
const wheelRing = document.getElementById('wheel-ring');
const wheelSlices = document.getElementById('wheel-slices');
const wheelItems = document.getElementById('wheel-items');

// Управление ставкой
document.getElementById('wheel-up').onclick = () => { if(!isWheelSpinning) { wheelBet = Math.min(wheelBet+10, 1000); wheelBetEl.innerText = wheelBet; }};
document.getElementById('wheel-down').onclick = () => { if(!isWheelSpinning) { wheelBet = Math.max(wheelBet-10, 10); wheelBetEl.innerText = wheelBet; }};

// Инициализация графики колеса
function drawWheel() {
    const total = WHEEL_SEGMENTS.length;
    const sliceAngle = 360 / total;
    
    // 1. Рисуем фон (CSS Conic Gradient)
    let gradient = 'conic-gradient(';
    WHEEL_SEGMENTS.forEach((seg, i) => {
        gradient += `${seg.color} ${i * sliceAngle}deg ${(i + 1) * sliceAngle}deg, `;
    });
    gradient = gradient.slice(0, -2) + ')';
    wheelSlices.style.background = gradient;
    
    // Внутренняя тень для объема
    wheelSlices.style.boxShadow = 'inset 0 0 40px rgba(0,0,0,0.8)';
    
    // 2. Расставляем текст и иконки по кругу
    wheelItems.innerHTML = '';
    WHEEL_SEGMENTS.forEach((seg, i) => {
        // Центр текущего сектора
        const centerAngle = (i * sliceAngle) + (sliceAngle / 2);
        
        const item = document.createElement('div');
        item.className = 'slice-item';
        
        // Магия позиционирования: двигаем в центр, крутим на нужный угол, сдвигаем вверх, и переворачиваем контент обратно, чтобы он смотрел в центр
        item.style.transform = `translate(-50%, -50%) rotate(${centerAngle}deg) translateY(-110px) rotate(180deg)`;
        
        // На телефонах колесо меньше, поэтому поднимаем текст не так высоко
        if(window.innerWidth >= 768) {
             item.style.transform = `translate(-50%, -50%) rotate(${centerAngle}deg) translateY(-160px) rotate(180deg)`;
        }

        item.innerHTML = `
            <span class="material-symbols-outlined text-2xl md:text-3xl mb-1 text-white/90 drop-shadow-md">${seg.icon}</span>
            <span class="text-xs md:text-sm tracking-wider">${seg.label}</span>
        `;
        wheelItems.appendChild(item);
    });
}

// Запускаем отрисовку
drawWheel();
window.addEventListener('resize', drawWheel); // Перерисовываем при смене размера экрана

// Логика вращения
btnSpinWheel.onclick = () => {
    if (isWheelSpinning) return;
    
    if (typeof balance !== 'undefined' && balance < wheelBet) { 
        if(typeof showMsg === 'function') showMsg(wheelMsg, 'НЕТ ДЕНЕГ!', 'lose'); 
        return; 
    }

    isWheelSpinning = true;
    if(typeof addBal === 'function') addBal(-wheelBet);
    if(typeof showMsg === 'function') showMsg(wheelMsg, 'ВРАЩАЕМ...', 'normal');
    
    // 1. ВЫБИРАЕМ ПОБЕДИТЕЛЯ (Рандом от 0 до 11)
    const winIndex = Math.floor(Math.random() * WHEEL_SEGMENTS.length);
    const winSegment = WHEEL_SEGMENTS[winIndex];
    
    // 2. МАТЕМАТИКА ИДЕАЛЬНОЙ ОСТАНОВКИ
    const sliceAngle = 360 / WHEEL_SEGMENTS.length;
    // Угол, на котором находится центр выигрышного сектора
    const centerAngle = (winIndex * sliceAngle) + (sliceAngle / 2);
    
    // Сколько нужно прокрутить от 0, чтобы этот сектор оказался ровно вверху (указатель)
    const rotationToTop = 360 - centerAngle;
    
    // Добавляем микро-сдвиг внутри сектора, чтобы не всегда останавливалось ровно по центру (для азарта)
    const randomOffset = (Math.random() - 0.5) * (sliceAngle - 4); 
    
    // Крутим минимум 5 полных кругов + доворот до нужного сектора
    const extraSpins = (5 + Math.floor(Math.random() * 3)) * 360;
    
    // Рассчитываем итоговый угол вращения
    // Вычитаем currentWheelRotation % 360, чтобы учесть, где колесо стоит сейчас
    const targetRotation = currentWheelRotation + extraSpins + rotationToTop - (currentWheelRotation % 360) + randomOffset;
    
    currentWheelRotation = targetRotation; // Запоминаем для следующего крута

    // 3. ЗАПУСК АНИМАЦИИ (Плавное затухание за 5 секунд)
    wheelRing.style.transition = 'transform 5s cubic-bezier(0.15, 0.85, 0.25, 1)';
    wheelRing.style.transform = `rotate(${currentWheelRotation}deg)`;

    // 4. ВЫДАЧА ПРИЗА ПОСЛЕ ОСТАНОВКИ
    setTimeout(() => {
        const winAmount = Math.floor(wheelBet * winSegment.mult);
        
        if (winAmount > 0) {
            if(typeof addBal === 'function') addBal(winAmount);
            if(typeof showMsg === 'function') showMsg(wheelMsg, `ПОБЕДА! +${winAmount} 💰`, 'win');
            
            // Крутой эффект: если выпал x10, мигаем кнопкой
            if(winSegment.mult >= 3) {
                wheelMsg.classList.add('shadow-[0_0_40px_rgba(234,179,8,1)]');
                setTimeout(() => wheelMsg.classList.remove('shadow-[0_0_40px_rgba(234,179,8,1)]'), 2000);
            }
        } else {
            if(typeof showMsg === 'function') showMsg(wheelMsg, 'МИМО...', 'lose');
        }
        
        isWheelSpinning = false;
    }, 5000); // Таймер строго равен времени transition (5 секунд)
};
