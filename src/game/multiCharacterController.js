import * as THREE from 'three';
import { resolveCollisionsCapsuleXZ, resolveCollisionsXZ } from './collision.js';
import {
  createCharacterMesh,
  createHunterFirstPersonGun,
  setFpGunBodyHiddenForAiming,
  setHunterPoopHitHighlight,
  syncFirstPersonGunToCamera,
  syncMonkeyRightArmRaise,
} from './characterMeshes.js';
import { playGunshot } from './gunSfx.js';

const GRAVITY = 34;
/** 一人称・通常（scene.js の PerspectiveCamera fov と揃える） */
const FP_FOV_DEFAULT = 72;
/**
 * 構え時 FOV。極端に狭いと世界全体が望遠に見えるので、中程度に抑える。
 * スコープの画面占有率は fpGun のスケールで足す。
 */
const FP_FOV_ADS = 50;
/** createHunterFirstPersonGun の g.scale と同じ基準 */
const FP_GUN_SCALE_BASE = 0.92;
/** 構え時だけ銃メッシュを拡大（画面に対するスコープの占有率は主にここで調整） */
const FP_GUN_ADS_SCALE_MUL = 3.3;
/** 構え（ADS）時のマウス感度（腰だしに対する倍率） */
const FP_LOOK_SENS_ADS_MUL = 0.42;
/** うんち命中デバフ中の追加感度倍率（小さいほど極端に遅い） */
const HUNTER_POOP_DEBUFF_SENS_MUL = 0.12;
/** 構え中の移動速度（通常に対する倍率） */
const FP_ADS_MOVE_MUL = 0.32;
/**
 * ワールド用ライフルはローカル +Z に銃身がある。カメラ視線は -Z 基準なので、
 * メッシュ yaw を euler.y + この値にして他キャラ視点と FP の向きを一致させる。
 */
const HUNTER_MESH_YAW_OFFSET = Math.PI;
/** 射撃時のカメラ反動（ラジアン）：上向き。毎フレーム exp 減衰でゆっくり戻る */
const RECOIL_PITCH_MAX = 0.042;
/** 反動の減衰（大きいほど早く戻る） */
const RECOIL_DECAY = 6.2;
/** これ未満なら反動終了（視点・次射撃可）。尾が長いと「止まってるのに動けない」のでやや大きめ */
const RECOIL_DONE_EPS = 0.0022;
const PITCH_LIMIT = Math.PI / 2 - 0.08;
const TP_PITCH_MIN = 0.12;
const TP_PITCH_MAX = 1.05;
const MONKEY_THROW_PITCH_MIN = -0.58;
const MONKEY_THROW_PITCH_MAX = 1.46;
/** クマ：Space ダッシュの水平速度 */
const BEAR_DASH_SPEED = 12;
/** 燃料の最大値（秒）。この長さだけ連続ダッシュ可能 */
const BEAR_DASH_MAX_DURATION = 3;
/** これ未満ならダッシュ終了扱い（燃料切れ） */
const BEAR_DASH_MIN_FUEL = 0.02;
/** 満タン判定（浮動小数誤差）。これ未満ならダッシュ開始不可 */
const BEAR_DASH_FULL_EPS = 0.015;
/** 非ダッシュ時の燃料回復（1秒あたり）。空→満タンに約 5.5 秒 */
const BEAR_DASH_REGEN_PER_SEC = 3 / 5.5;
/** サル：Space 長押しでジャンプゲージが溜まる速度（1.0 で満タン） */
const MONKEY_JUMP_CHARGE_PER_SEC = 0.88;
/** これ未満なら離してもジャンプしない */
const MONKEY_JUMP_MIN_CHARGE = 0.05;
/** チャージ最小時の上向き初速 */
const MONKEY_JUMP_MIN_VEL = 4;
/** チャージ満タン時の上向き初速 */
const MONKEY_JUMP_MAX_VEL = 19;
/** チャージに比例する前方向ブースト初速（XZ、チャージ 0〜1） */
const MONKEY_JUMP_FORWARD_MIN = 5.5;
const MONKEY_JUMP_FORWARD_MAX = 21;
/** 空中で前ブーストが減る速さ（小さいほど長く推進が続く） */
const MONKEY_JUMP_AIR_DRAG = 1.35;
/** 木からジャンプで離脱した直後、その木へ空中スナップ登木しない時間（ms） */
const MONKEY_TREE_SNAP_COOLDOWN_MS = 1800;
/**
 * サル投擲構え：体の真後ろに近い位置（m、ターゲット＝aim 点から -forward）
 * 小さいほど「背中越し」に近い
 */
const MONKEY_THROW_BEHIND_DIST = 0.52;
/** 体の右方向ベクトルに対する横移動（m）。負の値でカメラが体の左に寄り、画面では体が左側に映る */
const MONKEY_THROW_RIGHT_SHIFT = 0.65;
/** 構え時カメラの高さ上乗せ（m） */
const MONKEY_THROW_Y_BOOST = 0.26;
/** 視線を進行方向へ寄せる（m、ブレンドに比例） */
const MONKEY_THROW_LOOK_AHEAD = 1.45;
const MONKEY_THROW_CAM_BLEND_SMOOTH = 9;
/** 構え中の移動速度（通常に対する倍率） */
const MONKEY_THROW_MOVE_MUL = 1 / 3;
/** サル：構え中に左クリックで投げるうんちの初速（m/s）。やや遅めで見やすく */
const MONKEY_ROCK_SPEED = 30;
/**
 * うんち投射にかける重力の倍率（1 未満で滞空が伸び、初速を抑えても飛距離を確保）
 */
const MONKEY_ROCK_GRAVITY_MUL = 0.05;
/** 見た目の基準半径 0.11m の 1.2 倍 */
const MONKEY_ROCK_RADIUS = 0.11 * 1.2;
/** 投擲後、再び投げられるまでの待ち時間（ms） */
const MONKEY_ROCK_THROW_COOLDOWN_MS = 3000;
const MONKEY_ROCK_MAX = 36;
/** うんちがハンターに当たったときの稜線ハイライト時間（ms） */
const HUNTER_POOP_HIT_HIGHLIGHT_MS = 3000;
/** サルの実移動当たり判定（見た目優先でかなり小さく固定） */
const MONKEY_COLLISION_RADIUS_FIXED = 0.1;
/** サルの下半身カプセル（feet 基準） */
const MONKEY_COLLIDER_BOTTOM_OFFSET = 0.02;
const MONKEY_COLLIDER_TOP_OFFSET = 0.42;

const DEFS = {
  hunter: {
    fp: true,
    speed: 7,
    radius: 0.35,
    eyeHeight: 1.65,
    jumpForce: 7.5,
    camDist: 0,
    camHeight: 0,
    aimHeight: 1.65,
    meshYOffset: -0.27,
    label: 'ハンター',
  },
  bear: {
    fp: false,
    speed: 4.2,
    radius: 1.05,
    eyeHeight: 0,
    jumpForce: 4.2,
    camDist: 7.8,
    camHeight: 3.1,
    aimHeight: 1.35,
    meshYOffset: -0.175,
    label: 'クマ',
  },
  deer: {
    fp: false,
    speed: 12,
    radius: 0.38,
    eyeHeight: 0,
    jumpForce: 14,
    camDist: 5.9,
    camHeight: 2.35,
    aimHeight: 1.05,
    meshYOffset: -0.475,
    label: 'シカ',
  },
  monkey: {
    fp: false,
    speed: 9.2,
    radius: 0.14,
    eyeHeight: 0,
    jumpForce: 8,
    camDist: 3.9,
    camHeight: 1.55,
    aimHeight: 0.52,
    climbSpeed: 7.4,
    meshYOffset: -0.345,
    label: 'サル',
  },
};

function fullscreenHudLine() {
  const on = !!(document.fullscreenElement || document.webkitFullscreenElement);
  return on ? 'F：フルスクリーン（ウィンドウに戻す）' : 'F：フルスクリーン（全画面表示）';
}

const ROLES = ['hunter', 'bear', 'deer', 'monkey'];
const SPAWNS = {
  hunter: new THREE.Vector3(0, 0, 0),
  bear: new THREE.Vector3(-9, 0, 5),
  deer: new THREE.Vector3(9, 0, 5),
  monkey: new THREE.Vector3(0, 0, 11),
};

export class MultiCharacterGame {
  /**
   * @param {THREE.Scene} scene
   * @param {THREE.PerspectiveCamera} camera
   * @param {HTMLCanvasElement} canvas
   * @param {{ colliders: unknown[], halfBounds: number, treeTrunks: { x: number, z: number, r: number, topY: number }[] }} ctx
   */
  constructor(scene, camera, canvas, ctx) {
    this.scene = scene;
    this.camera = camera;
    this.canvas = canvas;
    this.colliders = ctx.colliders;
    this.halfBounds = ctx.halfBounds;
    this.treeTrunks = ctx.treeTrunks ?? [];

    this.keys = new Set();
    this._edge = new Set();
    this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
    this.tpYaw = 0;
    this.tpPitch = 0.42;
    this.lookSensitivity = 0.002;

    this.activeIndex = 0;
    this.chars = ROLES.map((role) => this._makeCharacter(role));

    this.spotLight = new THREE.SpotLight(0xfff4e0, 4.2, 52, Math.PI / 5.5, 0.42, 1.2);
    this.spotLight.castShadow = true;
    this.spotLight.shadow.mapSize.set(1024, 1024);
    this.spotLight.shadow.bias = -0.0001;
    this.spotTarget = new THREE.Object3D();
    this.camera.add(this.spotLight);
    this.spotLight.position.set(0.12, -0.08, 0.15);
    this.camera.add(this.spotTarget);
    this.spotTarget.position.set(0, 0, -14);
    this.spotLight.target = this.spotTarget;

    this.fpGun = createHunterFirstPersonGun();
    this.fpGun.visible = false;
    this.scene.add(this.fpGun);

    this.hunterGlow = new THREE.PointLight(0xffe8cc, 0.55, 9, 1.8);
    this.scene.add(this.hunterGlow);

    const h = this.chars[0];
    this.camera.position.set(h.feet.x, h.feet.y + DEFS.hunter.eyeHeight, h.feet.z);
    this.euler.y = 0;
    this.camera.quaternion.setFromEuler(this.euler);
    h.mesh.rotation.y = this.euler.y + HUNTER_MESH_YAW_OFFSET;

    this._boundKeyDown = (e) => {
      this.keys.add(e.code);
      if (!e.repeat) this._edge.add(e.code);
      if (!e.repeat && e.code === 'KeyE') {
        const ch = this.chars[this.activeIndex];
        if (
          ch.def.fp &&
          ch.role === 'hunter' &&
          this._aiming &&
          document.pointerLockElement === this.canvas
        ) {
          this._tryShoot();
        }
      }
    };
    this._boundKeyUp = (e) => this.keys.delete(e.code);
    this._boundMouseMove = this._onMouseMove.bind(this);
    this._raycaster = new THREE.Raycaster();
    this._raycaster.far = 140;
    this._aiming = false;
    /** 射撃反動のピッチ上乗せ（ラジアン）。0 で視点＝euler のみ */
    this._recoilPitch = 0;
    this._boundPointerDown = this._onPointerDown.bind(this);
    this._boundPointerUp = this._onPointerUp.bind(this);
    /** ポインタロック中は右ボタンが canvas に届かないことがあるため window キャプチャで拾う */
    this._boundWindowRightDown = this._onWindowRightButtonDown.bind(this);
    this._shootInputDedupe = 0;
    this._boundWindowShootInput = this._onWindowShootInput.bind(this);

    this._scopeVignetteEl = document.getElementById('scope-vignette');
    this._crosshairEl = document.getElementById('crosshair');
    this._hitFeedbackEl = document.getElementById('hit-feedback');
    this._vigWorldC = new THREE.Vector3();
    this._vigWorldR = new THREE.Vector3();
    this._vigNdc = new THREE.Vector3();
    this._eulerForCamera = new THREE.Euler(0, 0, 0, 'YXZ');
    this._bearDashGaugeEl = document.getElementById('bear-dash-gauge');
    this._bearDashGaugeFillEl = this._bearDashGaugeEl?.querySelector('.bear-dash-gauge__fill');
    this._monkeyJumpGaugeEl = document.getElementById('monkey-jump-gauge');
    this._monkeyJumpGaugeFillEl = this._monkeyJumpGaugeEl?.querySelector('.monkey-jump-gauge__fill');
    /** 直前フレームで Space が押されていたか（離した瞬間検出用） */
    this._prevSpaceHeld = false;
    /** キャンバス左クリック 1 回分（登木開始用、update で消費） */
    this._climbClickPending = false;
    /** サル投擲構え時のカメラ 0〜1 */
    this._monkeyThrowCamBlend = 0;
    this._vThrowCamSide = new THREE.Vector3();
    this._vThrowForward = new THREE.Vector3();
    this._vThrowNormalPos = new THREE.Vector3();
    this._vThrowBehindPos = new THREE.Vector3();
    this._vThrowLookAt = new THREE.Vector3();
    /** 構え時の視線3次元（ピッチ保持）。XZ だけの forward と別 */
    this._vThrowViewFull = new THREE.Vector3();
    /** 構え中の左クリックで投擲（update 末尾で処理） */
    this._monkeyRockThrowPending = false;
    /** 初回投擲をブロックしないため、未投擲は -Infinity */
    this._lastMonkeyRockSpawn = -Infinity;
    /** @type {{ mesh: THREE.Mesh, vel: THREE.Vector3 }[]} */
    this._monkeyRocks = [];
    /** 木以外の射線遮蔽物メッシュ（ハンター射撃用） */
    this._bulletBlockerMeshes = [];
    this._hunterHitBox = new THREE.Box3();
    this._poopHitSphere = new THREE.Sphere();
    /** うんち命中ハイライト終了時刻（performance.now）。0 ＝非表示 */
    this._hunterPoopHighlightUntil = 0;
    /** ハイライトON/OFFを変化時だけ反映して負荷を抑える */
    this._hunterPoopHighlightActive = false;
    this._scopeVignetteLastBg = '';
    this._collectBulletBlockerMeshes();
  }

  _hasAncestorWithUserDataFlag(obj, flagName) {
    let o = obj;
    while (o) {
      if (o.userData?.[flagName]) return true;
      o = o.parent;
    }
    return false;
  }

  _isDescendantOf(obj, root) {
    let o = obj;
    while (o) {
      if (o === root) return true;
      o = o.parent;
    }
    return false;
  }

  _collectBulletBlockerMeshes() {
    const blockers = [];
    this.scene.traverse((o) => {
      if (!o.isMesh) return;
      if (this._hasAncestorWithUserDataFlag(o, 'bulletPassThrough')) return;
      if (this._isDescendantOf(o, this.fpGun)) return;
      for (const c of this.chars) {
        if (this._isDescendantOf(o, c.mesh)) return;
      }
      blockers.push(o);
    });
    this._bulletBlockerMeshes = blockers;
  }

  _updateHunterPoopHitHighlight() {
    const hunterMesh = this.chars[0]?.mesh;
    if (!hunterMesh) return;
    const active = performance.now() < this._hunterPoopHighlightUntil;
    if (active === this._hunterPoopHighlightActive) return;
    this._hunterPoopHighlightActive = active;
    setHunterPoopHitHighlight(hunterMesh, active);
  }

  _isHunterPoopDebuffed(now = performance.now()) {
    return now < this._hunterPoopHighlightUntil;
  }

  _getCollisionRadius(ch) {
    return ch?.collisionRadius ?? ch?.def?.radius ?? 0.3;
  }

  /**
   * メッシュ見た目から XZ 平面の外接半径を1回だけ計算する
   * （毎フレーム再計算はしない）
   */
  _computeMeshRadiusXZ(mesh, feet) {
    if (!mesh?.isObject3D) return 0.2;
    mesh.updateMatrixWorld(true);
    const v = new THREE.Vector3();
    let bestSq = 0;
    mesh.traverse((o) => {
      if (!o.isMesh || !o.geometry?.attributes?.position) return;
      const pos = o.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        v.set(pos.getX(i), pos.getY(i), pos.getZ(i));
        v.applyMatrix4(o.matrixWorld);
        const dx = v.x - feet.x;
        const dz = v.z - feet.z;
        const d2 = dx * dx + dz * dz;
        if (d2 > bestSq) bestSq = d2;
      }
    });
    return Math.max(0.05, Math.sqrt(bestSq));
  }

  /** ADS 時：接眼ガラス円を投影し、スコープ外マスクの穴を枠に合わせる */
  _updateScopeVignette(ads) {
    const el = this._scopeVignetteEl;
    const crosshairEl = this._crosshairEl;
    if (!el) return;
    if (!ads) {
      if (this._scopeVignetteLastBg !== '') {
        el.style.background = '';
        this._scopeVignetteLastBg = '';
      }
      if (crosshairEl) crosshairEl.style.setProperty('--scope-diameter-px', '');
      return;
    }
    const mesh = this.fpGun.userData.fpScopeEyeGlassMesh;
    if (!mesh?.geometry) return;
    const radius = mesh.geometry.parameters?.radius ?? 0.013;

    mesh.getWorldPosition(this._vigWorldC);
    this._vigWorldR.set(radius, 0, 0);
    this._vigWorldR.applyMatrix4(mesh.matrixWorld);

    this._vigNdc.copy(this._vigWorldC).project(this.camera);
    const ncx = this._vigNdc.x;
    const ncy = this._vigNdc.y;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    const hw = w * 0.5;
    const hh = h * 0.5;

    this._vigNdc.copy(this._vigWorldR).project(this.camera);
    const rx = (this._vigNdc.x - ncx) * hw;
    const ry = (this._vigNdc.y - ncy) * hh;
    let rPx = Math.hypot(rx, ry);
    if (!Number.isFinite(rPx) || rPx < 4) {
      const fallbackBg =
        'radial-gradient(circle at 50% 50%, transparent 0, transparent 22vmin, #000 26vmin, #000 100%)';
      if (fallbackBg !== this._scopeVignetteLastBg) {
        el.style.background = fallbackBg;
        this._scopeVignetteLastBg = fallbackBg;
      }
      if (crosshairEl) crosshairEl.style.setProperty('--scope-diameter-px', '');
      return;
    }

    /* わずかに広げてレンズ縁の内側まで黒がかからないようにする */
    rPx = Math.min(rPx * 1.04, Math.min(w, h) * 0.49);
    if (crosshairEl) crosshairEl.style.setProperty('--scope-diameter-px', `${rPx * 2}px`);

    const cx = ncx * hw + hw;
    const cy = -ncy * hh + hh;
    const feather = Math.max(1.5, rPx * 0.035);
    const xp = (cx / w) * 100;
    const yp = (cy / h) * 100;

    const maskBg = `radial-gradient(circle at ${xp}% ${yp}%, transparent 0, transparent ${rPx}px, #000 ${rPx + feather}px, #000 100%)`;
    if (maskBg !== this._scopeVignetteLastBg) {
      el.style.background = maskBg;
      this._scopeVignetteLastBg = maskBg;
    }
  }

  _makeCharacter(role) {
    const def = DEFS[role];
    const mesh = createCharacterMesh(role);
    const feet = SPAWNS[role].clone();
    mesh.position.copy(feet);
    this.scene.add(mesh);
    const ch = {
      role,
      def,
      mesh,
      feet,
      velY: 0,
      yaw: 0,
      climbing: null,
    };
    if (role === 'bear') {
      ch.bearDashFuel = BEAR_DASH_MAX_DURATION;
      ch.bearDashActive = false;
      ch.bearDashDir = new THREE.Vector3(0, 0, 1);
    }
    if (role === 'monkey') {
      /** ジャンプゲージ 0〜1。デフォルトは空 */
      ch.monkeyJumpGauge = 0;
      /** ジャンプ直後の前方向速度（XZ）。空中で減衰 */
      ch.monkeyAirDrive = new THREE.Vector3(0, 0, 0);
      /** ジャンプ離脱直後にスナップ登木から除外する幹（treeTrunks の参照） */
      ch.monkeySnapCooldownTree = null;
      ch.monkeySnapCooldownUntil = 0;
      /** 見た目優先：推定ではなく固定半径を使う */
      ch.collisionRadius = MONKEY_COLLISION_RADIUS_FIXED;
    }
    return ch;
  }

  connect() {
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    this.canvas.addEventListener('pointerdown', this._boundPointerDown);
    window.addEventListener('pointerup', this._boundPointerUp);
    window.addEventListener('mouseup', this._boundPointerUp);
    /** 右クリック＋左クリックが canvas に届かない環境向け。pointerdown / mousedown 両対応（短時間の重複は無視） */
    window.addEventListener('pointerdown', this._boundWindowShootInput, true);
    window.addEventListener('mousedown', this._boundWindowShootInput, true);
    this._boundWindowMonkeyRockThrow = this._onWindowMonkeyRockThrow.bind(this);
    window.addEventListener('pointerdown', this._boundWindowMonkeyRockThrow, true);
    window.addEventListener('mousedown', this._boundWindowMonkeyRockThrow, true);
    window.addEventListener('pointerdown', this._boundWindowRightDown, true);
    window.addEventListener('mousedown', this._boundWindowRightDown, true);
    window.addEventListener(
      'contextmenu',
      (e) => {
        if (document.pointerLockElement === this.canvas) e.preventDefault();
      },
      true,
    );

    document.addEventListener('pointerlockchange', () => {
      const locked = document.pointerLockElement === this.canvas;
      if (locked) {
        document.addEventListener('mousemove', this._boundMouseMove);
      } else {
        document.removeEventListener('mousemove', this._boundMouseMove);
      }
      document.body.classList.toggle('pointer-locked', locked);
    });

    window.addEventListener('keydown', this._boundKeyDown);
    window.addEventListener('keyup', this._boundKeyUp);
    document.body.classList.add('mode-fp');
    this._updateHud();
  }

  /**
   * マウス右ボタン：構え（ハンター ADS／サル投擲構えなど）
   * ロック中は canvas ではなく window にだけ届くことがあるのでここでも処理
   */
  _onWindowRightButtonDown(e) {
    if (e.button !== 2) return;
    const locked = document.pointerLockElement === this.canvas;
    if (!locked && e.target !== this.canvas) return;
    this._aiming = true;
    e.preventDefault();
  }

  _onPointerDown(e) {
    if (e.button === 2) {
      this._aiming = true;
      e.preventDefault();
      return;
    }
    if (e.button !== 0) return;
    const pch = this.chars[this.activeIndex];
    if (
      document.pointerLockElement === this.canvas &&
      pch?.role === 'monkey' &&
      this._aiming
    ) {
      this._monkeyRockThrowPending = true;
    } else {
      this._climbClickPending = true;
    }
    if (document.pointerLockElement !== this.canvas) {
      this.canvas.requestPointerLock();
    }
    /** 射撃は _onWindowShootInput（window キャプチャ）に任せる */
  }

  _onWindowShootInput(e) {
    if (e.button !== 0) return;
    const now = performance.now();
    if (now - this._shootInputDedupe < 40) return;
    if (document.pointerLockElement !== this.canvas) return;
    const ch = this.chars[this.activeIndex];
    if (!ch.def.fp || ch.role !== 'hunter' || !this._aiming) return;
    this._shootInputDedupe = now;
    this._tryShoot();
  }

  /** ロック中に左クリックが canvas に届かない場合向け（サル投擲） */
  _onWindowMonkeyRockThrow(e) {
    if (e.button !== 0) return;
    if (document.pointerLockElement !== this.canvas) return;
    const ch = this.chars[this.activeIndex];
    if (ch?.role !== 'monkey' || !this._aiming) return;
    this._monkeyRockThrowPending = true;
  }

  _onPointerUp(e) {
    if (e.button === 2) {
      this._aiming = false;
    }
  }

  _applyFpCameraRotation() {
    this._eulerForCamera.copy(this.euler);
    this._eulerForCamera.x = Math.max(
      -PITCH_LIMIT,
      Math.min(PITCH_LIMIT, this.euler.x + this._recoilPitch),
    );
    this.camera.quaternion.setFromEuler(this._eulerForCamera);
  }

  _spawnMonkeyRock() {
    const ch = this.chars.find((c) => c.role === 'monkey');
    if (!ch) return;
    const now = performance.now();
    if (now - this._lastMonkeyRockSpawn < MONKEY_ROCK_THROW_COOLDOWN_MS) return;
    this._lastMonkeyRockSpawn = now;

    this._raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    const dir = this._raycaster.ray.direction.clone().normalize();
    const start = new THREE.Vector3(ch.feet.x, ch.feet.y + 0.42, ch.feet.z);
    start.addScaledVector(dir, 0.28);
    const vel = dir.multiplyScalar(MONKEY_ROCK_SPEED);

    while (this._monkeyRocks.length >= MONKEY_ROCK_MAX) {
      const old = this._monkeyRocks.shift();
      if (old?.mesh) {
        this.scene.remove(old.mesh);
        old.mesh.geometry.dispose();
        old.mesh.material.dispose();
      }
    }

    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(MONKEY_ROCK_RADIUS, 10, 8),
      new THREE.MeshStandardMaterial({
        color: 0x6b4a32,
        roughness: 0.92,
        metalness: 0.02,
        flatShading: true,
      }),
    );
    mesh.position.copy(start);
    mesh.castShadow = true;
    this.scene.add(mesh);
    this._monkeyRocks.push({ mesh, vel });
  }

  _updateMonkeyRocks(dt) {
    if (this._monkeyRocks.length === 0) return;
    const h = this.halfBounds;
    const hunterMesh = this.chars[0].mesh;
    hunterMesh.updateMatrixWorld(true);
    this._hunterHitBox.setFromObject(hunterMesh);

    const alive = [];
    for (const r of this._monkeyRocks) {
      r.vel.y -= GRAVITY * MONKEY_ROCK_GRAVITY_MUL * dt;
      r.mesh.position.x += r.vel.x * dt;
      r.mesh.position.y += r.vel.y * dt;
      r.mesh.position.z += r.vel.z * dt;
      resolveCollisionsXZ(r.mesh.position, MONKEY_ROCK_RADIUS, this.colliders);
      r.mesh.position.x = Math.max(-h, Math.min(h, r.mesh.position.x));
      r.mesh.position.z = Math.max(-h, Math.min(h, r.mesh.position.z));

      this._poopHitSphere.center.copy(r.mesh.position);
      this._poopHitSphere.radius = MONKEY_ROCK_RADIUS;
      if (this._hunterHitBox.intersectsSphere(this._poopHitSphere)) {
        this._hunterPoopHighlightUntil = performance.now() + HUNTER_POOP_HIT_HIGHLIGHT_MS;
        this.scene.remove(r.mesh);
        r.mesh.geometry.dispose();
        r.mesh.material.dispose();
        continue;
      }

      if (r.mesh.position.y < MONKEY_ROCK_RADIUS - 0.02) {
        this.scene.remove(r.mesh);
        r.mesh.geometry.dispose();
        r.mesh.material.dispose();
        continue;
      }
      alive.push(r);
    }
    this._monkeyRocks = alive;
  }

  _tryShoot() {
    if (this._recoilPitch > RECOIL_DONE_EPS) return;
    if (!this._aiming) return;
    if (document.pointerLockElement !== this.canvas) return;

    /** 反動でカメラが動く前に照準中心で命中判定 */
    this._raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    const animalMeshes = this.chars.slice(1).map((c) => c.mesh);
    const animalHits = this._raycaster.intersectObjects(animalMeshes, true);
    const blockerHits = this._raycaster.intersectObjects(this._bulletBlockerMeshes, true);

    void playGunshot();
    this._recoilPitch = RECOIL_PITCH_MAX;
    this._applyFpCameraRotation();

    let hitPrey = null;
    let hitPreyDist = Infinity;
    for (const hit of animalHits) {
      let o = hit.object;
      while (o) {
        for (let i = 1; i < this.chars.length; i++) {
          if (o === this.chars[i].mesh) {
            hitPrey = this.chars[i];
            hitPreyDist = hit.distance;
            break;
          }
        }
        if (hitPrey) break;
        o = o.parent;
      }
      if (hitPrey) break;
    }

    if (!hitPrey) return;
    const blockerDist = blockerHits.length > 0 ? blockerHits[0].distance : Infinity;
    if (hitPreyDist + 1e-4 >= blockerDist) return;

    console.log(`[射撃命中] ${hitPrey.def.label}`);
    this._triggerHitFeedback();
    return;
    }

  /** 照準中央ヒット時の画面中央エフェクト */
  _triggerHitFeedback() {
    const el = this._hitFeedbackEl;
    if (!el) return;
    el.classList.remove('hit-feedback--active');
    void el.offsetWidth;
    el.classList.add('hit-feedback--active');
    const onEnd = (e) => {
      if (e.animationName !== 'hitFeedbackPop') return;
      el.classList.remove('hit-feedback--active');
      el.removeEventListener('animationend', onEnd);
    };
    el.addEventListener('animationend', onEnd);
  }

  _onMouseMove(e) {
    if (!e.movementX && !e.movementY) return;
    const ch = this.chars[this.activeIndex];
    if (ch.def.fp) {
      if (this._recoilPitch > RECOIL_DONE_EPS) return;
      let sensMul = ch.role === 'hunter' && this._aiming ? FP_LOOK_SENS_ADS_MUL : 1;
      if (ch.role === 'hunter' && this._isHunterPoopDebuffed()) {
        sensMul *= HUNTER_POOP_DEBUFF_SENS_MUL;
      }
      this.euler.y -= e.movementX * this.lookSensitivity * sensMul;
      this.euler.x -= e.movementY * this.lookSensitivity * sensMul;
      this.euler.x = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, this.euler.x));
      this._applyFpCameraRotation();
    } else {
      this.tpYaw -= e.movementX * this.lookSensitivity;
      this.tpPitch -= e.movementY * this.lookSensitivity;
      const monkeyWidePitch = ch.role === 'monkey' && (this._aiming || !!ch.climbing);
      const pitchMin = monkeyWidePitch ? MONKEY_THROW_PITCH_MIN : TP_PITCH_MIN;
      const pitchMax = monkeyWidePitch ? MONKEY_THROW_PITCH_MAX : TP_PITCH_MAX;
      this.tpPitch = Math.max(pitchMin, Math.min(pitchMax, this.tpPitch));
      if (!monkeyWidePitch) this._clampTpPitchToGround(ch);
    }
  }

  /**
   * 三人称カメラが地面に潜らないよう、tpPitch の上限を動的に抑える
   * （潜る状況では、それ以上の縦エイムを無効化）
   */
  _clampTpPitchToGround(ch) {
    if (!ch || ch.def.fp) return;
    const def = ch.def;
    const minCamY = 0.05;
    const camYAtPitch = (p) =>
      ch.feet.y + def.aimHeight + def.camHeight * Math.cos(p) - def.camDist * Math.sin(p);

    const loLimit = TP_PITCH_MIN;
    const p = Math.max(loLimit, Math.min(TP_PITCH_MAX, this.tpPitch));
    if (camYAtPitch(loLimit) < minCamY) {
      this.tpPitch = loLimit;
      return;
    }
    if (camYAtPitch(p) >= minCamY) {
      this.tpPitch = p;
      return;
    }

    let lo = loLimit;
    let hi = p;
    for (let i = 0; i < 14; i++) {
      const mid = (lo + hi) * 0.5;
      if (camYAtPitch(mid) >= minCamY) lo = mid;
      else hi = mid;
    }
    this.tpPitch = lo;
  }

  _resolveCharacterCollisions(ch, feet) {
    const r = this._getCollisionRadius(ch);
    if (ch.role !== 'monkey') {
      resolveCollisionsXZ(feet, r, this.colliders);
      return;
    }
    const y0 = feet.y + MONKEY_COLLIDER_BOTTOM_OFFSET;
    const y1 = feet.y + MONKEY_COLLIDER_TOP_OFFSET;
    resolveCollisionsCapsuleXZ(feet, r, y0, y1, this.colliders);
  }

  /**
   * 登木可能距離内で最も近い幹
   * @param {{ x: number, z: number }} feet
   * @param {number} radius
   * @param {{ x: number, z: number, r: number, topY: number } | null} [excludeTree] 候補から外す幹
   */
  _nearestTreeForClimb(feet, radius, excludeTree = null) {
    let best = null;
    let bestD = Infinity;
    for (const t of this.treeTrunks) {
      if (excludeTree && t === excludeTree) continue;
      const dx = feet.x - t.x;
      const dz = feet.z - t.z;
      const d = Math.hypot(dx, dz);
      if (d > t.r + radius + 1.05) continue;
      if (d < bestD) {
        bestD = d;
        best = t;
      }
    }
    return best;
  }

  /** 直前にジャンプで離れた木へのスナップ／クリック登木を抑止 */
  _monkeyIsTreeSnapBlocked(ch, tree) {
    if (ch.role !== 'monkey' || !tree) return false;
    const until = ch.monkeySnapCooldownUntil ?? 0;
    if (performance.now() >= until) {
      ch.monkeySnapCooldownTree = null;
      return false;
    }
    return ch.monkeySnapCooldownTree === tree;
  }

  _canGrabTree(char, tree) {
    if (!tree) return false;
    const dx = char.feet.x - tree.x;
    const dz = char.feet.z - tree.z;
    const d = Math.hypot(dx, dz);
    return d < tree.r + this._getCollisionRadius(char) + 0.85;
  }

  /**
   * ジャンプ・落下中に幹の水平範囲＋高さ帯に入ったら登木へ移行（地上は対象外）
   */
  _trySnapMonkeyToTreeFromAir(ch, feet, def) {
    if (ch.role !== 'monkey' || ch.climbing) return;
    const grounded = feet.y <= 0.02 && ch.velY <= 0;
    if (grounded) return;
    let near = this._nearestTreeForClimb(feet, this._getCollisionRadius(ch));
    if (near && this._monkeyIsTreeSnapBlocked(ch, near)) {
      near = this._nearestTreeForClimb(feet, this._getCollisionRadius(ch), near);
    }
    if (!near || !this._canGrabTree(ch, near)) return;
    if (this._monkeyIsTreeSnapBlocked(ch, near)) return;
    const yLo = 0.35;
    const yHi = near.topY - 0.25;
    if (feet.y < yLo - 0.2 || feet.y > yHi + 0.25) return;
    const m = this.chars.find((c) => c.role === 'monkey');
    if (m) {
      m.monkeyJumpGauge = 0;
      m.monkeyAirDrive.set(0, 0, 0);
    }
    ch.climbing = { tree: near };
    feet.x = near.x;
    feet.z = near.z;
    feet.y = Math.max(yLo, Math.min(yHi, feet.y));
    ch.velY = 0;
  }

  _clearBearDashActiveIfNeeded() {
    if (this.chars[this.activeIndex]?.role === 'bear') {
      const bear = this.chars.find((c) => c.role === 'bear');
      if (bear) bear.bearDashActive = false;
    }
  }

  _resetMonkeyJumpGaugeIfLeaving() {
    if (this.chars[this.activeIndex]?.role === 'monkey') {
      const m = this.chars.find((c) => c.role === 'monkey');
      if (m) {
        m.monkeyJumpGauge = 0;
        m.monkeyAirDrive.set(0, 0, 0);
      }
    }
  }

  /** クマ操作中のみ表示。残りダッシュ可能時間の割合 */
  _updateBearDashGauge() {
    const root = this._bearDashGaugeEl;
    const fill = this._bearDashGaugeFillEl;
    if (!root || !fill) return;
    const playingBear = this.chars[this.activeIndex]?.role === 'bear';
    root.hidden = !playingBear;
    root.setAttribute('aria-hidden', playingBear ? 'false' : 'true');
    if (!playingBear) return;
    const bear = this.chars.find((c) => c.role === 'bear');
    if (!bear) return;
    const ratio = Math.max(0, Math.min(1, bear.bearDashFuel / BEAR_DASH_MAX_DURATION));
    fill.style.width = `${ratio * 100}%`;
  }

  /** サル操作中のみ表示。monkeyJumpGauge は 0〜1（空＝0） */
  _updateMonkeyJumpGauge() {
    const root = this._monkeyJumpGaugeEl;
    const fill = this._monkeyJumpGaugeFillEl;
    if (!root || !fill) return;
    const playingMonkey = this.chars[this.activeIndex]?.role === 'monkey';
    root.hidden = !playingMonkey;
    root.setAttribute('aria-hidden', playingMonkey ? 'false' : 'true');
    if (!playingMonkey) return;
    const monkey = this.chars.find((c) => c.role === 'monkey');
    if (!monkey) return;
    const ratio = Math.max(0, Math.min(1, monkey.monkeyJumpGauge ?? 0));
    fill.style.width = `${ratio * 100}%`;
  }

  update(dt) {
    const edge = new Set(this._edge);
    this._edge.clear();

    if (edge.has('Digit1')) {
      this._clearBearDashActiveIfNeeded();
      this._resetMonkeyJumpGaugeIfLeaving();
      this.activeIndex = 0;
      this._aiming = false;
      this._recoilPitch = 0;
      this._syncCameraMode();
    }
    if (edge.has('Digit2')) {
      this._clearBearDashActiveIfNeeded();
      this._resetMonkeyJumpGaugeIfLeaving();
      this.activeIndex = 1;
      this._aiming = false;
      this._recoilPitch = 0;
      this._syncCameraMode();
    }
    if (edge.has('Digit3')) {
      this._clearBearDashActiveIfNeeded();
      this._resetMonkeyJumpGaugeIfLeaving();
      this.activeIndex = 2;
      this._aiming = false;
      this._recoilPitch = 0;
      this._syncCameraMode();
    }
    if (edge.has('Digit4')) {
      this._clearBearDashActiveIfNeeded();
      this.activeIndex = 3;
      this._aiming = false;
      this._recoilPitch = 0;
      this._syncCameraMode();
    }

    const ch = this.chars[this.activeIndex];
    const def = ch.def;
    const feet = ch.feet;
    if (!(ch.role === 'monkey' && (this._aiming || !!ch.climbing)) && !def.fp) {
      this._clampTpPitchToGround(ch);
    }

    if (this._recoilPitch > RECOIL_DONE_EPS) {
      this._recoilPitch *= Math.exp(-dt * RECOIL_DECAY);
      if (this._recoilPitch <= RECOIL_DONE_EPS) this._recoilPitch = 0;
    }
    if (def.fp) this._applyFpCameraRotation();

    const spaceEdge = edge.has('Space');
    const climbClickEdge = this._climbClickPending;
    this._climbClickPending = false;
    const spaceJustReleased = this._prevSpaceHeld && !this.keys.has('Space');
    const hunterAds = ch.role === 'hunter' && this._aiming;

    if (ch.role === 'monkey' && ch.climbing) {
      const tree = ch.climbing.tree;
      const yTop = tree.topY - 0.25;
      feet.x = tree.x;
      feet.z = tree.z;

      let dy = 0;
      const climbAimMul =
        ch.role === 'monkey' && this._aiming ? MONKEY_THROW_MOVE_MUL : 1;
      if (this.keys.has('KeyW') || this.keys.has('ArrowUp'))
        dy += def.climbSpeed * dt * climbAimMul;
      if (this.keys.has('KeyS') || this.keys.has('ArrowDown'))
        dy -= def.climbSpeed * dt * climbAimMul;
      feet.y += dy;
      feet.y = Math.max(0.35, Math.min(yTop, feet.y));

      if (this.keys.has('Space')) {
        ch.monkeyJumpGauge = Math.min(1, ch.monkeyJumpGauge + MONKEY_JUMP_CHARGE_PER_SEC * dt);
      }
      if (spaceJustReleased) {
        const g = ch.monkeyJumpGauge;
        if (g >= MONKEY_JUMP_MIN_CHARGE) {
          const aim = new THREE.Vector3(feet.x, feet.y + def.aimHeight, feet.z);
          const off = new THREE.Vector3(0, def.camHeight, -def.camDist);
          off.applyAxisAngle(new THREE.Vector3(1, 0, 0), -this.tpPitch);
          off.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.tpYaw);
          this.camera.position.copy(aim).add(off);
          this.camera.lookAt(aim);
          const forward = new THREE.Vector3();
          this.camera.getWorldDirection(forward);
          forward.y = 0;
          if (forward.lengthSq() > 1e-6) forward.normalize();
          else forward.set(0, 0, 1);
          ch.climbing = null;
          ch.velY =
            MONKEY_JUMP_MIN_VEL + (MONKEY_JUMP_MAX_VEL - MONKEY_JUMP_MIN_VEL) * g;
          const push =
            MONKEY_JUMP_FORWARD_MIN +
            (MONKEY_JUMP_FORWARD_MAX - MONKEY_JUMP_FORWARD_MIN) * g;
          ch.monkeyAirDrive.copy(forward);
          ch.monkeyAirDrive.y = 0;
          if (ch.monkeyAirDrive.lengthSq() < 1e-6) ch.monkeyAirDrive.set(0, 0, 1);
          else ch.monkeyAirDrive.normalize().multiplyScalar(push);
          const m = this.chars.find((c) => c.role === 'monkey');
          if (m) {
            m.monkeySnapCooldownTree = tree;
            m.monkeySnapCooldownUntil = performance.now() + MONKEY_TREE_SNAP_COOLDOWN_MS;
          }
        }
        ch.monkeyJumpGauge = 0;
      }
    } else {
      const forward = new THREE.Vector3();
      const right = new THREE.Vector3();
      if (def.fp) {
        this.camera.getWorldDirection(forward);
        forward.y = 0;
        if (forward.lengthSq() > 1e-6) forward.normalize();
        else forward.set(0, 0, -1);
        right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
      } else {
        // カメラが lookAt している方向（画面奥）に W が進むよう、視線ベースで移動
        const aim = new THREE.Vector3(feet.x, feet.y + def.aimHeight, feet.z);
        const off = new THREE.Vector3(0, def.camHeight, -def.camDist);
        off.applyAxisAngle(new THREE.Vector3(1, 0, 0), -this.tpPitch);
        off.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.tpYaw);
        this.camera.position.copy(aim).add(off);
        this.camera.lookAt(aim);
        this.camera.getWorldDirection(forward);
        forward.y = 0;
        if (forward.lengthSq() > 1e-6) forward.normalize();
        else forward.set(0, 0, 1);
        right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
      }

      const onGround = feet.y <= 0.02 && ch.velY <= 0;

      const move = new THREE.Vector3();
      if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) move.add(forward);
      if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) move.sub(forward);
      if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) move.add(right);
      if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) move.sub(right);

      if (ch.role === 'bear') {
        if (
          onGround &&
          this.keys.has('Space') &&
          !ch.bearDashActive &&
          ch.bearDashFuel >= BEAR_DASH_MAX_DURATION - BEAR_DASH_FULL_EPS
        ) {
          ch.bearDashDir.copy(forward);
          ch.bearDashDir.y = 0;
          if (ch.bearDashDir.lengthSq() < 1e-6) ch.bearDashDir.set(0, 0, 1);
          else ch.bearDashDir.normalize();
          ch.bearDashActive = true;
        }
        if (ch.bearDashActive) {
          if (!this.keys.has('Space') || ch.bearDashFuel <= BEAR_DASH_MIN_FUEL) {
            ch.bearDashActive = false;
          } else {
            feet.x += ch.bearDashDir.x * BEAR_DASH_SPEED * dt;
            feet.z += ch.bearDashDir.z * BEAR_DASH_SPEED * dt;
            ch.bearDashFuel -= dt;
            if (ch.bearDashFuel < 0) ch.bearDashFuel = 0;
            if (ch.bearDashFuel <= BEAR_DASH_MIN_FUEL) ch.bearDashActive = false;
            ch.yaw = Math.atan2(ch.bearDashDir.x, ch.bearDashDir.z);
          }
        }
      }

      if (!(ch.role === 'bear' && ch.bearDashActive) && move.lengthSq() > 0) {
        let moveMul = hunterAds ? FP_ADS_MOVE_MUL : 1;
        if (ch.role === 'monkey' && this._aiming && !ch.climbing) {
          moveMul *= MONKEY_THROW_MOVE_MUL;
        }
        move.normalize().multiplyScalar(def.speed * moveMul * dt);
        feet.x += move.x;
        feet.z += move.z;
        if (!(ch.role === 'monkey' && this._aiming && !ch.climbing)) {
          ch.yaw = Math.atan2(move.x, move.z);
        }
      }
      let nearTree =
        ch.role === 'monkey' && onGround
          ? this._nearestTreeForClimb(feet, this._getCollisionRadius(ch))
          : null;
      if (nearTree && this._monkeyIsTreeSnapBlocked(ch, nearTree)) {
        nearTree = this._nearestTreeForClimb(feet, this._getCollisionRadius(ch), nearTree);
      }
      const canClimb =
        ch.role === 'monkey' &&
        onGround &&
        nearTree &&
        this._canGrabTree(ch, nearTree) &&
        !this._monkeyIsTreeSnapBlocked(ch, nearTree);

      if (ch.role === 'monkey' && onGround && canClimb) {
        ch.monkeyJumpGauge = 0;
      }

      if (ch.role === 'monkey' && !ch.climbing && onGround && !canClimb && this.keys.has('Space')) {
        ch.monkeyJumpGauge = Math.min(1, ch.monkeyJumpGauge + MONKEY_JUMP_CHARGE_PER_SEC * dt);
      }

      if (ch.role === 'monkey' && !ch.climbing && onGround && spaceJustReleased) {
        const g = ch.monkeyJumpGauge;
        if (g >= MONKEY_JUMP_MIN_CHARGE) {
          ch.velY =
            MONKEY_JUMP_MIN_VEL + (MONKEY_JUMP_MAX_VEL - MONKEY_JUMP_MIN_VEL) * g;
          const push =
            MONKEY_JUMP_FORWARD_MIN +
            (MONKEY_JUMP_FORWARD_MAX - MONKEY_JUMP_FORWARD_MIN) * g;
          ch.monkeyAirDrive.copy(forward);
          ch.monkeyAirDrive.y = 0;
          if (ch.monkeyAirDrive.lengthSq() < 1e-6) ch.monkeyAirDrive.set(0, 0, 1);
          else ch.monkeyAirDrive.normalize().multiplyScalar(push);
        }
        ch.monkeyJumpGauge = 0;
      } else if (ch.role === 'monkey' && spaceJustReleased && !onGround) {
        ch.monkeyJumpGauge = 0;
      }

      if (
        climbClickEdge &&
        document.pointerLockElement === this.canvas &&
        !hunterAds &&
        canClimb
      ) {
        const m = this.chars.find((c) => c.role === 'monkey');
        if (m) {
          m.monkeyJumpGauge = 0;
          m.monkeyAirDrive.set(0, 0, 0);
        }
        ch.climbing = { tree: nearTree };
        feet.x = nearTree.x;
        feet.z = nearTree.z;
        feet.y = 0.4;
        ch.velY = 0;
      } else if (spaceEdge && !hunterAds && onGround && ch.role !== 'bear' && ch.role !== 'monkey') {
        ch.velY = def.jumpForce;
      }

      if (!ch.climbing) {
        ch.velY -= GRAVITY * dt;
        feet.y += ch.velY * dt;
        if (feet.y < 0) {
          feet.y = 0;
          ch.velY = 0;
        }
        this._resolveCharacterCollisions(ch, feet);
        const h = this.halfBounds;
        feet.x = Math.max(-h, Math.min(h, feet.x));
        feet.z = Math.max(-h, Math.min(h, feet.z));

        if (ch.role === 'monkey') {
          const grounded = feet.y <= 0.02 && ch.velY <= 0;
          if (grounded) {
            ch.monkeyAirDrive.set(0, 0, 0);
          } else if (ch.monkeyAirDrive.lengthSq() > 1e-8) {
            const v = ch.monkeyAirDrive;
            feet.x += v.x * dt;
            feet.z += v.z * dt;
            v.multiplyScalar(Math.exp(-dt * MONKEY_JUMP_AIR_DRAG));
            feet.x = Math.max(-h, Math.min(h, feet.x));
            feet.z = Math.max(-h, Math.min(h, feet.z));
            this._resolveCharacterCollisions(ch, feet);
          }
          this._trySnapMonkeyToTreeFromAir(ch, feet, def);
        }
      }
    }

    const bearChar = this.chars.find((c) => c.role === 'bear');
    if (
      bearChar &&
      !bearChar.bearDashActive &&
      bearChar.bearDashFuel < BEAR_DASH_MAX_DURATION
    ) {
      bearChar.bearDashFuel = Math.min(
        BEAR_DASH_MAX_DURATION,
        bearChar.bearDashFuel + BEAR_DASH_REGEN_PER_SEC * dt,
      );
    }

    ch.mesh.position.set(feet.x, feet.y + (def.meshYOffset ?? 0), feet.z);
    if (def.fp) {
      ch.mesh.rotation.y = this.euler.y + HUNTER_MESH_YAW_OFFSET;
    } else if (ch.climbing) {
      if (!this._aiming) {
        const t = ch.climbing.tree;
        ch.mesh.rotation.y = Math.atan2(ch.feet.x - t.x, ch.feet.z - t.z);
      } else {
        ch.mesh.rotation.y = ch.yaw;
      }
    } else {
      ch.mesh.rotation.y = ch.yaw;
    }

    const hunter = this.chars[0];
    hunter.mesh.visible = this.activeIndex !== 0;

    this.hunterGlow.position.set(hunter.feet.x, hunter.feet.y + 1.2, hunter.feet.z);

    if (def.fp) {
      this.camera.position.set(feet.x, feet.y + def.eyeHeight, feet.z);
      const ads = ch.role === 'hunter' && this._aiming;
      const targetFov = ads ? FP_FOV_ADS : FP_FOV_DEFAULT;
      if (this.camera.fov !== targetFov) {
        this.camera.fov = targetFov;
        this.camera.updateProjectionMatrix();
      }
      const gunMul = ads ? FP_GUN_ADS_SCALE_MUL : 1;
      this.fpGun.scale.setScalar(FP_GUN_SCALE_BASE * gunMul);
      this.spotLight.intensity = 4.2;
      this.fpGun.visible = !ads;
      syncFirstPersonGunToCamera(this.camera, this.fpGun, {
        aiming: this._aiming,
        recoil: Math.min(1, this._recoilPitch / RECOIL_PITCH_MAX),
      });
      setFpGunBodyHiddenForAiming(this.fpGun, this._aiming);
      this._updateScopeVignette(ads);
    } else {
      if (this.camera.fov !== FP_FOV_DEFAULT) {
        this.camera.fov = FP_FOV_DEFAULT;
        this.camera.updateProjectionMatrix();
      }
      this.fpGun.visible = false;
      const target = new THREE.Vector3(feet.x, feet.y + def.aimHeight, feet.z);
      const off = new THREE.Vector3(0, def.camHeight, -def.camDist);
      off.applyAxisAngle(new THREE.Vector3(1, 0, 0), -this.tpPitch);
      off.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.tpYaw);
      this._vThrowNormalPos.copy(target).add(off);
      this.camera.position.copy(this._vThrowNormalPos);

      const throwStance = ch.role === 'monkey' && this._aiming;
      const throwT = throwStance ? 1 : 0;
      this._monkeyThrowCamBlend = THREE.MathUtils.lerp(
        this._monkeyThrowCamBlend,
        throwT,
        1 - Math.exp(-MONKEY_THROW_CAM_BLEND_SMOOTH * Math.min(dt, 0.05)),
      );

      if (ch.role === 'monkey' && this._monkeyThrowCamBlend > 1e-4) {
        /** 体の yaw ではなく、tp カメラの視線（マウス）だけで構え位置を決める */
        this.camera.position.copy(this._vThrowNormalPos);
        this.camera.lookAt(target);
        this.camera.getWorldDirection(this._vThrowViewFull);
        this._vThrowForward.copy(this._vThrowViewFull);
        this._vThrowForward.y = 0;
        if (this._vThrowForward.lengthSq() > 1e-6) this._vThrowForward.normalize();
        else this._vThrowForward.set(0, 0, 1);
        this._vThrowCamSide.crossVectors(this._vThrowForward, new THREE.Vector3(0, 1, 0)).normalize();
        this._vThrowBehindPos
          .copy(target)
          .addScaledVector(this._vThrowForward, -MONKEY_THROW_BEHIND_DIST)
          .addScaledVector(this._vThrowCamSide, MONKEY_THROW_RIGHT_SHIFT);
        this._vThrowBehindPos.y += MONKEY_THROW_Y_BOOST;
        this.camera.position.lerpVectors(
          this._vThrowNormalPos,
          this._vThrowBehindPos,
          this._monkeyThrowCamBlend,
        );
        this._vThrowLookAt
          .copy(target)
          .addScaledVector(
            this._vThrowViewFull,
            MONKEY_THROW_LOOK_AHEAD * this._monkeyThrowCamBlend,
          );
        this.camera.lookAt(this._vThrowLookAt);
      } else {
        this.camera.lookAt(target);
      }
      this.spotLight.intensity = 0;
      this._updateScopeVignette(false);
    }

    if (!def.fp && ch.role === 'monkey' && this._aiming) {
      this.camera.getWorldDirection(this._vThrowForward);
      this._vThrowForward.y = 0;
      if (this._vThrowForward.lengthSq() > 1e-6) this._vThrowForward.normalize();
      ch.yaw = Math.atan2(this._vThrowForward.x, this._vThrowForward.z);
      ch.mesh.rotation.y = ch.yaw;
    }

    if (this._monkeyRockThrowPending) {
      this._monkeyRockThrowPending = false;
      const pch = this.chars[this.activeIndex];
      if (
        pch?.role === 'monkey' &&
        this._aiming &&
        document.pointerLockElement === this.canvas
      ) {
        this._spawnMonkeyRock();
      }
    }

    const monkeyChar2 = this.chars.find((c) => c.role === 'monkey');
    if (monkeyChar2) {
      const nowRock = performance.now();
      const rockThrowCd =
        nowRock - this._lastMonkeyRockSpawn < MONKEY_ROCK_THROW_COOLDOWN_MS;
      const armRaised =
        this.chars[this.activeIndex] === monkeyChar2 &&
        this._aiming &&
        !rockThrowCd;
      syncMonkeyRightArmRaise(monkeyChar2.mesh, armRaised, dt);
    }

    document.body.classList.toggle('mode-fp', def.fp);
    document.body.classList.toggle(
      'mode-monkey',
      ch.role === 'monkey' && this._aiming,
    );
    document.body.classList.toggle(
      'scope-ads',
      def.fp && ch.role === 'hunter' && this._aiming,
    );
    document.body.classList.toggle(
      'scope-muddy',
      def.fp && ch.role === 'hunter' && this._isHunterPoopDebuffed(),
    );
    this._updateHud();
    this._updateBearDashGauge();
    this._updateMonkeyJumpGauge();

    this._updateMonkeyRocks(dt);
    this._updateHunterPoopHitHighlight();

    this._prevSpaceHeld = this.keys.has('Space');
  }

  _syncCameraMode() {
    const ch = this.chars[this.activeIndex];
    if (ch.def.fp) {
      this._recoilPitch = 0;
      this.camera.position.set(ch.feet.x, ch.feet.y + ch.def.eyeHeight, ch.feet.z);
      this.euler.x = 0;
      this.euler.y = ch.mesh.rotation.y - HUNTER_MESH_YAW_OFFSET;
      this.euler.z = 0;
      this._applyFpCameraRotation();
    } else {
      this.tpYaw = ch.yaw + Math.PI;
    }
  }

  /** 全画面切替後など、HUD だけ再描画 */
  refreshHud() {
    this._updateHud();
    this._updateBearDashGauge();
    this._updateMonkeyJumpGauge();
  }

  _updateHud() {
    const ch = this.chars[this.activeIndex];
    const elTitle = document.getElementById('hud-title');
    const elText = document.getElementById('hud-text');
    if (elTitle) elTitle.textContent = `${ch.def.label}（操作中）`;
    if (elText) {
      const lines = [
        '1〜4：キャラ切替',
        ch.def.fp ? 'マウス：視点' : 'マウス：カメラ回転',
        'WASD：移動',
        ch.role === 'monkey'
          ? 'Space：長押しでジャンプ溜め・離すと大ジャンプ／木のそば：クリックで登木・空中で幹に触れても登木（W/S・幹上もいつでも溜めジャンプ）／右クリック：投擲構え／構え中・左クリック：うんちを投げる（照準方向）'
          : ch.role === 'bear'
            ? 'Space：ダッシュ（満タン時のみ／ゲージ全回復まで再使用不可）'
            : 'Space：ジャンプ',
        ...(ch.def.fp && ch.role === 'hunter'
          ? [
              '右クリック：構える（長押し）',
              '左クリック or E：構え中のみ射撃（照準中心に命中）',
              '構え中：ゆっくり移動可・ジャンプ不可・エイム感度低下',
            ]
          : []),
        fullscreenHudLine(),
      ].filter(Boolean);
      elText.textContent = lines.join('\n');
    }
  }
}
