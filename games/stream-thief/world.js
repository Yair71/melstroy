// games/stream-thief/world.js

export function initWorld(scene) {
    // 1. Пол и Стены
    const floorGeo = new THREE.PlaneGeometry(30, 30);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x1a1a24, roughness: 0.8 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    scene.add(floor);

    const wallGeo = new THREE.PlaneGeometry(30, 15);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x111118, roughness: 0.9 });
    const backWall = new THREE.Mesh(wallGeo, wallMat);
    backWall.position.set(0, 7.5, -8);
    scene.add(backWall);

    // 2. Геймерский стол (широкий и массивный)
    const tableGeo = new THREE.BoxGeometry(12, 0.5, 5);
    const tableMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5 });
    const table = new THREE.Mesh(tableGeo, tableMat);
    table.position.set(0, 3, -3);
    scene.add(table);

    // Ножки стола
    const legGeo = new THREE.BoxGeometry(0.5, 3, 4);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
    const legL = new THREE.Mesh(legGeo, legMat);
    legL.position.set(-5.5, 1.5, -3);
    const legR = legL.clone();
    legR.position.set(5.5, 1.5, -3);
    scene.add(legL, legR);

    // 3. Кресло стримера (за столом)
    const chairGroup = new THREE.Group();
    const seatGeo = new THREE.BoxGeometry(3, 0.5, 3);
    const chairMat = new THREE.MeshStandardMaterial({ color: 0xaa0000, roughness: 0.7 }); // Красное геймерское
    const seat = new THREE.Mesh(seatGeo, chairMat);
    seat.position.set(0, 2, -1.5);
    
    const backrestGeo = new THREE.BoxGeometry(2.8, 4, 0.5);
    const backrest = new THREE.Mesh(backrestGeo, chairMat);
    backrest.position.set(0, 4.2, -0.2); // Спинка
    
    const baseGeo = new THREE.CylinderGeometry(0.2, 0.2, 2);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.set(0, 1, -1.5);

    chairGroup.add(seat, backrest, base);
    scene.add(chairGroup);

    // 4. Мониторы
    const monitorMat = new THREE.MeshStandardMaterial({ color: 0x050505 });
    const screenMat = new THREE.MeshBasicMaterial({ color: 0x00FF41 }); // Светящийся зеленый экран
    
    const monitorGroup = new THREE.Group();
    
    // Левый монитор
    const mon1Base = new THREE.Mesh(new THREE.BoxGeometry(3, 2, 0.2), monitorMat);
    mon1Base.position.set(-2, 4.5, -4.5);
    mon1Base.rotation.y = 0.2;
    const screen1 = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 1.8), screenMat);
    screen1.position.set(-2, 4.5, -4.39);
    screen1.rotation.y = 0.2;
    
    // Правый монитор
    const mon2Base = new THREE.Mesh(new THREE.BoxGeometry(3, 2, 0.2), monitorMat);
    mon2Base.position.set(2, 4.5, -4.5);
    mon2Base.rotation.y = -0.2;
    const screen2 = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 1.8), screenMat);
    screen2.position.set(2, 4.5, -4.39);
    screen2.rotation.y = -0.2;

    monitorGroup.add(mon1Base, screen1, mon2Base, screen2);
    scene.add(monitorGroup);

    // 5. Системный блок с "RGB"
    const pcGeo = new THREE.BoxGeometry(1.5, 3.5, 4);
    const pcMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8 });
    const pc = new THREE.Mesh(pcGeo, pcMat);
    pc.position.set(4.5, 1.75, -3.5);
    scene.add(pc);

    // Подсветка внутри ПК
    const rgbLight = new THREE.PointLight(0xFF00FF, 1, 5);
    rgbLight.position.set(4.5, 2, -3);
    scene.add(rgbLight);

    // 6. Полка с декором на задней стене
    const shelfGeo = new THREE.BoxGeometry(6, 0.2, 1);
    const shelf = new THREE.Mesh(shelfGeo, tableMat);
    shelf.position.set(-3, 8, -7.5);
    scene.add(shelf);
    
    // Коробка на полке
    const boxGeo = new THREE.BoxGeometry(1, 1, 1);
    const boxMat = new THREE.MeshStandardMaterial({ color: 0x0088ff });
    const box = new THREE.Mesh(boxGeo, boxMat);
    box.position.set(-4, 8.6, -7.5);
    scene.add(box);
}

