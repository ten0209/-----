import { initScene } from './game/scene.js';
import { GameLoop } from './game/GameLoop.js';
import { MultiCharacterGame } from './game/multiCharacterController.js';
import { createAmbientBgm } from './game/ambientBgm.js';
import { bootstrapMultiplayer } from './net/multiplayerClient.js';

const app = document.getElementById('app');
const ambientBgm = createAmbientBgm();
function tryStartAmbientBgm() {
  void ambientBgm.start();
}
window.addEventListener('pointerdown', tryStartAmbientBgm, { once: true });
window.addEventListener('keydown', tryStartAmbientBgm, { once: true });

function fullscreenActive() {
  return !!(document.fullscreenElement || document.webkitFullscreenElement);
}

async function toggleFullscreen() {
  try {
    if (fullscreenActive()) {
      if (document.exitFullscreen) await document.exitFullscreen();
      else if (document.webkitExitFullscreen) await document.webkitExitFullscreen();
    } else if (app) {
      if (app.requestFullscreen) await app.requestFullscreen();
      else if (app.webkitRequestFullscreen) await app.webkitRequestFullscreen();
    }
  } catch {
    /* ユーザー拒否・未対応環境 */
  }
}

const canvas = document.getElementById('game-canvas');
const resultOverlayEl = document.getElementById('result-overlay');
const resultOverlayTextEl = document.getElementById('result-overlay-text');
const resultBackLobbyBtnEl = document.getElementById('result-back-lobby');
const roleSwitchBtnEl = document.getElementById('role-switch-btn');
const roleSwitchCurrentEl = document.getElementById('role-switch-current');
const shareUrlInputEl = document.getElementById('share-url-input');
const shareUrlCopyBtnEl = document.getElementById('share-url-copy');

const { scene, camera, renderer, gameContext } = initScene(canvas);

const game = new MultiCharacterGame(scene, camera, canvas, gameContext);
game.connect();

function resolvePublicJoinUrl() {
  const configured = import.meta.env.VITE_PUBLIC_JOIN_URL;
  if (
    typeof configured === 'string' &&
    configured.trim() !== '' &&
    !configured.includes('YOUR_HOST_IP')
  ) {
    return configured;
  }
  return window.location.href;
}

const shareUrl = resolvePublicJoinUrl();
if (shareUrlInputEl) shareUrlInputEl.value = shareUrl;
if (shareUrlCopyBtnEl) {
  shareUrlCopyBtnEl.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      shareUrlCopyBtnEl.textContent = 'コピー済み';
      setTimeout(() => {
        shareUrlCopyBtnEl.textContent = 'コピー';
      }, 1200);
    } catch {
      if (shareUrlInputEl) {
        shareUrlInputEl.focus();
        shareUrlInputEl.select();
      }
    }
  });
}

/* マルチプレイ土台：サーバーが起動していれば自動で接続 */
void bootstrapMultiplayer({
  onStateChange: (state) => {
    const count = Number.isFinite(state?.players?.size)
      ? state.players.size
      : state?.players
        ? Object.keys(state.players).length
        : 0;
    if (count > 0) {
      // 最低限の導入段階なのでログのみ。次段階でロビーUIへ反映する。
      console.log('[multiplayer] players:', count);
    }
  },
  onSelfStateChange: (self) => {
    if (!self?.role) return;
    game.setControlledRole(self.role);
    if (roleSwitchCurrentEl) roleSwitchCurrentEl.textContent = `操作キャラ: ${self.role}`;
  },
})
  .then((mp) => {
    if (!roleSwitchBtnEl) return;
    roleSwitchBtnEl.disabled = false;
    roleSwitchBtnEl.addEventListener('click', () => {
      mp.cycleRole();
    });
  })
  .catch((err) => {
  console.info('[multiplayer] not connected yet:', err?.message ?? err);
  });

function showResultOverlay(localResult, winnerTeam) {
  if (!resultOverlayEl || !resultOverlayTextEl) return;
  resultOverlayEl.hidden = false;
  resultOverlayEl.classList.remove('result-overlay--victory', 'result-overlay--defeat');
  if (localResult === 'victory') {
    resultOverlayEl.classList.add('result-overlay--victory');
    resultOverlayTextEl.textContent = '勝利';
  } else {
    resultOverlayEl.classList.add('result-overlay--defeat');
    resultOverlayTextEl.textContent = '敗北';
  }
  resultOverlayTextEl.setAttribute('data-winner-team', winnerTeam);
}

function releaseMouseLockLikeEsc() {
  if (document.pointerLockElement && document.exitPointerLock) {
    document.exitPointerLock();
  }
}

if (resultBackLobbyBtnEl) {
  resultBackLobbyBtnEl.addEventListener('click', () => {
    window.location.reload();
  });
}

if (app) {
  window.addEventListener('keydown', (e) => {
    if (e.code !== 'KeyF' || e.repeat) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    e.preventDefault();
    toggleFullscreen();
  });
  const onFsChange = () => game.refreshHud();
  document.addEventListener('fullscreenchange', onFsChange);
  document.addEventListener('webkitfullscreenchange', onFsChange);
}

let ended = false;
const loop = new GameLoop({
  scene,
  camera,
  renderer,
  onUpdate: (dt) => {
    const result = game.update(dt);
    if (ended || !result?.ended) return;
    ended = true;
    releaseMouseLockLikeEsc();
    showResultOverlay(result.localResult, result.winnerTeam);
  },
});

loop.start();
