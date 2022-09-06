import { range, array, map } from './iter';
import { Clock } from './clock';
import { scales, pitchToFreq } from './tuning';

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

const defaultPitchToFreq = pitchToFreq(scales['12tet']);

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
      env.gain.cancelAndHoldAtTime(startT);
      startT += timeToSteal;
      env.gain.setTargetAtTime(0, startT, timeToSteal / 3);
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

export type NoteOn = {
  pitch: number,
  velocity: number
}

export type Beat = number;

export type Note = [Beat, NoteOn];

export type Track = {
  timeSignature: [number, number], // should be encoded so that time signature := timeSignature[0] / 2 ^ -1 * timeSignature[1], e.g 6/8 := [6, 3]
  offset: number // offset start/end by number of notes
  notes: Array<Array<Note>>
}

const noteIterator = function*(track: Track, repeat = true) {
  let [r, i, j] = [0, 0, 0];
  do {
    i = 0;
    const numBars = track.notes.length;
    while(i < numBars) {
      j = 0;
      while(j < track.notes[i].length) {
        const [beat, pitch] = track.notes[i][j];
        const ctrl = yield [r * numBars + i, beat, pitch];
        if (ctrl == 'peek') --j;
        ++j;
      }
      ++i;
    }
    ++r;
  } while(repeat);
};

export type Sequencer = {
  start: () => void,
  stop: () => void,
  outputs: Array<AudioNode>,
  setPitchToFreq: any
};

// based on the design by Chris Wilson to provide high precision audio scheduling https://github.com/cwilso/metronome
export const createSequencer = (instrument, bpm: number, track: Track, ctx: AudioContext) => {
  const lookAhead = 25.0; // how frequently to call scheduler (ms)
  const scheduleAhead = 100.0 / 1000; // how far to schedule ahead (s)

  const clock = new Clock(lookAhead);

  const bps = bpm / 60;

  const numMeasures = track.timeSignature[0];

  const getTimeForPosition = (b, m) => (b * numMeasures + m) / bps;

  const schedule = () => {
    let t = ctx.currentTime;
    while(t < ctx.currentTime + scheduleAhead) {
      const {done, value} = noteIter.next('peek');
      if (done) {
        _stop();
        break;
      }
      const [b, m, noteOn] = value;
      t = getTimeForPosition(b, m) + startTime;

      if(t >= ctx.currentTime + scheduleAhead) {
        break;
      }
      instrument.attack(noteOn, t, pitchToFreq);
      noteIter.next();
    }
  };

  const _stop = () => {
    if (handle) {
      clock.stop();
      clock.removeTickHandler(handle);
      handle = null;
    }
  };

  let startTime = null;
  let handle = null;
  let noteIter = null;
  let pitchToFreq = defaultPitchToFreq;

  return {
    outputs: instrument.outputs,
    setPitchToFreq: (f) => { pitchToFreq = f; },
    start: () => {
      if (!handle) {
        noteIter = noteIterator(track);
        handle = clock.addTickHandler(schedule);
        startTime = ctx.currentTime;
        clock.start();
      }
    },

    stop: () => { _stop(); }
  };
};
