import * as THREE from 'three';

const WOOD = 0x5c4030;
const WOOD_DARK = 0x3d2a22;
const STONE_DARK = 0x4a4a52;
const WINDOW = 0x2a2520;

/**
 * @param {THREE.Group} parent
 * @param {object} rng
 */
function woodMat(rng) {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color().setHSL(0.08 + rng() * 0.03, 0.35 + rng() * 0.1, 0.28 + rng() * 0.08),
    roughness: 0.92,
    metalness: 0,
    flatShading: true,
  });
}

function stoneMat(rng) {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color().setHSL(0, 0, 0.42 + rng() * 0.12),
    roughness: 0.94,
    flatShading: true,
  });
}

/**
 * 山小屋（ログ＋切妻屋根・窓・縁側）
 * @returns {{ group: THREE.Group, halfW: number, halfD: number }}
 */
export function createMountainCabin(rng) {
  const g = new THREE.Group();
  const halfW = 1.85 + rng() * 0.55;
  const halfD = 1.45 + rng() * 0.45;
  const wallH = 2.15 + rng() * 0.35;
  const wm = woodMat(rng);
  const rm = new THREE.MeshStandardMaterial({
    color: new THREE.Color().setHSL(0.1, 0.15, 0.22 + rng() * 0.06),
    roughness: 0.9,
    flatShading: true,
  });

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(halfW * 2, wallH, halfD * 2),
    wm
  );
  body.position.y = wallH / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  g.add(body);

  const porch = new THREE.Mesh(
    new THREE.BoxGeometry(halfW * 2 + 0.5, 0.14, 1.1),
    new THREE.MeshStandardMaterial({ color: WOOD_DARK, roughness: 0.95 })
  );
  porch.position.set(0, 0.07, halfD + 0.35);
  porch.castShadow = true;
  porch.receiveShadow = true;
  g.add(porch);

  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(Math.hypot(halfW, halfD) * 1.35, 1.4, 4, 1),
    rm
  );
  roof.position.y = wallH + 0.55;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  g.add(roof);

  const win = new THREE.Mesh(
    new THREE.PlaneGeometry(0.55, 0.45),
    new THREE.MeshStandardMaterial({ color: WINDOW, roughness: 0.85 })
  );
  win.position.set(halfW - 0.01, wallH * 0.55, 0);
  win.rotation.y = Math.PI / 2;
  g.add(win);

  const chimney = new THREE.Mesh(
    new THREE.BoxGeometry(0.45, 1.1, 0.45),
    new THREE.MeshStandardMaterial({ color: STONE_DARK, roughness: 0.95 })
  );
  chimney.position.set(-halfW * 0.45, wallH + 0.9, -halfD * 0.35);
  chimney.castShadow = true;
  g.add(chimney);

  return { group: g, halfW: halfW + 0.15, halfD: halfD + 0.35 + 0.2 };
}

/**
 * 大きめの廃墟（石壁の断片・柱・床の穴・破れた屋根）
 * @returns {{ group: THREE.Group, halfW: number, halfD: number }}
 */
export function createLargeRuin(rng) {
  const g = new THREE.Group();
  const halfW = 5 + rng() * 4;
  const halfD = 4 + rng() * 3;
  const sm = stoneMat(rng);
  const sm2 = new THREE.MeshStandardMaterial({
    color: new THREE.Color().setHSL(0, 0, 0.32 + rng() * 0.1),
    roughness: 0.96,
    flatShading: true,
  });

  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(halfW * 2.2, 0.2, halfD * 2.2),
    sm2
  );
  floor.position.y = 0.1;
  floor.receiveShadow = true;
  floor.castShadow = true;
  g.add(floor);

  const wallT = 0.35 + rng() * 0.15;
  const wallH = 2.8 + rng() * 1.8;

  const addWall = (sx, sz, px, pz, rotY) => {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(sx, wallH, sz),
      rng() > 0.35 ? sm : sm2
    );
    mesh.position.set(px, wallH / 2 + 0.1, pz);
    mesh.rotation.y = rotY;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    if (rng() > 0.55) {
      mesh.scale.y = 0.4 + rng() * 0.5;
      mesh.position.y = mesh.scale.y * wallH * 0.25 + 0.1;
    }
    g.add(mesh);
  };

  addWall(halfW * 2 + wallT, wallT, 0, -halfD, 0);
  addWall(wallT, halfD * 1.2, -halfW * 0.85, 0, 0);
  addWall(wallT, halfD * 0.9, halfW * 0.75, halfD * 0.35, 0);
  addWall(halfW * 1.4, wallT, -halfW * 0.2, halfD * 0.85, 0);

  for (let i = 0; i < 3 + Math.floor(rng() * 4); i++) {
    const ch = 2.2 + rng() * 1.5;
    const col = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28 + rng() * 0.12, 0.35 + rng() * 0.15, ch, 6),
      sm
    );
    col.position.set(
      (rng() - 0.5) * halfW * 1.6,
      ch / 2 + 0.1,
      (rng() - 0.5) * halfD * 1.6
    );
    col.castShadow = true;
    g.add(col);
  }

  const debris = 2 + Math.floor(rng() * 5);
  for (let i = 0; i < debris; i++) {
    const d = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.35 + rng() * 0.5, 0),
      sm2
    );
    d.position.set(
      (rng() - 0.5) * halfW * 1.9,
      0.2 + rng() * 0.15,
      (rng() - 0.5) * halfD * 1.9
    );
    d.rotation.set(rng() * Math.PI, rng() * Math.PI, rng() * Math.PI);
    d.castShadow = true;
    g.add(d);
  }

  const beam = new THREE.Mesh(
    new THREE.BoxGeometry(halfW * 1.8, 0.25, 0.3),
    new THREE.MeshStandardMaterial({ color: WOOD_DARK, roughness: 0.95 })
  );
  beam.position.set(0, wallH * 0.85, 0);
  beam.rotation.y = rng() * 0.2;
  beam.castShadow = true;
  g.add(beam);

  return { group: g, halfW: halfW + 0.5, halfD: halfD + 0.5 };
}
