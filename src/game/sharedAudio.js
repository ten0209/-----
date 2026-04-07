/** アンビエント・効果音で共有（AudioContext の多重生成を防ぐ） */

/** @type {AudioContext | null} */
let ctx = null;

export function getAudioContext() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
  }
  return ctx;
}

export async function resumeAudioContext() {
  const c = getAudioContext();
  if (c.state === 'suspended') {
    await c.resume();
  }
  return c;
}
