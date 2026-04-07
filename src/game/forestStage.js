import * as THREE from 'three';
import { createMountainCabin, createLargeRuin } from './buildings.js';

const GROUND_SIZE = 200;
const CLEAR_RADIUS = 9;

const CABIN_COUNT = 20;
const RUIN_COUNT = 6;
/** 建物をスポーン中央から離す（距離の二乗） */
const CLEAR_BUILDING_SQ = (CLEAR_RADIUS + 26) ** 2;

const TREE_COUNT = 300;
const ROCK_COUNT = 95;
const FALLEN_LOG_COUNT = 55;
const STUMP_COUNT = 85;
const BUSH_COUNT = 75;

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function createTree(rng) {
  const g = new THREE.Group();
  const scale = 0.72 + rng() * 0.62;

  const trunkMat = new THREE.MeshStandardMaterial({
    color: 0x4a3528,
    roughness: 0.95,
    metalness: 0,
  });
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14 * scale, 0.2 * scale, 1.4 * scale, 8),
    trunkMat
  );
  trunk.position.y = 0.7 * scale;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  g.add(trunk);

  const leafMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color().setHSL(0.28 + rng() * 0.04, 0.45 + rng() * 0.15, 0.32 + rng() * 0.1),
    roughness: 0.88,
    metalness: 0,
    flatShading: true,
  });

  const layers = 2 + Math.floor(rng() * 2);
  for (let i = 0; i < layers; i++) {
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry((1.1 - i * 0.22) * scale, 2.2 * scale, 7),
      leafMat
    );
    cone.position.y = (1.6 + i * 1.15) * scale;
    cone.castShadow = true;
    g.add(cone);
  }

  g.rotation.y = rng() * Math.PI * 2;
  const trunkR = 0.2 * scale * 1.1;
  const topY = (1.6 + (layers - 1) * 1.15) * scale + (2.2 * scale) * 0.5;
  return { group: g, trunkR, topY };
}

function createRock(rng) {
  const baseR = 0.35 + rng() * 0.55;
  const geo = new THREE.DodecahedronGeometry(baseR, 0);
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color().setHSL(0, 0, 0.38 + rng() * 0.12),
    roughness: 0.92,
    flatShading: true,
  });
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = true;
  m.receiveShadow = true;
  const s = 0.75 + rng() * 0.95;
  m.scale.setScalar(s);
  m.rotation.set(rng() * Math.PI, rng() * Math.PI, rng() * Math.PI);
  return { mesh: m, colliderR: baseR * s * 0.92 };
}

function createStump(rng) {
  const g = new THREE.Group();
  const r = 0.32 + rng() * 0.22;
  const h = 0.45 + rng() * 0.55;
  const mat = new THREE.MeshStandardMaterial({
    color: 0x4f3b2c,
    roughness: 0.94,
    flatShading: true,
  });
  const stump = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.88, r * 1.05, h, 8), mat);
  stump.position.y = h / 2;
  stump.castShadow = true;
  stump.receiveShadow = true;
  g.add(stump);

  if (rng() > 0.45) {
    const knot = new THREE.Mesh(
      new THREE.SphereGeometry(r * 0.55, 6, 5),
      new THREE.MeshStandardMaterial({ color: 0x3d2d22, roughness: 0.95 })
    );
    knot.position.set(r * 0.75, h * 0.55, 0);
    knot.castShadow = true;
    g.add(knot);
  }

  g.rotation.y = rng() * Math.PI * 2;
  return { group: g, colliderR: r + 0.12 };
}

function createBush(rng) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color().setHSL(0.26 + rng() * 0.06, 0.5, 0.28 + rng() * 0.08),
    roughness: 0.9,
    metalness: 0,
    flatShading: true,
  });
  const n = 2 + Math.floor(rng() * 3);
  const base = 0.55 + rng() * 0.45;
  for (let i = 0; i < n; i++) {
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(base * (0.65 + rng() * 0.35), 0.55 + rng() * 0.35, 6),
      mat
    );
    const a = (i / n) * Math.PI * 2 + rng() * 0.5;
    cone.position.set(Math.cos(a) * 0.25, 0.2 + rng() * 0.1, Math.sin(a) * 0.25);
    cone.rotation.z = (rng() - 0.5) * 0.25;
    cone.rotation.x = (rng() - 0.5) * 0.2;
    cone.castShadow = true;
    g.add(cone);
  }
  g.rotation.y = rng() * Math.PI * 2;
  return { group: g, colliderR: 0.42 + rng() * 0.18 };
}

function placeInRing(rng, clearSq, margin) {
  const m = margin ?? 0;
  const span = GROUND_SIZE - m * 2;
  const x = (rng() - 0.5) * span;
  const z = (rng() - 0.5) * span;
  if (x * x + z * z < clearSq) return null;
  return { x, z };
}

/** 建物フットプリント外の位置を選ぶ（木・岩など用） */
function placeInRingAvoid(rng, clearSq, margin, zones) {
  for (let k = 0; k < 55; k++) {
    const p = placeInRing(rng, clearSq, margin);
    if (!p) continue;
    let ok = true;
    for (const z of zones) {
      const dx = p.x - z.cx;
      const dz = p.z - z.cz;
      if (dx * dx + dz * dz < z.r * z.r) {
        ok = false;
        break;
      }
    }
    if (ok) return p;
  }
  return null;
}

/**
 * 森のステージをシーンに追加し、衝突用データを返す
 * @param {THREE.Scene} scene
 * @param {number} [seed=1]
 * @returns {{ colliders: Array<{ x: number, z: number, r: number } | { kind: 'box', cx: number, cz: number, halfW: number, halfD: number, rot: number }>, halfBounds: number }}
 */
export function buildForestStage(scene, seed = 1) {
  const rng = mulberry32(seed);
  const colliders = [];
  const half = GROUND_SIZE / 2;
  const clearSq = CLEAR_RADIUS * CLEAR_RADIUS;
  const clearOuter = (CLEAR_RADIUS + 3) ** 2;

  scene.fog = new THREE.Fog(0x8fa99a, 10, 95);
  scene.background = new THREE.Color(0xa8c4d4);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(GROUND_SIZE, GROUND_SIZE, 1, 1),
    new THREE.MeshStandardMaterial({
      color: 0x2d4a32,
      roughness: 0.92,
      metalness: 0.05,
    })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const hemi = new THREE.HemisphereLight(0xc8e8ff, 0x2a3d28, 0.55);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xfff5e6, 1.05);
  sun.position.set(28, 52, 18);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 2;
  sun.shadow.camera.far = 130;
  sun.shadow.camera.left = -85;
  sun.shadow.camera.right = 85;
  sun.shadow.camera.top = 85;
  sun.shadow.camera.bottom = -85;
  sun.shadow.bias = -0.0002;
  scene.add(sun);

  const fill = new THREE.DirectionalLight(0x8ab4c8, 0.25);
  fill.position.set(-20, 12, -30);
  scene.add(fill);

  const buildingClearances = [];
  /** サル用：木登りターゲット */
  const treeTrunks = [];

  for (let i = 0; i < CABIN_COUNT; i++) {
    const p = placeInRing(rng, CLEAR_BUILDING_SQ, 26);
    if (!p) {
      i--;
      continue;
    }
    const { group, halfW, halfD } = createMountainCabin(rng);
    const rot = rng() * Math.PI * 2;
    group.position.set(p.x, 0, p.z);
    group.rotation.y = rot;
    scene.add(group);
    colliders.push({ kind: 'box', cx: p.x, cz: p.z, halfW, halfD, rot, h: 6.2 });
    buildingClearances.push({
      cx: p.x,
      cz: p.z,
      r: Math.hypot(halfW, halfD) + 2.2,
    });
  }

  for (let i = 0; i < RUIN_COUNT; i++) {
    const p = placeInRing(rng, CLEAR_BUILDING_SQ, 32);
    if (!p) {
      i--;
      continue;
    }
    const { group, halfW, halfD } = createLargeRuin(rng);
    const rot = rng() * Math.PI * 2;
    group.position.set(p.x, 0, p.z);
    group.rotation.y = rot;
    scene.add(group);
    colliders.push({ kind: 'box', cx: p.x, cz: p.z, halfW, halfD, rot, h: 8.8 });
    buildingClearances.push({
      cx: p.x,
      cz: p.z,
      r: Math.hypot(halfW, halfD) + 3.5,
    });
  }

  for (let i = 0; i < TREE_COUNT; i++) {
    const p = placeInRingAvoid(rng, clearSq, 10, buildingClearances);
    if (!p) continue;
    const { x, z } = p;
    const { group: tree, trunkR, topY } = createTree(rng);
    /** 射線判定では木だけ貫通させる */
    tree.userData.bulletPassThrough = true;
    tree.position.set(x, 0, z);
    scene.add(tree);
    colliders.push({ x, z, r: trunkR, h: topY });
    treeTrunks.push({ x, z, r: trunkR, topY });
  }

  for (let i = 0; i < ROCK_COUNT; i++) {
    const p = placeInRingAvoid(rng, clearOuter, 14, buildingClearances);
    if (!p) continue;
    const { x, z } = p;
    const { mesh, colliderR } = createRock(rng);
    mesh.position.set(x, colliderR * 0.45, z);
    scene.add(mesh);
    colliders.push({ x, z, r: colliderR, h: colliderR * 1.35 });
  }

  const logMat = new THREE.MeshStandardMaterial({
    color: 0x3d2e22,
    roughness: 0.96,
    metalness: 0,
  });

  for (let i = 0; i < FALLEN_LOG_COUNT; i++) {
    const p = placeInRingAvoid(rng, (CLEAR_RADIUS + 4) ** 2, 16, buildingClearances);
    if (!p) continue;
    const { x, z } = p;
    const len = 2.4 + rng() * 3.2;
    const theta = rng() * Math.PI * 2;
    const log = new THREE.Mesh(new THREE.BoxGeometry(len, 0.44, 0.52), logMat);
    log.position.set(x, 0.22, z);
    log.rotation.y = theta;
    log.castShadow = true;
    log.receiveShadow = true;
    scene.add(log);

    colliders.push({
      kind: 'box',
      cx: x,
      cz: z,
      halfW: len * 0.5 + 0.08,
      halfD: 0.34,
      rot: theta,
      h: 0.52,
    });
  }

  for (let i = 0; i < STUMP_COUNT; i++) {
    const p = placeInRingAvoid(rng, clearOuter, 14, buildingClearances);
    if (!p) continue;
    const { x, z } = p;
    const { group, colliderR } = createStump(rng);
    group.position.set(x, 0, z);
    scene.add(group);
    colliders.push({ x, z, r: colliderR, h: 1.05 });
  }

  for (let i = 0; i < BUSH_COUNT; i++) {
    const p = placeInRingAvoid(rng, clearOuter, 14, buildingClearances);
    if (!p) continue;
    const { x, z } = p;
    const { group, colliderR } = createBush(rng);
    group.position.set(x, 0, z);
    scene.add(group);
    colliders.push({ x, z, r: colliderR, h: 0.95 });
  }

  return { colliders, halfBounds: half - 1.5, treeTrunks };
}
