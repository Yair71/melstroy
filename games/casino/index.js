export function createGame(mount, api) {
    const iframe = document.createElement('iframe');
    iframe.src = './games/casino/index.html'; 
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.style.borderRadius = '8px';

    function handleMessage(event) {
        // Защита: слушаем только сообщения из нашего iframe
        if (event.source !== iframe.contentWindow) return;

        if (event.data.type === 'REQUEST_BALANCE') {
            const profile = api.getProfile();
            iframe.contentWindow.postMessage({ type: 'SYNC_BALANCE', balance: profile.coins }, '*');
        }

        if (event.data.type === 'ADD_BALANCE') {
            api.addCoins(event.data.amount); 
            api.onUiUpdate(); 
            // Отправляем новый баланс обратно
            const profile = api.getProfile();
            iframe.contentWindow.postMessage({ type: 'SYNC_BALANCE', balance: profile.coins }, '*');
        }
    }

    return {
        start: () => {
            mount.appendChild(iframe);
            window.addEventListener('message', handleMessage);
        },
        stop: () => {
            window.removeEventListener('message', handleMessage);
            mount.innerHTML = ''; // Полное уничтожение iframe убивает всех "призраков"
        }
    };
}
