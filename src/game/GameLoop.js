import * as THREE from 'three';

/**
 * 描画ループ。onUpdate に delta 秒を渡す。
 */
export class GameLoop {
  constructor({ scene, camera, renderer, onUpdate }) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.onUpdate = onUpdate;
    this._raf = null;
    this._clock = new THREE.Clock();
  }

  start() {
    const tick = () => {
      this._raf = requestAnimationFrame(tick);
      const delta = this._clock.getDelta();
      if (typeof this.onUpdate === 'function') {
        this.onUpdate(delta);
      }
      this.renderer.render(this.scene, this.camera);
    };
    tick();
  }

  stop() {
    if (this._raf != null) {
      cancelAnimationFrame(this._raf);
      this._raf = null;
    }
  }
}
