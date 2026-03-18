// games/stream-thief/world.js
export function initWorld(scene) {
  // 1. Пол и Стены (оставляем как есть)
  const floorGeo = new THREE.PlaneGeometry(30, 30);
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x1a1a24, roughness: 0.8 });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  const wallGeo = new THREE.PlaneGeometry(30, 15);
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x111118, roughness: 0.9 });
  const backWall = new THREE.Mesh(wallGeo, wallMat);
  backWall.position.set(0, 7.5, -9); // Чуть отодвинули стену
  scene.add(backWall);

  // 2. Геймерский стол 
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

  // 3. НОВЫЙ ИДЕАЛЬНЫЙ СТУЛ (Не проваливаемся в текстуры)
  const chairGroup = new THREE.Group();
  const chairMat = new THREE.MeshStandardMaterial({ color: 0xaa0000, roughness: 0.7 });
  
  // Сиденье. Его верхняя грань должна быть на высоте 1.8 (CONFIG.streamerYOffset).
  // Центр по Y = 1.6, половина высоты = 0.2. В сумме = 1.8.
  const seatGeo = new THREE.BoxGeometry(3, 0.4, 3);
  const seat = new THREE.Mesh(seatGeo, chairMat);
  seat.position.set(0, 1.6, -6.5); 

  // Спинка отодвинута назад, чтобы Мел мог откинуться
  const backrestGeo = new THREE.BoxGeometry(2.8, 4, 0.4);
  const backrest = new THREE.Mesh(backrestGeo, chairMat);
  backrest.position.set(0, 3.6, -7.8); 

  const baseGeo = new THREE.CylinderGeometry(0.2, 0.2, 1.6);
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.set(0, 0.8, -6.5);

  chairGroup.add(seat, backrest, base);
  scene.add(chairGroup);

  // Мониторы, ПК и Полка (Код из твоего оригинала остается без изменений)
  // ... (вставь сюда свой код мониторов и ПК из оригинального world.js)
}
