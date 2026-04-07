/**
 * プロシージャル環境音（外部ファイル不要）
 * 鳥のさえずり風のみ（パッド・ノイズなし）
 */

import { getAudioContext, resumeAudioContext } from './sharedAudio.js';

export function createAmbientBgm() {
  /** @type {GainNode | null} */
  let master = null;
  let birdTimeout = 0;
  let started = false;

  function playChirp() {
    const c = getAudioContext();
    if (!master) return;
    const t = c.currentTime;
    const pan = c.createStereoPanner();
    pan.pan.value = (Math.random() - 0.5) * 0.85;
    pan.connect(master);

    const kind = Math.random();
    if (kind < 0.5) {
      whistle(c, t, 3000 + Math.random() * 1600, 0.11, pan);
    } else if (kind < 0.82) {
      whistle(c, t, 2600 + Math.random() * 400, 0.09, pan);
      whistle(c, t + 0.1, 3400 + Math.random() * 500, 0.07, pan);
    } else {
      for (let i = 0; i < 3; i++) {
        whistle(c, t + i * 0.055, 2800 + i * 350, 0.04, pan);
      }
    }
  }

  /**
   * @param {AudioContext} c
   * @param {number} t0
   * @param {number} f0
   * @param {number} dur
   * @param {StereoPannerNode} panner
   */
  function whistle(c, t0, f0, dur, panner) {
    const osc = c.createOscillator();
    osc.type = 'sine';
    const g = c.createGain();
    const fEnd = f0 * (1.08 + Math.random() * 0.06);
    osc.frequency.setValueAtTime(f0, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(400, fEnd), t0 + dur * 0.65);

    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.022 + Math.random() * 0.018, t0 + 0.018);
    g.gain.exponentialRampToValueAtTime(0.0008, t0 + dur);

    osc.connect(g).connect(panner);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  function scheduleBird() {
    if (!started) return;
    const delay = 3500 + Math.random() * 11000;
    birdTimeout = window.setTimeout(() => {
      playChirp();
      scheduleBird();
    }, delay);
  }

  return {
    /** ブラウザの自動再生制限のため、ユーザー操作後に呼ぶ */
    async start() {
      if (started) return;
      const c = getAudioContext();
      await resumeAudioContext();
      started = true;

      master = c.createGain();
      master.gain.value = 0.14;
      master.connect(c.destination);

      scheduleBird();
    },

    stop() {
      started = false;
      window.clearTimeout(birdTimeout);
    },
  };
}
