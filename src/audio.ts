import { range, array, map } from './iter';

export const createMaster = (ctx: AudioContext) => {
  const compr = ctx.createDynamicsCompressor();
  const gain = ctx.createGain();

  compr.threshold.value = -18;
  compr.knee.value = 12;
  compr.ratio.value = 20;
  compr.attack.value = 0;
  compr.release.value = 0.2;

  compr.connect(gain);

  return {
    input: compr,
    output: gain,
    gain: gain.gain
  };
};


const sampleAttackRelease = (at, p, rt, s) => {
  const samples = new Array(s);
  const t = at + rt;
  const ds = t / (s - 1);
  const peakS = Math.floor(at / ds);
  for (let i = 0; i < peakS; ++i) {
    samples[i] = p * (ds * i / at);
  }
  const rOff = at - (ds * peakS);

  for (let i = 0; i < samples.length - peakS; ++i) {
    samples[i + peakS] = Math.min(p, p * (1 - (ds * i - rOff) / rt));
  }
  return samples;
};

export type AttackReleaseCurve = {
  attackDt: number,
  peakVol: number,
  releaseDt: number
};

const numSamples = 512;
const timeToSteal = 0.01;

export const createAttackReleaseOscillator = (arc: AttackReleaseCurve, ctx: AudioContext) => {
  const {attackDt, releaseDt, peakVol} = arc;
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  const arCurve = sampleAttackRelease(attackDt, peakVol, releaseDt, numSamples);
  env.gain.value = 0;
  osc.connect(env);
  osc.start();

  return {
    output: env,
    attack: (freq: number) => {
      const time = ctx.currentTime;
      env.gain.cancelAndHoldAtTime(time);
      let startT = time;
      if (env.gain.value !== 0) {
        startT = time + timeToSteal;
        env.gain.linearRampToValueAtTime(0, startT - 0.001);
      }
      osc.frequency.setValueAtTime(freq, startT);
      const endDt = (attackDt + releaseDt) / 1000;
      env.gain.setValueCurveAtTime(arCurve, startT, endDt);
    }
  };
};

export const createPoly = function(numVoices, osc, ...args) {
  const voices = array(map(() => osc(...args), range(numVoices)));
  let current = 0;

  return {
    outputs: voices.map(v => v.output),
    attack: (freq) => {
      voices[current].attack(freq);
      current = (current + 1) % numVoices;
    }
  };
};


