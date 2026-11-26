import * as THREE from 'three';

export type WorldRefs = {
  root: THREE.Group;
  envelopeMountain: THREE.Group;
  sedan: THREE.Group;
  sedanDoor: THREE.Mesh;
  headlightLeft: THREE.Mesh;
  headlightRight: THREE.Mesh;
  porchBulb: THREE.Mesh;
  announcementBoard: THREE.Group;
  centralTower: THREE.Group;
};

export function createWorld(): WorldRefs {
  const root = new THREE.Group();

  // 1. Ground & Village Asphalt Road (y = 0)
  const groundMat = new THREE.MeshStandardMaterial({ color: '#6E8F5E', roughness: 0.92 });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  root.add(ground);

  const roadMat = new THREE.MeshStandardMaterial({ color: '#3F444C', roughness: 0.88 });
  const road = new THREE.Mesh(new THREE.PlaneGeometry(60, 5.2), roadMat);
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, 0.015, 6.2);
  road.receiveShadow = true;
  root.add(road);

  // 2. Rudi's Kampung House & Terrace (grounded on y = 0)
  const house = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({ color: '#E8DFCA', roughness: 0.85 });
  const roofMat = new THREE.MeshStandardMaterial({ color: '#B4532A', roughness: 0.82 });
  const tileMat = new THREE.MeshStandardMaterial({ color: '#CBD5E1', roughness: 0.7 });
  const woodMat = new THREE.MeshStandardMaterial({ color: '#784421', roughness: 0.8 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(7.2, 3.6, 5.0), wallMat);
  body.position.set(0, 1.8, -2.8);
  body.castShadow = true;
  body.receiveShadow = true;
  house.add(body);

  const roof = new THREE.Mesh(new THREE.ConeGeometry(5.6, 2.2, 4), roofMat);
  roof.rotation.y = Math.PI / 4;
  roof.position.set(0, 4.6, -2.5);
  roof.castShadow = true;
  house.add(roof);

  // Terrace floor (y = 0.25)
  const terrace = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.25, 2.8), tileMat);
  terrace.position.set(0, 0.125, 0.6);
  terrace.receiveShadow = true;
  house.add(terrace);

  // Terrace pillars
  for (const px of [-3.0, 3.0]) {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.24, 3.1, 0.24), wallMat);
    pillar.position.set(px, 1.8, 1.85);
    pillar.castShadow = true;
    house.add(pillar);
  }

  // Front door & window
  const door = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.2, 0.12), woodMat);
  door.position.set(-1.1, 1.35, -0.32);
  house.add(door);

  const windowGlass = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 1.1, 0.1),
    new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.25 })
  );
  windowGlass.position.set(1.4, 1.75, -0.32);
  house.add(windowGlass);

  // Porch Lamp Bulb (motivated light anchor)
  const porchBulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 16, 16),
    new THREE.MeshStandardMaterial({
      color: '#FEF08A',
      emissive: '#F59E0B',
      emissiveIntensity: 0.2,
    })
  );
  porchBulb.position.set(0, 3.05, 1.4);
  house.add(porchBulb);

  // Wooden Chair & Table on terrace
  const tableTop = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.1, 0.8), woodMat);
  tableTop.position.set(0.45, 0.95, 1.0);
  tableTop.castShadow = true;
  tableTop.receiveShadow = true;
  house.add(tableTop);

  const chair = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.55, 0.65), woodMat);
  chair.position.set(-0.55, 0.52, 0.35);
  chair.castShadow = true;
  house.add(chair);

  // Low Bamboo/Wood Fence
  for (let fx = -6; fx <= 6; fx += 0.9) {
    if (Math.abs(fx) < 1.3) continue; // front gate opening
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.0, 0.14), woodMat);
    post.position.set(fx, 0.5, 3.2);
    post.castShadow = true;
    house.add(post);
  }

  root.add(house);

  // 3. Envelope Mountain on Table (visible S08–S09)
  const envelopeMountain = new THREE.Group();
  const envMat = new THREE.MeshStandardMaterial({ color: '#D9B382', roughness: 0.78 });
  for (let i = 0; i < 40; i++) {
    const layer = Math.floor(i / 8);
    const col = i % 8;
    const env = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.045, 0.16), envMat);
    env.position.set(
      0.1 + (col % 4) * 0.22 + (layer * 0.02),
      1.03 + layer * 0.052 + (col >= 4 ? 0.025 : 0),
      0.85 + Math.floor(col / 4) * 0.24
    );
    env.rotation.y = ((i * 37) % 10 - 5) * 0.04;
    env.castShadow = true;
    envelopeMountain.add(env);
  }
  envelopeMountain.visible = false;
  root.add(envelopeMountain);

  // 4. Stylized Village Trees
  const trunkMat = new THREE.MeshStandardMaterial({ color: '#5C4033', roughness: 0.9 });
  const leafMat = new THREE.MeshStandardMaterial({ color: '#3F7D42', roughness: 0.85 });
  for (const [tx, tz] of [[-6.5, -1.5], [6.8, -2.0], [-8.5, 9.5], [9.5, 9.0]]) {
    const tree = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 2.4, 8), trunkMat);
    trunk.position.y = 1.2;
    trunk.castShadow = true;
    const crown = new THREE.Mesh(new THREE.DodecahedronGeometry(1.5, 1), leafMat);
    crown.position.y = 3.1;
    crown.castShadow = true;
    tree.add(trunk, crown);
    tree.position.set(tx, 0, tz);
    root.add(tree);
  }

  // 5. Black Sedan (S10–S16)
  const sedan = new THREE.Group();
  const carBodyMat = new THREE.MeshStandardMaterial({ color: '#111827', roughness: 0.25, metalness: 0.65 });
  const glassMat = new THREE.MeshStandardMaterial({ color: '#1E293B', roughness: 0.15, metalness: 0.4 });
  const wheelMat = new THREE.MeshStandardMaterial({ color: '#09090B', roughness: 0.85 });

  const chassis = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.72, 1.85), carBodyMat);
  chassis.position.y = 0.62;
  chassis.castShadow = true;
  sedan.add(chassis);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.65, 1.62), glassMat);
  cabin.position.set(0.15, 1.25, 0);
  cabin.castShadow = true;
  sedan.add(cabin);

  // Opening rear/front door pivot
  const sedanDoor = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.68, 0.08), carBodyMat);
  sedanDoor.position.set(0.3, 0.68, -0.94);
  sedan.add(sedanDoor);

  for (const [wx, wz] of [[-1.3, 0.92], [1.3, 0.92], [-1.3, -0.92], [1.3, -0.92]]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.24, 16), wheelMat);
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(wx, 0.34, wz);
    sedan.add(wheel);
  }

  const hlMat = new THREE.MeshStandardMaterial({
    color: '#FEF9C3',
    emissive: '#FEF08A',
    emissiveIntensity: 2.5,
  });
  const headlightLeft = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 0.32), hlMat);
  headlightLeft.position.set(-2.12, 0.65, -0.62);
  const headlightRight = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 0.32), hlMat);
  headlightRight.position.set(-2.12, 0.65, 0.62);
  sedan.add(headlightLeft, headlightRight);

  sedan.position.set(14, 0, 5.8);
  root.add(sedan);

  // 6. Announcement Board with 40 LOLOS badges (S15)
  const announcementBoard = new THREE.Group();
  const boardFrame = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.0, 0.14), woodMat);
  boardFrame.position.set(0, 1.9, 0);
  boardFrame.castShadow = true;
  announcementBoard.add(boardFrame);

  const boardFace = new THREE.Mesh(
    new THREE.PlaneGeometry(2.95, 1.75),
    new THREE.MeshStandardMaterial({ color: '#F8FAFC', roughness: 0.8 })
  );
  boardFace.position.set(0, 1.9, 0.08);
  announcementBoard.add(boardFace);

  const badgeMat = new THREE.MeshStandardMaterial({ color: '#16A34A', roughness: 0.5 });
  for (let i = 0; i < 40; i++) {
    const r = Math.floor(i / 8);
    const c = i % 8;
    const badge = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 0.03), badgeMat);
    badge.position.set(-1.12 + c * 0.32, 2.42 - r * 0.28, 0.09);
    announcementBoard.add(badge);
  }
  announcementBoard.position.set(6.4, 0, 1.5);
  root.add(announcementBoard);

  // 7. Central Office Tower Silhouette (S15 promotion beat)
  const centralTower = new THREE.Group();
  const towerMat = new THREE.MeshStandardMaterial({ color: '#1E293B', roughness: 0.4, metalness: 0.5 });
  const tower = new THREE.Mesh(new THREE.BoxGeometry(3.8, 12.5, 3.8), towerMat);
  tower.position.set(12.0, 6.25, -4.5);
  centralTower.add(tower);
  root.add(centralTower);

  return {
    root,
    envelopeMountain,
    sedan,
    sedanDoor,
    headlightLeft,
    headlightRight,
    porchBulb,
    announcementBoard,
    centralTower,
  };
}
