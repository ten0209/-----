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
  const wood = fpGunWoodBasic();
  const mb = fpGunMetalBasic;

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
    gun.rotateX(-recoil * 0.52);
    gun.rotateY(recoil * 0.06);
  } else {
    gun.position
      .copy(camera.position)
      .addScaledVector(forward, 0.4)
      .addScaledVector(right, 0.72)
      .addScaledVector(up, -0.58);
    gun.rotateX(0.038 + recoil * 0.5);
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

  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.13, 0.09), wood);
  grip.position.set(-0.19, 0.98, -0.06);
  grip.rotation.x = 0.22;
  grip.castShadow = true;
  rifle.add(grip);

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

  const mag = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.14, 0.07), metal);
  mag.position.set(rx, 0.95, 0.06);
  mag.castShadow = true;
  rifle.add(mag);

  attachOutlineEdges(stock, 0xfff6f0, 40);
  attachOutlineEdges(grip, 0xeed9c8, 40);
  attachOutlineEdges(receiver, 0xfafcff, 34);
  attachOutlineEdges(barrel, 0xa8b4c8, 22);
  attachOutlineEdges(scope, 0xd8e6fc, 28);
  attachOutlineEdges(mag, 0xcfd6e4, 30);

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
  const wood = fpGunWoodBasic();
  const mb = fpGunMetalBasic;

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

  const mainTube = new THREE.Mesh(new THREE.CylinderGeometry(0.0082, 0.0082, 0.24, 16, 1, true), mb(-1));
  mainTube.rotation.x = Math.PI / 2;
  mainTube.position.set(0, 0, -0.11);
  mainTube.userData.fpHideWhenAds = true;
  scopeRig.add(mainTube);

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
*/
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
    gun.rotateX(-recoil * 0.52);
    gun.rotateY(recoil * 0.06);
  } else {
    gun.position
      .copy(camera.position)
      .addScaledVector(forward, 0.4)
      .addScaledVector(right, 0.72)
      .addScaledVector(up, -0.58);
    gun.rotateX(0.038 + recoil * 0.5);
    gun.rotateY(-0.04);
  }
}

const MONKEY_RIGHT_ARM_RAISE_RY = -0.62;
const MONKEY_RIGHT_ARM_RAISE_RX = (-120 * Math.PI) / 180;
const MONKEY_RIGHT_ARM_RAISE_RZ = 0;

export function syncMonkeyRightArmRaise(mesh, raised, dt) {
  const pivot = mesh?.userData?.monkeyRightArmPivot;
  if (!pivot) return;
  const smooth = raised ? 14 : 26;
  const k = 1 - Math.exp(-smooth * Math.min(dt, 0.05));
  const tx = raised ? MONKEY_RIGHT_ARM_RAISE_RX : 0;
  const ty = raised ? MONKEY_RIGHT_ARM_RAISE_RY : 0;
  const tz = raised ? MONKEY_RIGHT_ARM_RAISE_RZ : 0;
  pivot.rotation.x = THREE.MathUtils.lerp(pivot.rotation.x, tx, k);
  pivot.rotation.y = THREE.MathUtils.lerp(pivot.rotation.y, ty, k);
  pivot.rotation.z = THREE.MathUtils.lerp(pivot.rotation.z, tz, k);
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
    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.07, 0.1), mat(0xc49a7a));
    nose.position.set(0, 1.28, 0.19);
    nose.castShadow = true;
    g.add(nose);
    const eyeMat = mat(0x1e2430);
    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.038, 0.025), eyeMat);
    eyeL.position.set(-0.075, 1.39, 0.2);
    g.add(eyeL);
    const eyeR = eyeL.clone();
    eyeR.position.x = 0.075;
    g.add(eyeR);
    attachOutlineEdges(nose, 0xf2dcc8, 44);
    attachOutlineEdges(eyeL, 0x9aa8b8, 44);
    attachOutlineEdges(eyeR, 0x9aa8b8, 44);
    addHunterRifleWorld(g);
  } else if (role === 'bear') {
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.35, 2.4), mat(0x4a3320));
    body.position.y = 0.85;
    body.castShadow = true;
    g.add(body);
    const head = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.95, 1), mat(0x3d2818));
    head.position.set(0, 1.5, 1.15);
    head.castShadow = true;
    g.add(head);
  } else if (role === 'deer') {
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.75, 1.1), mat(0x8b5a3c));
    torso.position.y = 0.85;
    torso.castShadow = true;
    g.add(torso);
    const neck = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.45, 0.35), mat(0x8b5a3c));
    neck.position.set(0, 1.2, 0.55);
    neck.castShadow = true;
    g.add(neck);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.45), mat(0x6d4028));
    head.position.set(0, 1.35, 0.85);
    g.add(head);
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

    const addArm = (x, withPivot) => {
      const shoulder = new THREE.Group();
      shoulder.position.set(x, 0.47, 0.14);
      spine.add(shoulder);
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.042, 0.44, 7), mat(0x3a3634));
      arm.position.set(0, -0.2, 0.02);
      arm.castShadow = true;
      shoulder.add(arm);
      if (withPivot) g.userData.monkeyRightArmPivot = shoulder;
    };
    addArm(-0.12, true);
    addArm(0.12, false);
  }

  return g;
}
/*

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

  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.13, 0.09), wood);
  grip.position.set(-0.19, 0.98, -0.06);
  grip.rotation.x = 0.22;
  grip.castShadow = true;
  rifle.add(grip);

  const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.3), metal);
  receiver.position.set(rx, 1.13, 0.1);
  receiver.castShadow = true;
  rifle.add(receiver);

  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.03, 0.52, 8), metal);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(rx, 1.14, 0.52);
  barrel.castShadow = true;
  rifle.add(barrel);

  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.012, 8), metal);
  band.rotation.x = Math.PI / 2;
  band.position.set(rx, 1.14, 0.38);
  band.castShadow = true;
  rifle.add(band);

  const topRail = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.018, 0.24), metal);
  topRail.position.set(rx, 1.2, 0.08);
  topRail.castShadow = true;
  rifle.add(topRail);

  const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.022, 0.18, 8), metal);
  scope.rotation.x = Math.PI / 2;
  scope.position.set(rx, 1.21, 0.08);
  scope.castShadow = true;
  rifle.add(scope);

  const mag = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.14, 0.07), metal);
  mag.position.set(rx, 0.95, 0.06);
  mag.castShadow = true;
  rifle.add(mag);

  attachOutlineEdges(stock, 0xfff6f0, 40);
  attachOutlineEdges(grip, 0xeed9c8, 40);
  attachOutlineEdges(receiver, 0xfafcff, 34);
  attachOutlineEdges(barrel, 0xa8b4c8, 22);
  attachOutlineEdges(band, 0xcfd6e4, 30);
  attachOutlineEdges(topRail, 0xfafcff, 30);
  attachOutlineEdges(scope, 0xd8e6fc, 28);
  attachOutlineEdges(mag, 0xcfd6e4, 30);

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
  const wood = fpGunWoodBasic();
  const mb = fpGunMetalBasic;

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

  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.01, 10), mb(-0.5));
  band.rotation.x = Math.PI / 2;
  band.position.set(0, 0.012, -0.32);
  g.add(band);

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

  const mainTube = new THREE.Mesh(new THREE.CylinderGeometry(0.0082, 0.0082, 0.24, 16, 1, true), mb(-1));
  mainTube.rotation.x = Math.PI / 2;
  mainTube.position.set(0, 0, -0.11);
  mainTube.userData.fpHideWhenAds = true;
  scopeRig.add(mainTube);

  const turret = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.016, 0.036), mb(-0.95));
  turret.position.set(0, 0.015, -0.1);
  turret.userData.fpHideWhenAds = true;
  scopeRig.add(turret);

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

  const fs = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.028, 0.045), mb(-0.4));
  fs.position.set(0, -0.014, -0.38);
  g.add(fs);

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
    gun.rotateX(-recoil * 0.52);
    gun.rotateY(recoil * 0.06);
  } else {
    gun.position
      .copy(camera.position)
      .addScaledVector(forward, 0.4)
      .addScaledVector(right, 0.72)
      .addScaledVector(up, -0.58);
    gun.rotateX(0.038 + recoil * 0.5);
    gun.rotateY(-0.04);
  }
}

const MONKEY_RIGHT_ARM_RAISE_RY = -0.62;
const MONKEY_RIGHT_ARM_RAISE_RX = (-120 * Math.PI) / 180;
const MONKEY_RIGHT_ARM_RAISE_RZ = 0;
const MONKEY_ARM_RAISE_SMOOTH = 14;
const MONKEY_ARM_LOWER_SMOOTH = 26;

export function syncMonkeyRightArmRaise(mesh, raised, dt) {
  const pivot = mesh?.userData?.monkeyRightArmPivot;
  if (!pivot) return;
  const smooth = raised ? MONKEY_ARM_RAISE_SMOOTH : MONKEY_ARM_LOWER_SMOOTH;
  const k = 1 - Math.exp(-smooth * Math.min(dt, 0.05));
  const tx = raised ? MONKEY_RIGHT_ARM_RAISE_RX : 0;
  const ty = raised ? MONKEY_RIGHT_ARM_RAISE_RY : 0;
  const tz = raised ? MONKEY_RIGHT_ARM_RAISE_RZ : 0;
  pivot.rotation.x = THREE.MathUtils.lerp(pivot.rotation.x, tx, k);
  pivot.rotation.y = THREE.MathUtils.lerp(pivot.rotation.y, ty, k);
  pivot.rotation.z = THREE.MathUtils.lerp(pivot.rotation.z, tz, k);
}

export function setHunterPoopHitHighlight(mesh, active) {
  if (!mesh) return;
  mesh.traverse((o) => {
    if (!o.isLineSegments || !o.material?.isLineBasicMaterial) return;
    if (o.material.userData._poopOrigHex === undefined) {
      o.material.userData._poopOrigHex = o.material.color.getHex();
    }
    o.material.color.setHex(active ? 0xff2222 : o.material.userData._poopOrigHex);
    o.material.depthTest = !active ? true : false;
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
    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.07, 0.1), mat(0xc49a7a));
    nose.position.set(0, 1.28, 0.19);
    nose.castShadow = true;
    g.add(nose);
    const eyeMat = mat(0x1e2430);
    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.038, 0.025), eyeMat);
    eyeL.position.set(-0.075, 1.39, 0.2);
    g.add(eyeL);
    const eyeR = eyeL.clone();
    eyeR.position.x = 0.075;
    g.add(eyeR);
    attachOutlineEdges(nose, 0xf2dcc8, 44);
    attachOutlineEdges(eyeL, 0x9aa8b8, 44);
    attachOutlineEdges(eyeR, 0x9aa8b8, 44);
    addHunterRifleWorld(g);
  } else if (role === 'bear') {
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.35, 2.4), mat(0x4a3320));
    body.position.y = 0.85;
    body.castShadow = true;
    g.add(body);
    const head = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.95, 1), mat(0x3d2818));
    head.position.set(0, 1.5, 1.15);
    head.castShadow = true;
    g.add(head);
    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.35, 0.4), mat(0x2a1810));
    snout.position.set(0, 1.35, 1.85);
    snout.castShadow = true;
    g.add(snout);
  } else if (role === 'deer') {
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.75, 1.1), mat(0x8b5a3c));
    torso.position.y = 0.85;
    torso.castShadow = true;
    g.add(torso);
    const neck = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.45, 0.35), mat(0x8b5a3c));
    neck.position.set(0, 1.2, 0.55);
    neck.castShadow = true;
    g.add(neck);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.45), mat(0x6d4028));
    head.position.set(0, 1.35, 0.85);
    g.add(head);
    for (const [sx, sz] of [
      [-0.2, 0.45],
      [0.2, 0.45],
      [-0.2, -0.45],
      [0.2, -0.45],
    ]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.55, 6), mat(0x5c3d28));
      leg.position.set(sx, 0.28, sz);
      leg.castShadow = true;
      g.add(leg);
    }
  } else if (role === 'monkey') {
    const fur = mat(0x5a5652);
    const furDark = mat(0x3a3634);
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

    const eyeMat = mat(0x141210);
    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.018, 0.016), eyeMat);
    eyeL.position.set(-0.04, 0.63, 0.38);
    spine.add(eyeL);
    const eyeR = eyeL.clone();
    eyeR.position.x = 0.04;
    spine.add(eyeR);

    const addArm = (x, withPivot) => {
      const shoulder = new THREE.Group();
      shoulder.position.set(x, 0.47, 0.14);
      spine.add(shoulder);
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.042, 0.44, 7), furDark);
      arm.position.set(0, -0.2, 0.02);
      arm.rotation.z = x > 0 ? -0.16 : 0.16;
      arm.castShadow = true;
      shoulder.add(arm);
      if (withPivot) g.userData.monkeyRightArmPivot = shoulder;
    };
    addArm(-0.12, true);
    addArm(0.12, false);

    const addLeg = (x) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.26, 7), furDark);
      leg.position.set(x, 0.14, -0.02);
      leg.castShadow = true;
      g.add(leg);
    };
    addLeg(-0.11);
    addLeg(0.11);
  }

  return g;
}
import * as THREE from 'three';

const mat = (color, rough = 0.85) =>
  new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0.05, flatShading: true });

const gunMetal = () =>
  new THREE.MeshStandardMaterial({ color: 0x35363d, roughness: 0.38, metalness: 0.62, flatShading: true });
const gunWood = () =>
  new THREE.MeshStandardMaterial({ color: 0x4a3324, roughness: 0.88, metalness: 0.02, flatShading: true });

/** 他キャラから見えるハンターのライフル（キャラの子） */
function addHunterRifleWorld(parent) {
  const rifle = new THREE.Group();
  const metal = gunMetal();
  const wood = gunWood();

  const stock = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.1, 0.36), wood);
  stock.position.set(0.2, 1.1, -0.22);
  stock.castShadow = true;
  rifle.add(stock);

  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.13, 0.09), wood);
  grip.position.set(0.19, 0.98, -0.06);
  grip.rotation.x = 0.22;
  grip.castShadow = true;
  rifle.add(grip);

  const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.3), metal);
  receiver.position.set(0.22, 1.13, 0.1);
  receiver.castShadow = true;
  rifle.add(receiver);

  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.03, 0.52, 8), metal);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0.22, 1.14, 0.52);
  barrel.castShadow = true;
  rifle.add(barrel);

  const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.024, 0.16, 8), metal);
  scope.rotation.z = Math.PI / 2;
  scope.position.set(0.16, 1.2, 0.06);
  scope.castShadow = true;
  rifle.add(scope);

  const mag = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.14, 0.07), metal);
  mag.position.set(0.22, 0.95, 0.06);
  mag.castShadow = true;
  rifle.add(mag);

  parent.add(rifle);
}

/** ライトに依存しない。フォグで消えないよう fog オフ。パーツ重なりの Z ファイトを軽減 */
function fpGunMetalBasic(depthOffset = 0) {
  return new THREE.MeshBasicMaterial({
    color: 0x8a8d98,
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
    color: 0x2a2c32,
    fog: false,
    toneMapped: false,
    depthWrite: true,
    depthTest: true,
    side: THREE.DoubleSide,
  });
}

/**
 * 一人称用ライフル（シーン直下に置き、毎フレームカメラから追従させる）
 * モデルはローカル -Z が銃口方向（カメラ視線と揃える）
 */
export function createHunterFirstPersonGun() {
  const g = new THREE.Group();
  const wood = fpGunWoodBasic();

  const stock = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.14, 0.32), wood);
  stock.position.set(0, -0.03, 0.08);
  g.add(stock);

  const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.14, 0.32), fpGunMetalBasic(0));
  receiver.position.set(0, 0, -0.12);
  g.add(receiver);

  // バレルを一本化して継ぎ目を減らす（先端まで連続した筒に見せる）
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.028, 0.78, 12), fpGunMetalBasic(-0.5));
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 0.02, -0.62);
  g.add(barrel);

  const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.03, 0.2, 8), fpGunMetalBasic(-1));
  scope.rotation.z = Math.PI / 2;
  scope.position.set(-0.05, 0.07, -0.14);
  scope.userData.fpHideWhenAds = true;
  g.add(scope);

  // ADS用の基準点（コントローラ側のビネット投影に使用）
  const scopeRig = new THREE.Object3D();
  scopeRig.position.set(0, 0.07, -0.14);
  g.add(scopeRig);
  g.userData.fpScopeLocal = scopeRig.position.clone();
  g.userData.fpScopeAimLocal = scopeRig.position.clone().add(new THREE.Vector3(0, 0, 0.015));

  const eyeGlass = new THREE.Mesh(
    new THREE.CircleGeometry(0.013, 20),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      fog: false,
      toneMapped: false,
      depthWrite: false,
      transparent: true,
      opacity: 0,
    })
  );
  eyeGlass.position.set(0, 0, 0.015);
  eyeGlass.visible = false;
  scopeRig.add(eyeGlass);
  g.userData.fpScopeEyeGlassMesh = eyeGlass;

  const fore = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.24), fpGunMetalBasic(-0.3));
  fore.position.set(0, -0.04, -0.38);
  g.add(fore);

  // 銃口の先端（リング＋奥の円盤）で「抜け感」をなくす
  const muzzleRing = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.026, 0.04, 12), fpGunMetalBasic(-1.5));
  muzzleRing.rotation.x = Math.PI / 2;
  muzzleRing.position.set(0, 0.02, -1.03);
  g.add(muzzleRing);

  const muzzleCap = new THREE.Mesh(new THREE.CircleGeometry(0.024, 12), fpGunMuzzleDark());
  muzzleCap.position.set(0, 0.02, -1.018);
  g.add(muzzleCap);

  g.scale.setScalar(1.2);
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

/**
 * カメラの右下前方にライフルをワールド座標で固定（親はシーン）
 */
export function syncFirstPersonGunToCamera(camera, gun, opts = {}) {
  const aiming = !!opts.aiming;
  const recoil = Math.max(0, Math.min(1, opts.recoil ?? 0));
  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);

  const upWorld = new THREE.Vector3(0, 1, 0);
  let right = new THREE.Vector3().crossVectors(forward, upWorld);
  if (right.lengthSq() < 1e-8) {
    right.set(1, 0, 0);
  } else {
    right.normalize();
  }
  const up = new THREE.Vector3().crossVectors(right, forward).normalize();

  if (aiming) {
    // ADS時はスコープ中心をカメラ中心に寄せる
    const eyeDist = 0.14;
    const aimLocal = gun.userData.fpScopeAimLocal ?? new THREE.Vector3(0, 0.07, -0.125);
    const aimWorldOffset = aimLocal.clone().applyQuaternion(camera.quaternion);
    gun.position.copy(camera.position).addScaledVector(forward, eyeDist).sub(aimWorldOffset);
  } else {
    gun.position
      .copy(camera.position)
      .addScaledVector(forward, 0.38)
      .addScaledVector(right, 0.4)
      .addScaledVector(up, -0.24);
  }

  gun.quaternion.copy(camera.quaternion);
  gun.rotateX((aiming ? 0.01 : 0.045) - recoil * 0.04);
  gun.rotateY((aiming ? -0.005 : -0.045) + recoil * 0.01);
}

/**
 * ADS時に一人称銃の一部を隠すフック（現行モデルは隠す部位なし）
 * @param {THREE.Object3D} gun
 * @param {boolean} aiming
 */
export function setFpGunBodyHiddenForAiming(gun, aiming) {
  gun.traverse((o) => {
    if (!o.isMesh) return;
    if (o.userData?.fpHideWhenAds) {
      o.visible = !aiming;
    }
  });
}

/**
 * うんち命中時のハンター強調（簡易版）
 * @param {THREE.Object3D} mesh
 * @param {boolean} active
 */
export function setHunterPoopHitHighlight(mesh, active) {
  if (!mesh) return;
  mesh.traverse((o) => {
    if (!o.isMesh || !o.material?.color) return;
    if (o.userData._poopOrigHex === undefined) {
      o.userData._poopOrigHex = o.material.color.getHex();
    }
    o.material.color.setHex(active ? 0xff3b30 : o.userData._poopOrigHex);
  });
}

/**
 * サル右腕の構え同期（現行簡易モデルは全体の腕アニメ未実装）
 * @param {THREE.Object3D} mesh
 * @param {boolean} raised
 * @param {number} dt
 */
export function syncMonkeyRightArmRaise(mesh, raised, dt) {
  const pivot = mesh?.userData?.monkeyRightArmPivot;
  if (!pivot) return;
  const tx = raised ? (-110 * Math.PI) / 180 : 0;
  const ty = raised ? -0.58 : 0;
  const tz = 0;
  const smooth = raised ? 14 : 24;
  const k = 1 - Math.exp(-smooth * Math.min(dt, 0.05));
  pivot.rotation.x = THREE.MathUtils.lerp(pivot.rotation.x, tx, k);
  pivot.rotation.y = THREE.MathUtils.lerp(pivot.rotation.y, ty, k);
  pivot.rotation.z = THREE.MathUtils.lerp(pivot.rotation.z, tz, k);
}

/**
 * 各ロールの簡易メッシュ（原点＝足元、Y+が上）
 */
export function createCharacterMesh(role) {
  const g = new THREE.Group();

  if (role === 'hunter') {
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.85, 4, 8), mat(0x4a6e8a));
    body.position.y = 0.55 + 0.425;
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
    const head = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.95, 1), mat(0x3d2818));
    head.position.set(0, 1.5, 1.15);
    head.castShadow = true;
    g.add(head);
    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.35, 0.4), mat(0x2a1810));
    snout.position.set(0, 1.35, 1.85);
    snout.castShadow = true;
    g.add(snout);
  } else if (role === 'deer') {
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.75, 1.1), mat(0x8b5a3c));
    torso.position.y = 0.85;
    torso.castShadow = true;
    g.add(torso);
    const neck = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.45, 0.35), mat(0x8b5a3c));
    neck.position.set(0, 1.2, 0.55);
    neck.castShadow = true;
    g.add(neck);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.45), mat(0x6d4028));
    head.position.set(0, 1.35, 0.85);
    g.add(head);
    for (const [sx, sz] of [
      [-0.2, 0.45],
      [0.2, 0.45],
      [-0.2, -0.45],
      [0.2, -0.45],
    ]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.55, 6), mat(0x5c3d28));
      leg.position.set(sx, 0.28, sz);
      leg.castShadow = true;
      g.add(leg);
    }
  } else if (role === 'monkey') {
    const fur = mat(0x5a5652);
    const furDark = mat(0x3a3634);
    const face = mat(0xb5a898);

    const spine = new THREE.Group();
    spine.position.set(0, 0.1, 0);
    spine.rotation.x = -0.58;
    g.add(spine);

    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.28, 4, 8), fur);
    torso.position.set(0, 0.36, 0);
    torso.castShadow = true;
    spine.add(torso);

    const chest = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), furDark);
    chest.position.set(0, 0.42, 0.12);
    chest.castShadow = true;
    spine.add(chest);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), fur);
    head.position.set(0, 0.62, 0.25);
    head.castShadow = true;
    spine.add(head);

    const facePatch = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), face);
    facePatch.position.set(0, 0.59, 0.33);
    facePatch.scale.set(0.95, 0.8, 0.6);
    facePatch.castShadow = true;
    spine.add(facePatch);

    const eyeMat = mat(0x141210);
    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.018, 0.016), eyeMat);
    eyeL.position.set(-0.04, 0.63, 0.38);
    spine.add(eyeL);
    const eyeR = eyeL.clone();
    eyeR.position.x = 0.04;
    spine.add(eyeR);

    const addArm = (x, withPivot) => {
      const shoulder = new THREE.Group();
      shoulder.position.set(x, 0.47, 0.14);
      spine.add(shoulder);
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.042, 0.44, 7), furDark);
      arm.position.set(0, -0.2, 0.02);
      arm.rotation.z = x > 0 ? -0.16 : 0.16;
      arm.castShadow = true;
      shoulder.add(arm);
      if (withPivot) g.userData.monkeyRightArmPivot = shoulder;
    };
    addArm(-0.12, true);
    addArm(0.12, false);

    const addLeg = (x) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.26, 7), furDark);
      leg.position.set(x, 0.14, -0.02);
      leg.castShadow = true;
      g.add(leg);
    };
    addLeg(-0.11);
    addLeg(0.11);
  }

  return g;
}
