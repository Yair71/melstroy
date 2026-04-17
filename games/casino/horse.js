// horse.js - Mell Casino Virtual Racing

class VirtualRacing {
    constructor() {
        // Забираем начальный баланс из глобального UI
        this.balance = parseInt(document.querySelector('.cash-value').innerText.replace(/\s/g, '')) || 24500;
        this.sessionProfit = 0;
        
        // Список лошадей (Цвета адаптированы под Tailwind)
        this.horses = [
            { id: 1, name: "Velvet Thunder", jockey: "M. Sterling", tailwind: "bg-purple-600", odds: 4.50, baseSpeed: 2.2 },
            { id: 2, name: "Neon Eclipse", jockey: "E. Vance", tailwind: "bg-blue-600", odds: 2.75, baseSpeed: 2.5 },
            { id: 3, name: "Crimson Fury", jockey: "J. Axe", tailwind: "bg-red-600", odds: 12.00, baseSpeed: 1.8 },
            { id: 4, name: "Golden Run", jockey: "A. Whitaker", tailwind: "bg-yellow-500", odds: 3.20, baseSpeed: 2.4 },
            { id: 5, name: "Mellstroy's Luck", jockey: "V. Burim", tailwind: "bg-green-500", odds: 5.50, baseSpeed: 2.1 },
            { id: 6, name: "Sigma Grind", jockey: "C. Bateman", tailwind: "bg-orange-500", odds: 8.00, baseSpeed: 1.9 }
        ];

        this.state = {
            status: 'betting', // betting, racing, finished
            selectedHorse: null,
            betMode: 'win', // win, top3
            currentBet: null,
            positions: [],
            animationFrame: null
        };

        this.trackWidth = 0;
        this.finishLineX = 0;

        this.initDOM();
        if(this.ui.trackContainer) {
            this.bindEvents();
            this.renderHorsesList();
            this.setupTrack();
            this.updateGlobalBalanceUI();
        }
    }

    initDOM() {
        // Подхватываем все нужные ID из нового HTML
        this.ui = {
            horsesList: document.getElementById('horses-list'),
            trackContainer: document.getElementById('race-track-container'),
            stakeInput: document.getElementById('stake-input'),
            estReturn: document.getElementById('est-return'),
            btnPlaceBet: document.getElementById('btn-place-bet'),
            btnStartRace: document.getElementById('btn-start-race'),
            selectedCard: document.getElementById('selected-horse-card'),
            selectedName: document.getElementById('selected-horse-name'),
            selectedOdds: document.getElementById('selected-horse-odds'),
            overlay: document.getElementById('game-overlay'),
            overlayText: document.getElementById('overlay-text'),
            overlaySubtext: document.getElementById('overlay-subtext'),
            btnNextRace: document.getElementById('btn-next-race'),
            raceStatus: document.getElementById('race-status'),
            raceIndicator: document.getElementById('race-indicator'),
            betHistory: document.getElementById('bet-history'),
            sessionProfit: document.getElementById('session-profit')
        };
    }

    bindEvents() {
        this.ui.stakeInput.addEventListener('input', () => this.calculateReturn());
        
        document.querySelectorAll('.quick-stake').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const val = parseInt(e.target.dataset.val);
                const current = parseInt(this.ui.stakeInput.value) || 0;
                this.ui.stakeInput.value = current + val;
                this.calculateReturn();
            });
        });

        document.querySelectorAll('.bet-mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.bet-mode-btn').forEach(b => {
                    b.classList.remove('bg-primary', 'text-on-primary-fixed', 'active-mode');
                    b.classList.add('text-stone-400', 'hover:bg-stone-800');
                });
                e.target.classList.remove('text-stone-400', 'hover:bg-stone-800');
                e.target.classList.add('bg-primary', 'text-on-primary-fixed', 'active-mode');
                this.state.betMode = e.target.dataset.mode;
                this.calculateReturn();
            });
        });

        this.ui.btnPlaceBet.addEventListener('click', () => this.placeBet());
        this.ui.btnStartRace.addEventListener('click', () => this.startCountdown());
        this.ui.btnNextRace.addEventListener('click', () => this.resetRace());
    }

    renderHorsesList() {
        this.ui.horsesList.innerHTML = '';
        this.horses.forEach(horse => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-white/5 transition-colors cursor-pointer group';
            tr.onclick = () => this.selectHorse(horse);
            
            tr.innerHTML = `
                <td class="p-4 flex items-center gap-4">
                    <div class="w-10 h-10 flex items-center justify-center ${horse.tailwind} text-white font-black rounded-lg shadow-lg text-lg border border-white/20">${horse.id}</div>
                    <div>
                        <div class="font-bold text-sm md:text-base text-white group-hover:text-primary transition-colors">${horse.name}</div>
                        <div class="text-[10px] text-stone-500 font-label tracking-widest uppercase">Жокей: ${horse.jockey}</div>
                    </div>
                </td>
                <td class="p-4 text-secondary-fixed font-black font-headline text-lg">${horse.odds.toFixed(2)}</td>
                <td class="p-4 text-right">
                    <button class="bg-stone-800 hover:bg-primary text-stone-300 border border-white/10 hover:text-on-primary-fixed px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all select-btn">Выбрать</button>
                </td>
            `;
            this.ui.horsesList.appendChild(tr);
        });
    }

    setupTrack() {
        // Очищаем трек, оставляем только линию финиша
        this.ui.trackContainer.innerHTML = '<div class="absolute right-[5%] top-0 bottom-0 w-1 bg-[repeating-linear-gradient(0deg,white,white_10px,black_10px,black_20px)] z-0 shadow-[0_0_10px_white]"></div>';
        
        const trackHeight = 350;
        const padding = 20;
        const laneHeight = (trackHeight - padding * 2) / this.horses.length;

        this.state.positions = this.horses.map((horse, index) => {
            const el = document.createElement('div');
            el.className = `horse-sprite ${horse.tailwind} text-white`;
            el.innerText = horse.id;
            el.style.top = `${padding + (index * laneHeight) + (laneHeight/2) - 20}px`;
            el.style.left = '10px';
            this.ui.trackContainer.appendChild(el);

            return { horse, element: el, x: 10, finished: false };
        });

        setTimeout(() => {
            this.trackWidth = this.ui.trackContainer.clientWidth;
            this.finishLineX = this.trackWidth * 0.95 - 40; 
        }, 100);
    }

    selectHorse(horse) {
        if (this.state.status !== 'betting') return;
        
        this.state.selectedHorse = horse;
        this.ui.selectedCard.classList.remove('hidden');
        this.ui.selectedName.innerText = horse.name;
        this.ui.selectedOdds.innerText = horse.odds.toFixed(2);
        
        document.querySelectorAll('.select-btn').forEach(btn => {
            btn.innerText = 'ВЫБРАТЬ';
            btn.classList.remove('bg-primary', 'text-on-primary-fixed');
            btn.classList.add('bg-stone-800', 'text-stone-300');
        });
        
        const currentBtn = event.currentTarget.querySelector('.select-btn');
        currentBtn.innerText = 'ВЫБРАНА';
        currentBtn.classList.remove('bg-stone-800', 'text-stone-300');
        currentBtn.classList.add('bg-primary', 'text-on-primary-fixed');
        
        this.calculateReturn();
    }

    calculateReturn() {
        if (!this.state.selectedHorse) return;
        const stake = parseFloat(this.ui.stakeInput.value) || 0;
        let odds = this.state.selectedHorse.odds;
        
        // Математика: Если Топ-3, шанс выиграть выше, коэффициент режем в 3 раза
        if (this.state.betMode === 'top3') {
            odds = Math.max(1.1, odds / 3); 
        }
        
        const est = stake * odds;
        this.ui.estReturn.innerText = est.toFixed(2);
        
        if (stake > 0 && stake <= this.balance) {
            this.ui.btnPlaceBet.disabled = false;
        } else {
            this.ui.btnPlaceBet.disabled = true;
        }
    }

    placeBet() {
        const stake = parseFloat(this.ui.stakeInput.value);
        if (!this.state.selectedHorse || stake <= 0 || stake > this.balance) return;

        // Снимаем деньги
        this.updateBalance(-stake);
        
        this.state.currentBet = {
            horse: this.state.selectedHorse,
            stake: stake,
            mode: this.state.betMode,
            odds: this.state.betMode === 'top3' ? this.state.selectedHorse.odds / 3 : this.state.selectedHorse.odds
        };

        this.ui.btnPlaceBet.classList.add('hidden');
        this.ui.btnStartRace.classList.remove('hidden');
        this.ui.stakeInput.disabled = true;
        
        this.ui.raceStatus.innerText = "СТАВКА ПРИНЯТА";
        this.ui.raceStatus.classList.replace('text-green-400', 'text-yellow-400');
        this.ui.raceIndicator.classList.replace('bg-green-500', 'bg-yellow-500');
    }

    startCountdown() {
        this.state.status = 'racing';
        this.ui.btnStartRace.classList.add('hidden');
        this.ui.overlay.classList.remove('hidden');
        this.ui.overlayText.innerText = "3";
        this.ui.overlayText.className = "text-7xl font-headline font-black text-white mb-4";
        
        let count = 3;
        const interval = setInterval(() => {
            count--;
            if (count > 0) {
                this.ui.overlayText.innerText = count;
            } else if (count === 0) {
                this.ui.overlayText.innerText = "СТАРТ!";
                this.ui.overlayText.classList.add('text-primary');
            } else {
                clearInterval(interval);
                this.ui.overlay.classList.add('hidden');
                
                this.ui.raceStatus.innerText = "ЗАБЕГ ИДЁТ...";
                this.ui.raceStatus.classList.replace('text-yellow-400', 'text-red-500');
                this.ui.raceIndicator.classList.replace('bg-yellow-500', 'bg-red-500');
                this.ui.raceIndicator.classList.add('animate-ping');
                
                this.runRace();
            }
        }, 800);
    }

    runRace() {
        let finishers = [];

        const updateFrame = () => {
            let stillRunning = false;

            this.state.positions.forEach(pos => {
                if (!pos.finished) {
                    // Математика симуляции: базовая скорость + рандомный рывок
                    const randomBoost = Math.random() * 2.8;
                    const fatigue = pos.x > (this.trackWidth * 0.7) ? (Math.random() * 0.5) : 0; 
                    
                    pos.x += (pos.horse.baseSpeed + randomBoost - fatigue);
                    
                    if (pos.x >= this.finishLineX) {
                        pos.x = this.finishLineX;
                        pos.finished = true;
                        finishers.push(pos.horse);
                    } else {
                        stillRunning = true;
                    }
                    pos.element.style.left = `${pos.x}px`;
                }
            });

            if (stillRunning) {
                this.state.animationFrame = requestAnimationFrame(updateFrame);
            } else {
                this.finishRace(finishers);
            }
        };

        this.state.animationFrame = requestAnimationFrame(updateFrame);
    }

    finishRace(finishers) {
        this.state.status = 'finished';
        const winner = finishers[0];
        const top3 = finishers.slice(0, 3);
        
        let won = false;
        let payout = 0;

        if (this.state.currentBet) {
            const betHorse = this.state.currentBet.horse.id;
            if (this.state.currentBet.mode === 'win' && winner.id === betHorse) {
                won = true;
                payout = this.state.currentBet.stake * this.state.currentBet.odds;
            } else if (this.state.currentBet.mode === 'top3' && top3.find(h => h.id === betHorse)) {
                won = true;
                payout = this.state.currentBet.stake * this.state.currentBet.odds;
            }
        }

        this.ui.overlay.classList.remove('hidden');
        this.ui.btnNextRace.classList.remove('hidden');
        this.ui.overlaySubtext.classList.remove('hidden');
        this.ui.raceIndicator.classList.remove('animate-ping');

        if (won) {
            this.updateBalance(payout);
            this.ui.overlayText.innerText = `+${payout.toFixed(0)} 💰`;
            this.ui.overlayText.className = "text-6xl md:text-7xl font-headline font-black text-secondary-fixed mb-4 drop-shadow-[0_0_20px_rgba(255,225,109,0.8)]";
            this.ui.overlaySubtext.innerText = "МЕГА ЗАНОС! СТАВКА СЫГРАЛА!";
            this.ui.overlaySubtext.className = "text-xl md:text-2xl font-headline font-bold text-green-400 uppercase tracking-widest";
            this.updateSessionProfit(payout - this.state.currentBet.stake);
        } else {
            this.ui.overlayText.innerText = "ПРОИГРЫШ";
            this.ui.overlayText.className = "text-5xl md:text-6xl font-headline font-black text-red-500 mb-4 drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]";
            this.ui.overlaySubtext.innerText = `Победитель: ${winner.name}`;
            this.ui.overlaySubtext.className = "text-xl font-headline font-bold text-stone-300 uppercase tracking-widest";
            this.updateSessionProfit(-this.state.currentBet.stake);
        }

        this.logHistory(won, payout, winner);
        this.ui.raceStatus.innerText = "ЗАЕЗД ОКОНЧЕН";
        this.ui.raceStatus.classList.replace('text-red-500', 'text-stone-400');
        this.ui.raceIndicator.classList.replace('bg-red-500', 'bg-stone-500');
    }

    logHistory(won, payout, winner) {
        if (!this.state.currentBet) return;
        
        const historyEl = document.createElement('div');
        historyEl.className = `p-3 rounded-xl text-xs border-l-4 bg-black/30 backdrop-blur-sm ${won ? 'border-green-500' : 'border-red-500'}`;
        historyEl.innerHTML = `
            <div class="flex justify-between items-center font-bold mb-1">
                <span class="text-white">${this.state.currentBet.horse.name} (${this.state.currentBet.mode === 'win' ? 'WIN' : 'TOP-3'})</span>
                <span class="${won ? 'text-green-400' : 'text-red-400'} text-sm">${won ? '+' + payout.toFixed(0) : '-' + this.state.currentBet.stake} 💰</span>
            </div>
            <div class="text-stone-500 text-[10px] uppercase tracking-widest">Победитель: <span class="text-stone-300">${winner.name}</span></div>
        `;
        this.ui.betHistory.prepend(historyEl);
    }

    updateBalance(amount) {
        this.balance += amount;
        this.updateGlobalBalanceUI();
    }

    updateSessionProfit(amount) {
        this.sessionProfit += amount;
        const el = this.ui.sessionProfit;
        el.innerText = `Профит: ${this.sessionProfit > 0 ? '+' : ''}${this.sessionProfit.toFixed(0)}`;
        el.className = this.sessionProfit >= 0 ? "text-green-400" : "text-red-400";
    }

    updateGlobalBalanceUI() {
        // Находим все элементы баланса в Navbar и обновляем
        document.querySelectorAll('.cash-value').forEach(el => {
            // Форматируем число красиво (10000 -> 10 000)
            el.innerText = Math.floor(this.balance).toLocaleString('ru-RU');
        });
    }

    resetRace() {
        this.state.status = 'betting';
        this.state.currentBet = null;
        this.state.selectedHorse = null;
        
        this.ui.overlay.classList.add('hidden');
        this.ui.btnNextRace.classList.add('hidden');
        this.ui.overlaySubtext.classList.add('hidden');
        
        this.ui.btnPlaceBet.classList.remove('hidden');
        this.ui.stakeInput.disabled = false;
        this.ui.selectedCard.classList.add('hidden');
        
        this.ui.raceStatus.innerText = "ОЖИДАНИЕ СТАВОК";
        this.ui.raceStatus.classList.replace('text-stone-400', 'text-green-400');
        this.ui.raceIndicator.classList.replace('bg-stone-500', 'bg-green-500');

        document.querySelectorAll('.select-btn').forEach(btn => {
            btn.innerText = 'ВЫБРАТЬ';
            btn.classList.remove('bg-primary', 'text-on-primary-fixed');
            btn.classList.add('bg-stone-800', 'text-stone-300');
        });
        
        this.setupTrack();
        this.calculateReturn();
    }
}

// Запускаем игру когда открывается экран "Скачек" (чтобы трек рендерился правильно)
document.addEventListener('DOMContentLoaded', () => {
    // Инициализация симулятора
    window.racingGame = new VirtualRacing();
});
