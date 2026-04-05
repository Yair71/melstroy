// ============================================================
// index.js — Адаптер для интеграции Казино в главное Лобби
// ============================================================

export function createGame(mount, api) {
    // 1. Создаем iframe с игрой
    const iframe = document.createElement('iframe');
    
    // Путь должен быть относительно корня (откуда запускается главное лобби)
    iframe.src = './games/casino/index.html'; 
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.style.borderRadius = '8px';

    // 2. Обработчик сообщений от iframe
    function handleMessage(event) {
        // Убеждаемся, что сообщение пришло именно из нашего казино
        if (event.source !== iframe.contentWindow) return;

        // Казино запрашивает актуальный баланс при загрузке
        if (event.data.type === 'REQUEST_BALANCE') {
            const profile = api.getProfile();
            iframe.contentWindow.postMessage({ type: 'SYNC_BALANCE', balance: profile.coins }, '*');
        }

        // Казино отправляет выигрыш (или снимает ставку отрицательным числом)
        if (event.data.type === 'ADD_BALANCE') {
            api.addCoins(event.data.amount); 
            api.onUiUpdate(); // Обновляем шапку лобби (чтобы сразу видеть как меняются деньги)
            
            // Отправляем новый баланс обратно в казино
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
            // Обязательно убираем слушатель при выходе из игры
            window.removeEventListener('message', handleMessage);
            mount.innerHTML = '';
        }
    };
}
