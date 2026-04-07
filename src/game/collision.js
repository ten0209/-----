import * as THREE from 'three';

/**
 * XZ 平面上の点を円／回転矩形コリダーから押し出す
 */
export function resolveCollisionsXZ(pos, radius, colliders) {
  for (const c of colliders) {
    if (c.kind === 'box') {
      pushCircleOBB(pos, radius, c);
    } else {
      const px = pos.x;
      const pz = pos.z;
      const dx = px - c.x;
      const dz = pz - c.z;
      const minDist = radius + c.r;
      const d2 = dx * dx + dz * dz;
      if (d2 >= minDist * minDist || d2 < 1e-8) continue;
      const d = Math.sqrt(d2);
      const nx = dx / d;
      const nz = dz / d;
      const overlap = minDist - d;
      pos.x += nx * overlap;
      pos.z += nz * overlap;
    }
  }
}

/**
 * XZ 円判定 + Y 重なり（カプセル相当）で押し出す
 * @param {{x:number,z:number}} pos
 * @param {number} radius
 * @param {number} y0 カプセル下端Y
 * @param {number} y1 カプセル上端Y
 * @param {Array<any>} colliders
 */
export function resolveCollisionsCapsuleXZ(pos, radius, y0, y1, colliders) {
  const lo = Math.min(y0, y1);
  const hi = Math.max(y0, y1);
  for (const c of colliders) {
    if (!overlapsColliderY(c, lo, hi)) continue;
    if (c.kind === 'box') {
      pushCircleOBB(pos, radius, c);
    } else {
      const px = pos.x;
      const pz = pos.z;
      const dx = px - c.x;
      const dz = pz - c.z;
      const minDist = radius + c.r;
      const d2 = dx * dx + dz * dz;
      if (d2 >= minDist * minDist || d2 < 1e-8) continue;
      const d = Math.sqrt(d2);
      const nx = dx / d;
      const nz = dz / d;
      const overlap = minDist - d;
      pos.x += nx * overlap;
      pos.z += nz * overlap;
    }
  }
}

function overlapsColliderY(c, y0, y1) {
  const top = Number.isFinite(c.h) ? c.h : Infinity;
  const bottom = Number.isFinite(c.y0) ? c.y0 : 0;
  return !(y1 <= bottom || y0 >= top);
}

function pushCircleOBB(pos, pr, box) {
  const { cx, cz, halfW, halfD, rot } = box;
  const lx = pos.x - cx;
  const lz = pos.z - cz;
  const c = Math.cos(-rot);
  const s = Math.sin(-rot);
  const tx = lx * c - lz * s;
  const tz = lx * s + lz * c;

  const qx = THREE.MathUtils.clamp(tx, -halfW, halfW);
  const qz = THREE.MathUtils.clamp(tz, -halfD, halfD);
  const dx = tx - qx;
  const dz = tz - qz;
  const d2 = dx * dx + dz * dz;

  if (d2 > pr * pr) return;

  if (d2 > 1e-12) {
    const d = Math.sqrt(d2);
    const pen = pr - d;
    const plx = (dx / d) * pen;
    const plz = (dz / d) * pen;
    pos.x += plx * Math.cos(rot) - plz * Math.sin(rot);
    pos.z += plx * Math.sin(rot) + plz * Math.cos(rot);
    return;
  }

  const dLeft = tx + halfW;
  const dRight = halfW - tx;
  const dBot = tz + halfD;
  const dTop = halfD - tz;
  const m = Math.min(dLeft, dRight, dBot, dTop);
  if (m >= pr) return;

  let plx = 0;
  let plz = 0;
  if (m === dLeft) plx = -(pr - m);
  else if (m === dRight) plx = pr - m;
  else if (m === dBot) plz = -(pr - m);
  else plz = pr - m;

  pos.x += plx * Math.cos(rot) - plz * Math.sin(rot);
  pos.z += plx * Math.sin(rot) + plz * Math.cos(rot);
}
