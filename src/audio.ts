import { range, array, map } from './iter';
import { pitchToFreqFromScale, eqTemperedToneToFreqScale, standardC } from './tuning';

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

const timeToSteal = 0.01;

const defaultPitchToFreq = (pitch) => pitchToFreqFromScale(pitch, eqTemperedToneToFreqScale(standardC));

export const createAttackReleaseOscillator = (arc: AttackReleaseCurve, ctx: AudioContext) => {
  const {attackDt, releaseDt, peakVol} = arc;
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  env.gain.value = 0;
  osc.connect(env);
  osc.start();

  return {
    output: env,
    attack: (
      noteOn: NoteOn,
      time: number = undefined,
      pitchToFreq: (number) => number = defaultPitchToFreq
    ) => {
      let startT = time || ctx.currentTime;
      const {pitch} = noteOn;

      if (env.gain.value > 0.01) {
        env.gain.cancelAndHoldAtTime(startT);
        startT += timeToSteal;
        env.gain.setTargetAtTime(0, startT, timeToSteal / 3);
      }
      const freq = pitchToFreq(pitch);
      osc.frequency.setValueAtTime(freq, startT);
      const attackT = startT + attackDt;
      env.gain.setTargetAtTime(peakVol, startT, attackDt / 3);
      env.gain.setTargetAtTime(0, attackT, releaseDt / 3);
    }
  };
};

export const createPoly = function(numVoices, osc, ...args) {
  const voices = array(map(() => osc(...args), range(numVoices)));
  let current = 0;

  return {
    outputs: voices.map(v => v.output),
    attack: (
      noteOn: NoteOn,
      time: number = undefined,
      pitchToFreq: (number) => number = defaultPitchToFreq
    ) => {
      voices[current].attack(noteOn, time, pitchToFreq);
      current = (current + 1) % numVoices;
    }
  };
};

type NoteOn = {
  pitch: number,
  velocity: number
}

type Beat = number;

type Note = [Beat, NoteOn];

const midiC = 48;

const [E, F, Fs, G, Gs, A, Bb, B, c, cs, d, ds,
  e, f, fs, g, gs, a, bb, b, c1, c1s, d1, d1s,
  e1, f1, f1s, g1] = array(map(i => ({ pitch: midiC + 4 + i, velocity: 127 }), range(28)));


const greenSleeves: Track = {
  timeSignature: [12, 4], // 6/8 where 16th is the smallest interval
  offset: 0,
  notes: [
    [ // 0
      [0, A], [0, a], [0, c1],
      [4, d],
      [6, c], [6, c1], [6, e1],
      [9, f1],
      [10, e1]
    ], [ // 1
      [0, G], [0, g], [0, d1],
      [4, b],
      [6, G], [6, d], [6, g],
      [9, a],
      [10, b]
    ]
  ]
};

type Track = {
  timeSignature: [number, number], // should be encoded so that time signature := timeSignature[0] / 2 ^ -1 * timeSignature[1], e.g 6/8 := [6, 3]
  offset: number // offset start/end by number of notes
  notes: Array<Array<Note>>
}


// const sequencer = (instrument, tempo: number, track: Track, ctx: AudioContext) => {
//   const lookahead = 25.0 // how frequently to call scheduler (ms)
//   const scheduleAhead = 250.0 // how far to schedule ahead (ms)

//   const schedule = () => {
//     while(nextNoteTime < ctx.currentTime + scheduleAheadTime * 1000) {
//       scheduleNote();
//       nextNote();
//     }
//   }

//   return {
//     outputs: null,
//     start: () => {
      
//     },

//     stop: () => {
      
//     }
//   }
// }


