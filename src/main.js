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

const { scene, camera, renderer, gameContext } = initScene(canvas);

const game = new MultiCharacterGame(scene, camera, canvas, gameContext);
game.connect();

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

const loop = new GameLoop({
  scene,
  camera,
  renderer,
  onUpdate: (dt) => game.update(dt),
});

loop.start();
