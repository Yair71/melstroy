/* ============================================
   MELL CASINO — horse.js
   Horses: 6 horses, all x2, then risk for x5
   Dramatic race with overtaking and random bursts
   ============================================ */

const HORSES = [
    { name:'Молния', e:'🐎' },
    { name:'Единорог', e:'🦄' },
    { name:'Ракета', e:'🐴' },
    { name:'Зебра', e:'🦓' },
    { name:'Тень', e:'🏇' },
    { name:'Буря', e:'🎠' },
];
let selHorse = 0, hBet = 10, racing = false, raceWinAmt = 0;
const hBetEl = document.getElementById('horse-bet');
const hMsg = document.getElementById('horse-msg');
const horsePick = document.getElementById('horse-pick');
const raceTrack = document.getElementById('race-track');
const horseResult = document.getElementById('horse-result');
const hrText = document.getElementById('hr-text');
const horseCtrls = document.getElementById('horse-ctrls');
const btnRace = document.getElementById('btn-race');

// Build horse picker
HORSES.forEach((h, i) => {
    const d = document.createElement('div');
    d.className = 'hp' + (i===0 ? ' sel' : '');
    d.dataset.idx = i;
    d.innerHTML = `<span class="hp-emoji">${h.e}</span><span class="hp-name">${h.name}</span>`;
    d.onclick = () => {
        if (racing) return;
        document.querySelectorAll('.hp').forEach(x => x.classList.remove('sel'));
        d.classList.add('sel');
        selHorse = i;
    };
    horsePick.appendChild(d);
});

// Build lanes
HORSES.forEach((h, i) => {
    const lane = document.createElement('div');
    lane.className = 'lane';
    lane.innerHTML = `<span class="lane-num">${i+1}</span><span class="runner" id="runner-${i}">${h.e}</span><div class="finish-flag"></div>`;
    raceTrack.appendChild(lane);
});

document.getElementById('horse-up').onclick = () => { if(!racing){ hBet=clamp(hBet+10,10,500); hBetEl.innerText=hBet; }};
document.getElementById('horse-down').onclick = () => { if(!racing){ hBet=clamp(hBet-10,10,500); hBetEl.innerText=hBet; }};

document.getElementById('btn-race').onclick = startRace;

function startRace() {
    if (racing) return;
    if (balance < hBet) { showMsg(hMsg, 'НЕТ ДЕНЕГ!', 'lose'); return; }
    racing = true;
    addBal(-hBet);
    showMsg(hMsg, '🏁 ЗАЕЗД!');
    horseResult.style.display = 'none';
    horseCtrls.style.display = 'none';
    btnRace.style.display = 'none';

    const runners = HORSES.map((_, i) => document.getElementById(`runner-${i}`));
    runners.forEach(r => r.style.left = '20px');

    const trackW = raceTrack.querySelector('.lane').offsetWidth - 50;
    const pos = new Float32Array(6);
    const speedBase = HORSES.map(() => 0.8 + Math.random() * 0.6);
    let winner = -1;
    let frame = 0;

    function step() {
        frame++;
        for (let i = 0; i < 6; i++) {
            if (winner >= 0) break;
            let spd = speedBase[i];
            // Random burst every ~30 frames
            if (Math.random() < 0.06) spd *= 2.5 + Math.random() * 2;
            // Periodic boost (different phase per horse)
            spd *= 1 + 0.4 * Math.sin(frame * 0.05 + i * 1.5);
            // General randomness
            spd *= 0.3 + Math.random() * 1.2;
            // Slowdown near finish (tension)
            if (pos[i] > trackW * 0.85) spd *= 0.6 + Math.random() * 0.5;

            pos[i] = Math.min(pos[i] + spd, trackW);
            runners[i].style.left = (20 + pos[i]) + 'px';

            if (pos[i] >= trackW && winner < 0) winner = i;
        }

        if (winner < 0) {
            requestAnimationFrame(step);
        } else {
            setTimeout(() => {
                if (winner === selHorse) {
                    raceWinAmt = hBet * 2;
                    hrText.innerText = `${HORSES[winner].e} ПОБЕДА! +${raceWinAmt} 💰`;
                    hrText.style.color = '#00e676';
                    horseResult.style.display = '';
                    showMsg(hMsg, 'ЗАБРАТЬ ИЛИ РИСКНУТЬ?', 'win');
                } else {
                    showMsg(hMsg, `${HORSES[winner].e} ${HORSES[winner].name} ПОБЕДИЛ!`, 'lose');
                    endRace();
                }
            }, 400);
        }
    }
    requestAnimationFrame(step);
}

document.getElementById('btn-take').onclick = () => {
    addBal(raceWinAmt);
    showMsg(hMsg, `ЗАБРАЛ +${raceWinAmt} 💰`, 'win');
    endRace();
};

document.getElementById('btn-risk').onclick = () => {
    horseResult.style.display = 'none';
    showMsg(hMsg, '🔥 РИСКУЕМ! x5 ИЛИ НИЧЕГО...');
    setTimeout(() => {
        if (Math.random() < 0.35) {
            const big = hBet * 5;
            addBal(big);
            showMsg(hMsg, `🔥🔥🔥 РИСК ОКУПИЛСЯ! +${big} 💰`, 'win');
        } else {
            showMsg(hMsg, 'ПРОИГРАЛ ВСЁ 😭', 'lose');
        }
        endRace();
    }, 1500);
};

function endRace() {
    racing = false;
    horseResult.style.display = 'none';
    horseCtrls.style.display = '';
    btnRace.style.display = '';
}
