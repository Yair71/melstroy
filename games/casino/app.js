// ============================================================
// app.js — MELL CASINO MVP
// ============================================================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const balanceVal = document.getElementById('balance-value');
const betVal = document.getElementById('bet-value');
const msgDisp = document.getElementById('message-display');
const btnSpin = document.getElementById('btn-spin');
const btnUp = document.getElementById('btn-bet-up');
const btnDown = document.getElementById('btn-bet-down');

// СИМВОЛЫ И МНОЖИТЕЛИ (Мемная Меллстрой-тематика)
const SYMBOLS = [
    { emoji: '🍒', mult: 2 },   // x2
    { emoji: '🍋', mult: 3 },   // x3
    { emoji: '🍺', mult: 5 },   // x5
    { emoji: '🍔', mult: 10 },  // x10
    { emoji: '💎', mult: 50 },  // x50
    { emoji: '🦍', mult: 100 }  // x100 (Абсолютный Меллстрой Джекпот)
];

const state = {
    balance: null, 
    bet: 10,
    reels: [0, 0, 0], 
    spinning: false,
    spinSpeeds: [0, 0, 0],
    spinOffsets: [0, 0, 0],
    stops: [0, 0, 0], // -1 = крутится
    particles: []
};

// 1. ИНТЕГРАЦИЯ С ГЛАВНЫМ ПРИЛОЖЕНИЕМ
window.addEventListener('message', (e) => {
    if (e.data.type === 'SYNC_BALANCE') {
        state.balance = e.data.balance;
        updateUI();
        if (state.balance !== null && msgDisp.innerText === 'WAITING FOR BALANCE...') {
            msgDisp.innerText = 'PLACE YOUR BET!';
            msgDisp.style.color = '#fff';
            msgDisp.style.textShadow = '0 4px 10px #000, 0 0 20px #FFD700';
        }
    }
});

// Запрос баланса при старте
setTimeout(() => {
    window.parent.postMessage({ type: 'REQUEST_BALANCE' }, '*');
    
    // Fallback для тестов, если запускаешь файл локально без главного меню
    if(state.balance === null) {
        state.balance = 500;
        updateUI();
        msgDisp.innerText = '[DEV MODE] PLACE BET';
    }
}, 500);

function updateUI() {
    balanceVal.innerText = state.balance !== null ? state.balance : '...';
    betVal.innerText = state.bet;
    
    if (state.spinning) {
        btnSpin.disabled = true;
    } else if (state.balance === null || state.balance < state.bet) {
        btnSpin.disabled = true;
        if (!state.spinning && state.balance !== null) {
            msgDisp.innerText = 'BROKE AF! PLAY OTHER GAMES!';
            msgDisp.style.color = '#888';
            msgDisp.style.textShadow = 'none';
        }
    } else {
        btnSpin.disabled = false;
    }
}

// 2. УПРАВЛЕНИЕ СТАВКАМИ
btnUp.onclick = () => { 
    if (!state.spinning) { 
        state.bet += (state.bet >= 100 ? 50 : 10); // Шаг увеличивается
        updateUI(); 
    } 
};
btnDown.onclick = () => { 
    if (!state.spinning && state.bet > 10) { 
        state.bet -= (state.bet > 100 ? 50 : 10); 
        updateUI(); 
    } 
};

// 3. ЛОГИКА СПИНА
btnSpin.onclick = () => {
    if (state.balance < state.bet) return;
    
    // Снимаем деньги со счета сразу
    state.balance -= state.bet;
    window.parent.postMessage({ type: 'ADD_BALANCE', amount: -state.bet }, '*');
    
    state.spinning = true;
    msgDisp.innerText = 'SPINNING...';
    msgDisp.style.color = '#fff';
    msgDisp.style.textShadow = '0 4px 10px #000, 0 0 20px #00aaff';
    updateUI();

    // Запускаем барабаны
    state.spinSpeeds = [30 + Math.random()*10, 40 + Math.random()*10, 50 + Math.random()*10];
    state.spinOffsets = [0, 0, 0];
    state.stops = [-1, -1, -1]; 

    // Тайминги остановок
    setTimeout(() => stopReel(0), 1000);
    setTimeout(() => stopReel(1), 2000);
    setTimeout(() => stopReel(2), 3200); // Третий барабан крутится дольше (азарт)
};

function stopReel(idx) {
    // Рандомный результат
    state.stops[idx] = Math.floor(Math.random() * SYMBOLS.length);
    if (idx === 2) setTimeout(checkWin, 300);
}

function checkWin() {
    state.spinning = false;
    state.reels = [...state.stops];
    
    const r1 = state.reels[0];
    const r2 = state.reels[1];
    const r3 = state.reels[2];

    if (r1 === r2 && r2 === r3) {
        // ТРИ В РЯД (ДЖЕКПОТ)
        const win = state.bet * SYMBOLS[r1].mult;
        state.balance += win;
        window.parent.postMessage({ type: 'ADD_BALANCE', amount: win }, '*');
        
        msgDisp.innerText = `MEGA WIN! +${win} 💰`;
        msgDisp.style.color = '#00FF41';
        msgDisp.style.textShadow = '0 4px 10px #000, 0 0 30px #00FF41';
        spawnParticles(80, '#00FF41');
        
    } else if (r1 === r2 || r2 === r3 || r1 === r3) {
        // ДВА СОВПАДЕНИЯ (УТЕШИТЕЛЬНЫЙ Х2)
        const win = state.bet * 2;
        state.balance += win;
        window.parent.postMessage({ type: 'ADD_BALANCE', amount: win }, '*');
        
        msgDisp.innerText = `WIN! +${win} 💰`;
        msgDisp.style.color = '#FFD700';
        msgDisp.style.textShadow = '0 4px 10px #000, 0 0 20px #FFD700';
        spawnParticles(30, '#FFD700');
        
    } else {
        // ЛУЗ
        msgDisp.innerText = 'SCAMMED! 😭';
        msgDisp.style.color = '#FF003C';
        msgDisp.style.textShadow = '0 4px 10px #000, 0 0 20px #FF003C';
    }
    
    updateUI();
}

// 4. РЕНДЕРИНГ (Отрисовка)
let lastTime = 0;
function loop(time) {
    const dt = (time - lastTime) / 1000 || 0;
    lastTime = time;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Корпус слотов
    const machineY = 180;
    const machineH = 220;
    ctx.fillStyle = '#111';
    ctx.fillRect(20, machineY, 440, machineH);
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 6;
    ctx.strokeRect(20, machineY, 440, machineH);

    // 3 Барабана
    for (let i = 0; i < 3; i++) {
        const rx = 40 + i * 140;
        const ry = machineY + 20;
        const rw = 120;
        const rh = 180;
        
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(rx, ry, rw, rh);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 4;
        ctx.strokeRect(rx, ry, rw, rh);

        ctx.save();
        ctx.beginPath();
        ctx.rect(rx, ry, rw, rh);
        ctx.clip();

        if (state.stops[i] === -1) {
            // Анимация кручения
            state.spinOffsets[i] += state.spinSpeeds[i] * dt * 60;
            const offset = state.spinOffsets[i] % rh;
            
            ctx.font = '70px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#fff';
            
            // Эффект смазывания (Blur)
            for(let j = -1; j < 3; j++) {
                const symIdx = Math.floor(Math.random() * SYMBOLS.length);
                ctx.fillText(SYMBOLS[symIdx].emoji, rx + rw/2, ry + offset + j*rh);
            }
        } else {
            // Остановка
            ctx.font = '90px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = '#000';
            ctx.shadowBlur = 15;
            ctx.fillText(SYMBOLS[state.stops[i]].emoji, rx + rw/2, ry + rh/2 + 5);
        }
        
        ctx.restore();
    }

    // Частицы выигрыша
    for(let i = state.particles.length-1; i >= 0; i--) {
        const p = state.particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 800 * dt; // гравитация
        p.life -= dt;
        
        ctx.font = `${p.size}px serif`;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 15;
        ctx.fillText(p.emoji, p.x, p.y);
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
        
        if(p.life <= 0) state.particles.splice(i, 1);
    }

    requestAnimationFrame(loop);
}

function spawnParticles(count, color) {
    for(let i = 0; i < count; i++) {
        state.particles.push({
            x: canvas.width / 2,
            y: canvas.height / 2,
            vx: (Math.random() - 0.5) * 800,
            vy: (Math.random() - 1) * 1000,
            life: 1 + Math.random() * 2,
            size: 20 + Math.random() * 30,
            emoji: Math.random() > 0.5 ? '💰' : '💎',
            color: color
        });
    }
}

requestAnimationFrame(loop);
