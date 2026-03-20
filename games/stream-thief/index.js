// ... (начало файла без изменений)

    async function init3D() {
        scene = new THREE.Scene();
        clock = new THREE.Clock();

        const width = window.innerWidth;
        const height = window.innerHeight;
        
        camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
        
        // ПОЗИЦИЯ КАМЕРЫ: 
        // x: 0 (центр)
        // y: 4.5 (высота роста человека, чтобы быть НАД столом)
        // z: 7 (стоим перед столом)
        camera.position.set(0, 4.5, 7); 
        
        // КАМЕРА СМОТРИТ НА:
        // x: 0 (центр)
        // y: 1.5 (уровень стола)
        // z: -2 (вглубь комнаты на Мелстроя)
        camera.lookAt(0, 1.5, -2);

        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        root.appendChild(renderer.domElement);

// ... (дальше загрузка ассетов и остальной код без изменений)
