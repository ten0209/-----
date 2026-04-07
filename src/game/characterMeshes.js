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

  const stockOutline = attachOutlineEdges(stock, 0xfff6f0, 40);
  const receiverOutline = attachOutlineEdges(receiver, 0xfafcff, 34);
  const barrelOutline = attachOutlineEdges(barrel, 0xa8b4c8, 22);
  const scopeOutline = attachOutlineEdges(scope, 0xd8e6fc, 28);
  stockOutline.userData.poopHighlightExclude = true;
  receiverOutline.userData.poopHighlightExclude = true;
  barrelOutline.userData.poopHighlightExclude = true;
  scopeOutline.userData.poopHighlightExclude = true;
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
const BEAR_LEG_SWING_MAX = 0.42;
const BEAR_LEG_SWING_SPEED = 11.5;
const DEER_LEG_SWING_MAX = 0.5;
const DEER_LEG_SWING_SPEED = 12.5;
const MONKEY_LEG_SWING_MAX = 0.48;
const MONKEY_LEG_SWING_SPEED = 13.2;

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

export function syncBearLegSwing(mesh, moving, dt) {
  const pivots = mesh?.userData?.bearLegPivots;
  if (!pivots || pivots.length === 0) return;
  const state = mesh.userData;
  state.bearLegWalkPhase = (state.bearLegWalkPhase ?? 0) + dt * BEAR_LEG_SWING_SPEED;
  const phase = state.bearLegWalkPhase;
  const amp = moving ? BEAR_LEG_SWING_MAX : 0;
  const targetA = Math.sin(phase) * amp;
  const targetB = Math.sin(phase + Math.PI) * amp;
  const smooth = moving ? 18 : 22;
  const k = 1 - Math.exp(-smooth * Math.min(dt, 0.05));
  /* [frontL, frontR, rearL, rearR] */
  pivots[0].rotation.x = THREE.MathUtils.lerp(pivots[0].rotation.x, targetA, k);
  pivots[1].rotation.x = THREE.MathUtils.lerp(pivots[1].rotation.x, targetB, k);
  pivots[2].rotation.x = THREE.MathUtils.lerp(pivots[2].rotation.x, targetB, k);
  pivots[3].rotation.x = THREE.MathUtils.lerp(pivots[3].rotation.x, targetA, k);
}

export function syncDeerLegSwing(mesh, moving, dt) {
  const pivots = mesh?.userData?.deerLegPivots;
  if (!pivots || pivots.length === 0) return;
  const state = mesh.userData;
  state.deerLegWalkPhase = (state.deerLegWalkPhase ?? 0) + dt * DEER_LEG_SWING_SPEED;
  const phase = state.deerLegWalkPhase;
  const amp = moving ? DEER_LEG_SWING_MAX : 0;
  const targetA = Math.sin(phase) * amp;
  const targetB = Math.sin(phase + Math.PI) * amp;
  const smooth = moving ? 20 : 24;
  const k = 1 - Math.exp(-smooth * Math.min(dt, 0.05));
  /* [frontL, frontR, rearL, rearR] */
  pivots[0].rotation.x = THREE.MathUtils.lerp(pivots[0].rotation.x, targetA, k);
  pivots[1].rotation.x = THREE.MathUtils.lerp(pivots[1].rotation.x, targetB, k);
  pivots[2].rotation.x = THREE.MathUtils.lerp(pivots[2].rotation.x, targetB, k);
  pivots[3].rotation.x = THREE.MathUtils.lerp(pivots[3].rotation.x, targetA, k);
}

export function syncMonkeyLegSwing(mesh, moving, dt) {
  const pivots = mesh?.userData?.monkeyLegPivots;
  if (!pivots || pivots.length === 0) return;
  const state = mesh.userData;
  state.monkeyLegWalkPhase = (state.monkeyLegWalkPhase ?? 0) + dt * MONKEY_LEG_SWING_SPEED;
  const phase = state.monkeyLegWalkPhase;
  const amp = moving ? MONKEY_LEG_SWING_MAX : 0;
  const targetA = Math.sin(phase) * amp;
  const targetB = Math.sin(phase + Math.PI) * amp;
  const smooth = moving ? 20 : 24;
  const k = 1 - Math.exp(-smooth * Math.min(dt, 0.05));
  /* [left, right] */
  pivots[0].rotation.x = THREE.MathUtils.lerp(pivots[0].rotation.x, targetA, k);
  pivots[1].rotation.x = THREE.MathUtils.lerp(pivots[1].rotation.x, targetB, k);
}

export function setHunterPoopHitHighlight(mesh, active) {
  if (!mesh) return;
  mesh.traverse((o) => {
    if (!o.isLineSegments || !o.material?.isLineBasicMaterial) return;
    if (o.userData?.poopHighlightExclude) return;
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
    attachOutlineEdges(body, 0xdef1ff, 30);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), mat(0xd4a574));
    head.position.y = 1.35;
    head.castShadow = true;
    g.add(head);
    attachOutlineEdges(head, 0xffefe0, 30);
    addHunterRifleWorld(g);
  } else if (role === 'bear') {
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.35, 2.4), mat(0x614127));
    body.position.y = 0.85;
    body.castShadow = true;
    g.add(body);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.64, 0.62), mat(0x6a482b));
    head.position.set(0, 1.4, 1.52);
    head.castShadow = true;
    g.add(head);
    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.32, 0.1), mat(0x9a7652));
    nose.position.set(0, 1.3, 1.85);
    nose.castShadow = true;
    g.add(nose);
    const eyeMat = mat(0x161616, 0.55);
    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.07, 0.05), eyeMat);
    eyeL.position.set(-0.2, 1.5, 1.91);
    eyeL.castShadow = true;
    g.add(eyeL);
    const eyeR = eyeL.clone();
    eyeR.position.x = 0.2;
    g.add(eyeR);
    const earMat = mat(0x6a482b);
    const earL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.12), earMat);
    earL.position.set(-0.24, 1.72, 1.72);
    earL.castShadow = true;
    g.add(earL);
    const earR = earL.clone();
    earR.position.x = 0.24;
    g.add(earR);
    const legMat = mat(0x5b3f29);
    const legYs = 0.55;
    const makeLeg = (x, z) => {
      const pivot = new THREE.Group();
      pivot.position.set(x, legYs, z);
      g.add(pivot);
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.52, 0.22), legMat);
      leg.position.y = -0.26;
      leg.castShadow = true;
      pivot.add(leg);
      return pivot;
    };
    const frontL = makeLeg(-0.5, 0.85);
    const frontR = makeLeg(0.5, 0.85);
    const rearL = makeLeg(-0.5, -0.85);
    const rearR = makeLeg(0.5, -0.85);
    g.userData.bearLegPivots = [frontL, frontR, rearL, rearR];
    g.userData.bearLegWalkPhase = 0;
  } else if (role === 'deer') {
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.75, 1.1), mat(0x8b5a3c));
    torso.position.y = 0.85;
    torso.castShadow = true;
    g.add(torso);
    const neck = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.78, 0.22), mat(0x8b5a3c));
    neck.position.set(0, 1.26, 0.46);
    neck.castShadow = true;
    g.add(neck);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.24, 0.38), mat(0x946344));
    head.position.set(0, 1.58, 0.72);
    head.castShadow = true;
    g.add(head);
    const legMat = mat(0x7a5035);
    const makeLeg = (x, z) => {
      const pivot = new THREE.Group();
      pivot.position.set(x, 0.62, z);
      g.add(pivot);
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.62, 0.13), legMat);
      leg.position.y = -0.31;
      leg.castShadow = true;
      pivot.add(leg);
      return pivot;
    };
    const frontL = makeLeg(-0.2, 0.34);
    const frontR = makeLeg(0.2, 0.34);
    const rearL = makeLeg(-0.2, -0.34);
    const rearR = makeLeg(0.2, -0.34);
    g.userData.deerLegPivots = [frontL, frontR, rearL, rearR];
    g.userData.deerLegWalkPhase = 0;
  } else if (role === 'monkey') {
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.75, 0.38), mat(0x5a5652));
    body.position.y = 0.72;
    body.castShadow = true;
    g.add(body);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.28, 0.3), mat(0x6a625a));
    head.position.y = 1.2;
    head.castShadow = true;
    g.add(head);
    const shoulder = new THREE.Group();
    shoulder.position.set(-0.2, 0.94, 0.02);
    g.add(shoulder);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.44, 0.14), mat(0x47413d));
    arm.position.set(0, -0.22, 0);
    arm.castShadow = true;
    shoulder.add(arm);
    const otherArm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.44, 0.14), mat(0x47413d));
    otherArm.position.set(0.2, 0.72, 0.02);
    otherArm.castShadow = true;
    g.add(otherArm);
    const legMat = mat(0x47413d);
    const makeLeg = (x) => {
      const pivot = new THREE.Group();
      pivot.position.set(x, 0.46, 0.02);
      g.add(pivot);
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.34, 0.12), legMat);
      leg.position.y = -0.17;
      leg.castShadow = true;
      pivot.add(leg);
      return pivot;
    };
    const legL = makeLeg(-0.12);
    const legR = makeLeg(0.12);
    g.userData.monkeyLegPivots = [legL, legR];
    g.userData.monkeyLegWalkPhase = 0;
    g.userData.monkeyRightArmPivot = shoulder;
  }
  return g;
}
