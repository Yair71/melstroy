/* ============================================
   MELL CASINO — cases.js  v2.0
   Cases: CS:GO style, responsive spinner
   ============================================ */

const TIERS = [
    {
        name:'Бронза', icon:'🥉', price:20,
        items:[
            { label:'5 💰',   prize:5,   chance:0.35, rarity:'common' },
            { label:'10 💰',  prize:10,  chance:0.28, rarity:'common' },
            { label:'20 💰',  prize:20,  chance:0.20, rarity:'uncommon' },
            { label:'40 💰',  prize:40,  chance:0.10, rarity:'rare' },
            { label:'80 💰',  prize:80,  chance:0.05, rarity:'epic' },
            { label:'150 💰', prize:150, chance:0.02, rarity:'legendary' },
        ]
    },
    {
        name:'Серебро', icon:'🥈', price:50,
        items:[
            { label:'10 💰',  prize:10,  chance:0.28, rarity:'common' },
            { label:'30 💰',  prize:30,  chance:0.27, rarity:'common' },
            { label:'50 💰',  prize:50,  chance:0.22, rarity:'uncommon' },
            { label:'100 💰', prize:100, chance:0.13, rarity:'rare' },
            { label:'200 💰', prize:200, chance:0.07, rarity:'epic' },
            { label:'500 💰', prize:500, chance:0.03, rarity:'legendary' },
        ]
    },
    {
        name:'Золото', icon:'🥇', price:100,
        items:[
            { label:'20 💰',   prize:20,   chance:0.26, rarity:'common' },
            { label:'60 💰',   prize:60,   chance:0.25, rarity:'common' },
            { label:'100 💰',  prize:100,  chance:0.22, rarity:'uncommon' },
            { label:'250 💰',  prize:250,  chance:0.14, rarity:'rare' },
            { label:'500 💰',  prize:500,  chance:0.09, rarity:'epic' },
            { label:'1000 💰', prize:1000, chance:0.04, rarity:'legendary' },
        ]
    },
    {
        name:'Платина', icon:'💠', price:250,
        items:[
            { label:'50 💰',   prize:50,   chance:0.24, rarity:'common' },
            { label:'150 💰',  prize:150,  chance:0.24, rarity:'common' },
            { label:'250 💰',  prize:250,  chance:0.22, rarity:'uncommon' },
            { label:'500 💰',  prize:500,  chance:0.15, rarity:'rare' },
            { label:'1000 💰', prize:1000, chance:0.10, rarity:'epic' },
            { label:'2500 💰', prize:2500, chance:0.05, rarity:'legendary' },
        ]
    },
    {
        name:'Алмаз', icon:'💎', price:500,
        items:[
            { label:'100 💰',  prize:100,  chance:0.22, rarity:'common' },
            { label:'300 💰',  prize:300,  chance:0.24, rarity:'common' },
            { label:'500 💰',  prize:500,  chance:0.22, rarity:'uncommon' },
            { label:'1000 💰', prize:1000, chance:0.16, rarity:'rare' },
            { label:'2500 💰', prize:2500, chance:0.10, rarity:'epic' },
            { label:'5000 💰', prize:5000, chance:0.06, rarity:'legendary' },
        ]
    },
    {
        name:'MELL VIP', icon:'👑', price:1000,
        items:[
            { label:'200 💰',   prize:200,   chance:0.20, rarity:'common' },
            { label:'500 💰',   prize:500,   chance:0.22, rarity:'uncommon' },
            { label:'1000 💰',  prize:1000,  chance:0.22, rarity:'uncommon' },
            { label:'2500 💰',  prize:2500,  chance:0.18, rarity:'rare' },
            { label:'5000 💰',  prize:5000,  chance:0.12, rarity:'epic' },
            { label:'10000 💰', prize:10000, chance:0.06, rarity:'legendary' },
        ]
    },
];

const RCOLS = {
    common:'#555', uncommon:'#4488ff', rare:'#b388ff', epic:'#ff3355', legendary:'#ffd700'
};

let selTier = 0, caseSpinning = false;
const caseTiersEl = document.getElementById('case-tiers');
const caseContents = document.getElementById('case-contents');
const caseMsg = document.getElementById('case-msg');
const spinnerBox = document.getElementById('spinner-box');
const spStrip = document.getElementById('sp-strip');

// Build tier buttons
TIERS.forEach((t, i) => {
    const d = document.createElement('div');
    d.className = 'ct' + (i === 0 ? ' sel' : '');
    d.innerHTML = `<span class="ct-ico">${t.icon}</span><span class="ct-name">${t.name}</span><span class="ct-price">${t.price} 💰</span>`;
    d.onclick = () => {
        if (caseSpinning) return;
        document.querySelectorAll('.ct').forEach(x => x.classList.remove('sel'));
        d.classList.add('sel');
        selTier = i;
        renderContents(i);
        spinnerBox.style.display = 'none';
    };
    caseTiersEl.appendChild(d);
});

function renderContents(idx) {
    const tier = TIERS[idx];
    caseContents.innerHTML = '';
    tier.items.forEach(item => {
        const row = document.createElement('div');
        row.className = 'cc-row';
        row.innerHTML = `
            <div class="cc-bar r-${item.rarity}"></div>
            <div class="cc-label">${item.label}</div>
            <div class="cc-chance">${(item.chance*100).toFixed(0)}%</div>
            <div class="cc-prize">${item.prize}</div>
        `;
        caseContents.appendChild(row);
    });
}
renderContents(0);

function pickItem(idx) {
    const items = TIERS[idx].items;
    const r = Math.random();
    let c = 0;
    for (const item of items) { c += item.chance; if (r < c) return item; }
    return items[items.length - 1];
}

/* Get current spinner item width based on screen */
function getSpinnerItemSize() {
    const vw = window.innerWidth;
    if (vw < 380) return { w: 56, gap: 4 };
    if (vw < 600) return { w: 64, gap: 5 };
    return { w: 72, gap: 6 };
}

document.getElementById('btn-open-case').onclick = () => {
    if (caseSpinning) return;
    const tier = TIERS[selTier];
    if (balance < tier.price) { showMsg(caseMsg, 'НЕТ ДЕНЕГ!', 'lose'); return; }
    caseSpinning = true;
    addBal(-tier.price);
    showMsg(caseMsg, 'ОТКРЫВАЕМ...');

    const winItem = pickItem(selTier);
    const TOTAL = 60;
    const WIN_POS = 48;
    const itemList = [];
    for (let i = 0; i < TOTAL; i++) {
        if (i === WIN_POS) {
            itemList.push(winItem);
        } else {
            itemList.push(tier.items[Math.floor(Math.random() * tier.items.length)]);
        }
    }

    const { w: ITEM_W, gap: ITEM_GAP } = getSpinnerItemSize();
    const ITEM_TOTAL = ITEM_W + ITEM_GAP;

    spStrip.innerHTML = '';
    spStrip.style.gap = ITEM_GAP + 'px';

    itemList.forEach((item, i) => {
        const el = document.createElement('div');
        el.className = 'sp-item';
        el.id = i === WIN_POS ? 'sp-winner-item' : '';
        el.style.borderColor = RCOLS[item.rarity];
        el.style.width = ITEM_W + 'px';
        el.style.height = ITEM_W + 'px';
        const valText = item.label.split(' ')[0];
        el.innerHTML = `<span style="color:${RCOLS[item.rarity]};font-size:${Math.max(9, ITEM_W/7)}px">${valText}</span><span class="sp-val">💰</span>`;
        spStrip.appendChild(el);
    });

    spinnerBox.style.display = '';
    caseContents.style.display = 'none';

    const vpCenter = spinnerBox.querySelector('.sp-viewport').offsetWidth / 2;
    const targetOffset = WIN_POS * ITEM_TOTAL + ITEM_W / 2 - vpCenter;

    const duration = 5500;
    const startTime = performance.now();

    function animateSpinner(now) {
        let t = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 5);
        const currentOffset = targetOffset * eased;
        spStrip.style.transform = `translateX(-${currentOffset}px)`;

        if (t < 1) {
            requestAnimationFrame(animateSpinner);
        } else {
            spStrip.style.transform = `translateX(-${targetOffset}px)`;
            const winEl = document.getElementById('sp-winner-item');
            if (winEl) winEl.classList.add('sp-winner');

            setTimeout(() => {
                addBal(winItem.prize);
                showMsg(caseMsg, `ВЫПАЛО: +${winItem.prize} 💰!`, 'win');

                setTimeout(() => {
                    caseSpinning = false;
                    spinnerBox.style.display = 'none';
                    caseContents.style.display = '';
                    showMsg(caseMsg, 'ВЫБЕРИ КЕЙС');
                }, 2500);
            }, 500);
        }
    }
    requestAnimationFrame(animateSpinner);
};
