import { initScene } from './game/scene.js';
import { GameLoop } from './game/GameLoop.js';
import { MultiCharacterGame } from './game/multiCharacterController.js';
import { createAmbientBgm } from './game/ambientBgm.js';

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

const { scene, camera, renderer, gameContext } = initScene(canvas);

const game = new MultiCharacterGame(scene, camera, canvas, gameContext);
game.connect();

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
