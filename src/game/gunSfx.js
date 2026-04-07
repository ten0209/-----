import { getAudioContext, resumeAudioContext } from './sharedAudio.js';

/**
 * 射撃っぽい銃声（プロシージャル・外部ファイル不要）
 * 低音の「ドン」＋中域の破裂音＋先端のパチン
 */
export async function playGunshot() {
  try {
    const c = getAudioContext();
    await resumeAudioContext();
    const t = c.currentTime;
    const out = c.createGain();
    out.gain.value = 0.18;
    out.connect(c.destination);

    /* --- 低音のマズルっぽい衝撃 --- */
    const thump = c.createOscillator();
    thump.type = 'sine';
    thump.frequency.setValueAtTime(118, t);
    thump.frequency.exponentialRampToValueAtTime(52, t + 0.055);
    const tg = c.createGain();
    tg.gain.setValueAtTime(0, t);
    tg.gain.linearRampToValueAtTime(0.42, t + 0.004);
    tg.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    thump.connect(tg).connect(out);
    thump.start(t);
    thump.stop(t + 0.095);

    /* --- 中域：破裂の本体（やや長めのノイズ） --- */
    const lenBody = Math.floor(c.sampleRate * 0.1);
    const bufBody = c.createBuffer(1, lenBody, c.sampleRate);
    const bd = bufBody.getChannelData(0);
    for (let i = 0; i < lenBody; i++) {
      const env = (1 - i / lenBody) ** 1.2;
      bd[i] = (Math.random() * 2 - 1) * env;
    }
    const bodySrc = c.createBufferSource();
    bodySrc.buffer = bufBody;
    const bpMid = c.createBiquadFilter();
    bpMid.type = 'bandpass';
    bpMid.frequency.value = 1100;
    bpMid.Q.value = 0.65;
    const bg = c.createGain();
    bg.gain.setValueAtTime(0, t);
    bg.gain.linearRampToValueAtTime(0.72, t + 0.002);
    bg.gain.linearRampToValueAtTime(0.001, t + 0.095);
    bodySrc.connect(bpMid).connect(bg).connect(out);
    bodySrc.start(t);
    bodySrc.stop(t + 0.1);

    /* --- 先端のキンとした破裂 --- */
    const lenSnap = Math.floor(c.sampleRate * 0.035);
    const bufSnap = c.createBuffer(1, lenSnap, c.sampleRate);
    const sd = bufSnap.getChannelData(0);
    for (let i = 0; i < lenSnap; i++) {
      sd[i] = (Math.random() * 2 - 1) * (1 - i / lenSnap) ** 0.35;
    }
    const snapSrc = c.createBufferSource();
    snapSrc.buffer = bufSnap;
    const hp = c.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 1800;
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 9000;
    const sg = c.createGain();
    sg.gain.setValueAtTime(0.55, t);
    sg.gain.linearRampToValueAtTime(0.001, t + 0.032);
    snapSrc.connect(hp).connect(lp).connect(sg).connect(out);
    snapSrc.start(t);
    snapSrc.stop(t + 0.035);

    /* --- メタリックなクリック（周波数落ち） --- */
    const crack = c.createOscillator();
    crack.type = 'square';
    crack.frequency.setValueAtTime(1400, t);
    crack.frequency.exponentialRampToValueAtTime(90, t + 0.045);
    const cg = c.createGain();
    cg.gain.setValueAtTime(0, t);
    cg.gain.linearRampToValueAtTime(0.09, t + 0.002);
    cg.gain.linearRampToValueAtTime(0.0001, t + 0.05);
    const cLp = c.createBiquadFilter();
    cLp.type = 'lowpass';
    cLp.frequency.value = 5200;
    crack.connect(cLp).connect(cg).connect(out);
    crack.start(t);
    crack.stop(t + 0.055);
  } catch {
    /* オーディオ未初期化など */
  }
}
