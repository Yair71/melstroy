/* ============================================
   MELL CASINO — slots.js
   Slots game: Only 🦍🦍 pair = x2, three of a kind = mult
   ============================================ */

const SYMS = [
    { e:'🍒', m:2 }, { e:'🍋', m:3 }, { e:'🍺', m:5 },
    { e:'🍔', m:10 }, { e:'💎', m:50 }, { e:'🦍', m:100 }
];
let sBet = 10, sSpinning = false;
const sBetEl = document.getElementById('slot-bet');
const sMsg = document.getElementById('slot-msg');
const reelEls = [document.getElementById('reel-0'), document.getElementById('reel-1'), document.getElementById('reel-2')];

document.getElementById('slot-up').onclick = () => { if(!sSpinning){ sBet = clamp(sBet+10,10,500); sBetEl.innerText=sBet; }};
document.getElementById('slot-down').onclick = () => { if(!sSpinning){ sBet = clamp(sBet-10,10,500); sBetEl.innerText=sBet; }};

document.getElementById('btn-spin-slots').onclick = () => {
    if (sSpinning) return;
    if (balance < sBet) { showMsg(sMsg, 'НЕТ ДЕНЕГ!', 'lose'); return; }
    sSpinning = true;
    addBal(-sBet);
    showMsg(sMsg, 'КРУТИМ...');
    reelEls.forEach(r => { r.innerText = '❓'; r.classList.add('spinning'); r.classList.remove('won'); });

    const stops = [0,0,0];
    const revealReel = (i, delay) => setTimeout(() => {
        stops[i] = Math.floor(Math.random() * SYMS.length);
        reelEls[i].classList.remove('spinning');
        reelEls[i].innerText = SYMS[stops[i]].e;
    }, delay);

    revealReel(0, 700);
    revealReel(1, 1400);
    setTimeout(() => {
        stops[2] = Math.floor(Math.random() * SYMS.length);
        reelEls[2].classList.remove('spinning');
        reelEls[2].innerText = SYMS[stops[2]].e;

        let win = 0;
        // Three of a kind
        if (stops[0] === stops[1] && stops[1] === stops[2]) {
            win = sBet * SYMS[stops[0]].m;
            reelEls.forEach(r => r.classList.add('won'));
        }
        // Only gorilla pair (index 5) gives x2
        else {
            const gorilla = 5;
            const count = stops.filter(s => s === gorilla).length;
            if (count === 2) {
                win = sBet * 2;
                reelEls.forEach((r,idx) => { if(stops[idx]===gorilla) r.classList.add('won'); });
            }
        }

        if (win > 0) {
            addBal(win);
            showMsg(sMsg, `ВЫИГРЫШ +${win} 💰!`, 'win');
        } else {
            showMsg(sMsg, 'МИМО 😭', 'lose');
        }
        sSpinning = false;
    }, 2200);
};
