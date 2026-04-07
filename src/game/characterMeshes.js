import * as THREE from 'three';

const mat = (color, rough = 0.85) =>
  new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0.05, flatShading: true });

const gunMetal = () =>
  new THREE.MeshStandardMaterial({ color: 0x12141a, roughness: 0.4, metalness: 0.6, flatShading: true });
const gunWood = () =>
  new THREE.MeshStandardMaterial({ color: 0x4a3324, roughness: 0.88, metalness: 0.02, flatShading: true });

function attachOutlineEdges(mesh, color, angleThreshold = 42) {
  const edges = new THREE.EdgesGeometry(mesh.geometry, angleThreshold);
  const line = new THREE.LineSegments(
    edges,
    new THREE.LineBasicMaterial({
      color,
      fog: false,
      toneMapped: false,
      depthTest: true,
      polygonOffset: true,
      polygonOffsetFactor: -5,
      polygonOffsetUnits: -4,
    }),
  );
  line.renderOrder = 30;
  mesh.add(line);
  return line;
}

function addHunterRifleWorld(parent) {
  const rifle = new THREE.Group();
  const metal = gunMetal();
  const wood = gunWood();
  const rx = -0.22;

  const stock = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.1, 0.36), wood);
  stock.position.set(-0.2, 1.1, -0.22);
  stock.castShadow = true;
  rifle.add(stock);
  const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.3), metal);
  receiver.position.set(rx, 1.13, 0.1);
  receiver.castShadow = true;
  rifle.add(receiver);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.03, 0.52, 8), metal);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(rx, 1.14, 0.52);
  barrel.castShadow = true;
  rifle.add(barrel);
  const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.022, 0.18, 8), metal);
  scope.rotation.x = Math.PI / 2;
  scope.position.set(rx, 1.21, 0.08);
  scope.castShadow = true;
  rifle.add(scope);

  attachOutlineEdges(stock, 0xfff6f0, 40);
  attachOutlineEdges(receiver, 0xfafcff, 34);
  attachOutlineEdges(barrel, 0xa8b4c8, 22);
  attachOutlineEdges(scope, 0xd8e6fc, 28);
  parent.add(rifle);
}

function fpGunMetalBasic(depthOffset = 0) {
  return new THREE.MeshBasicMaterial({
    color: 0x16181f,
    fog: false,
    toneMapped: false,
    depthWrite: true,
    depthTest: true,
    polygonOffset: true,
    polygonOffsetFactor: depthOffset,
    polygonOffsetUnits: 1,
  });
}
function fpGunWoodBasic() {
  return new THREE.MeshBasicMaterial({
    color: 0xa07858,
    fog: false,
    toneMapped: false,
    depthWrite: true,
    depthTest: true,
  });
}
function fpGunMuzzleDark() {
  return new THREE.MeshBasicMaterial({
    color: 0x0c0e12,
    fog: false,
    toneMapped: false,
    depthWrite: true,
    depthTest: true,
    side: THREE.DoubleSide,
  });
}

export function createHunterFirstPersonGun() {
  const g = new THREE.Group();
  const mb = fpGunMetalBasic;
  const wood = fpGunWoodBasic();

  const stock = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.09, 0.22), wood);
  stock.position.set(0, -0.018, 0.045);
  g.add(stock);
  const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.072, 0.1, 0.24), mb(0));
  receiver.position.set(0, 0, -0.085);
  g.add(receiver);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.016, 0.52, 12), mb(-0.5));
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 0.012, -0.44);
  g.add(barrel);

  const scopeRig = new THREE.Object3D();
  scopeRig.position.set(0, 0.076, -0.102);
  g.add(scopeRig);
  g.userData.fpScopeLocal = scopeRig.position.clone();
  g.userData.fpScopeAimLocal = scopeRig.position.clone().add(new THREE.Vector3(0, 0, 0.014));

  const eyeCup = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.01, 0.026, 12, 1, true), mb(-0.85));
  eyeCup.rotation.x = Math.PI / 2;
  eyeCup.position.set(0, 0, 0.014);
  eyeCup.userData.fpHideWhenAds = true;
  scopeRig.add(eyeCup);

  const eyeGlass = new THREE.Mesh(
    new THREE.CircleGeometry(0.013, 20),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      fog: false,
      toneMapped: false,
      side: THREE.DoubleSide,
      depthWrite: false,
      transparent: true,
      opacity: 0,
    }),
  );
  eyeGlass.position.set(0, 0, 0.012);
  eyeGlass.visible = false;
  scopeRig.add(eyeGlass);
  g.userData.fpScopeEyeGlassMesh = eyeGlass;

  const fore = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.048, 0.16), mb(-0.3));
  fore.position.set(0, -0.028, -0.28);
  g.add(fore);
  const muzzleRing = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.014, 0.028, 12), mb(-1.5));
  muzzleRing.rotation.x = Math.PI / 2;
  muzzleRing.position.set(0, 0.012, -0.72);
  g.add(muzzleRing);
  const muzzleCap = new THREE.Mesh(new THREE.CircleGeometry(0.012, 12), fpGunMuzzleDark());
  muzzleCap.position.set(0, 0.012, -0.708);
  g.add(muzzleCap);

  g.frustumCulled = false;
  g.renderOrder = 10;
  g.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = false;
      o.receiveShadow = false;
    }
  });
  return g;
}

export function setFpGunBodyHiddenForAiming(gun, aiming) {
  gun.traverse((o) => {
    if (!o.isMesh) return;
    if (o.userData?.fpHideWhenAds) o.visible = !aiming;
  });
}

export function syncFirstPersonGunToCamera(camera, gun, opts = {}) {
  const aiming = !!opts.aiming;
  const recoil = Math.max(0, Math.min(1, opts.recoil ?? 0));
  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  const upWorld = new THREE.Vector3(0, 1, 0);
  let right = new THREE.Vector3().crossVectors(forward, upWorld);
  if (right.lengthSq() < 1e-8) right.set(1, 0, 0);
  else right.normalize();
  const up = new THREE.Vector3().crossVectors(right, forward).normalize();

  gun.quaternion.copy(camera.quaternion);
  const aimLocal = aiming
    ? (gun.userData.fpScopeAimLocal ?? new THREE.Vector3(0, 0.076, -0.088))
    : (gun.userData.fpScopeLocal ?? new THREE.Vector3(0, 0.076, -0.102));
  const aimWorldOffset = aimLocal.clone().multiplyScalar(gun.scale.x).applyQuaternion(gun.quaternion);

  if (aiming) {
    gun.position.copy(camera.position).addScaledVector(forward, 0.14).sub(aimWorldOffset);
    gun.rotateX(recoil * 0.3);
    gun.rotateY(recoil * 0.06);
  } else {
    gun.position
      .copy(camera.position)
      .addScaledVector(forward, 0.4)
      .addScaledVector(right, 0.72)
      .addScaledVector(up, -0.58);
    gun.rotateX(0.038 - recoil * 0.28);
    gun.rotateY(-0.04);
  }
}

const MONKEY_RIGHT_ARM_RAISE_RY = -0.62;
const MONKEY_RIGHT_ARM_RAISE_RX = (-120 * Math.PI) / 180;

export function syncMonkeyRightArmRaise(mesh, raised, dt) {
  const pivot = mesh?.userData?.monkeyRightArmPivot;
  if (!pivot) return;
  const smooth = raised ? 14 : 26;
  const k = 1 - Math.exp(-smooth * Math.min(dt, 0.05));
  const tx = raised ? MONKEY_RIGHT_ARM_RAISE_RX : 0;
  const ty = raised ? MONKEY_RIGHT_ARM_RAISE_RY : 0;
  pivot.rotation.x = THREE.MathUtils.lerp(pivot.rotation.x, tx, k);
  pivot.rotation.y = THREE.MathUtils.lerp(pivot.rotation.y, ty, k);
}

export function setHunterPoopHitHighlight(mesh, active) {
  if (!mesh) return;
  mesh.traverse((o) => {
    if (!o.isLineSegments || !o.material?.isLineBasicMaterial) return;
    if (o.material.userData._poopOrigHex === undefined) {
      o.material.userData._poopOrigHex = o.material.color.getHex();
    }
    o.material.color.setHex(active ? 0xff2222 : o.material.userData._poopOrigHex);
    o.material.depthTest = !active;
    o.renderOrder = active ? 1000 : 30;
  });
}

export function createCharacterMesh(role) {
  const g = new THREE.Group();
  if (role === 'hunter') {
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.85, 4, 8), mat(0x4a6e8a));
    body.position.y = 0.975;
    body.castShadow = true;
    g.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), mat(0xd4a574));
    head.position.y = 1.35;
    head.castShadow = true;
    g.add(head);
    addHunterRifleWorld(g);
  } else if (role === 'bear') {
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.35, 2.4), mat(0x4a3320));
    body.position.y = 0.85;
    body.castShadow = true;
    g.add(body);
  } else if (role === 'deer') {
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.75, 1.1), mat(0x8b5a3c));
    torso.position.y = 0.85;
    torso.castShadow = true;
    g.add(torso);
  } else if (role === 'monkey') {
    const fur = mat(0x5a5652);
    const face = mat(0xb5a898);
    const spine = new THREE.Group();
    spine.position.set(0, 0.1, 0);
    spine.rotation.x = -0.58;
    g.add(spine);
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.28, 4, 8), fur);
    torso.position.set(0, 0.36, 0);
    torso.castShadow = true;
    spine.add(torso);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), fur);
    head.position.set(0, 0.62, 0.25);
    head.castShadow = true;
    spine.add(head);
    const facePatch = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), face);
    facePatch.position.set(0, 0.59, 0.33);
    facePatch.scale.set(0.95, 0.8, 0.6);
    facePatch.castShadow = true;
    spine.add(facePatch);
    const shoulder = new THREE.Group();
    shoulder.position.set(-0.12, 0.47, 0.14);
    spine.add(shoulder);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.042, 0.44, 7), mat(0x3a3634));
    arm.position.set(0, -0.2, 0.02);
    arm.castShadow = true;
    shoulder.add(arm);
    g.userData.monkeyRightArmPivot = shoulder;
  }
  return g;
}
