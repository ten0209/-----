import * as THREE from 'three';
import { buildForestStage } from './forestStage.js';

/**
 * シーン・カメラ・レンダラの初期化（森ステージ + FPS 用 PerspectiveCamera）
 */
export function initScene(canvas) {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    72,
    window.innerWidth / window.innerHeight,
    0.025,
    220
  );

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const stage = buildForestStage(scene);

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', onResize);

  return {
    scene,
    camera,
    renderer,
    gameContext: {
      colliders: stage.colliders,
      halfBounds: stage.halfBounds,
      treeTrunks: stage.treeTrunks,
      vegetables: stage.vegetables,
    },
  };
}
