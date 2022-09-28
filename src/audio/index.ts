import { Clock } from '../clock';
import { scales, pitchToFreq } from '../tuning';
import { booleanParam, Fx, MidiNote } from './device';
import { opaqueParam, leaderParam } from './device';

export const createMaster: (ctx: AudioContext) => Fx = (ctx: AudioContext) => {
  const compr = ctx.createDynamicsCompressor();
  const gain = ctx.createGain();

  compr.threshold.value = -18;
  compr.knee.value = 12;
  compr.ratio.value = 20;
  compr.attack.value = 0;
  compr.release.value = 0.2;

  compr.connect(gain);

  return {
    name: 'master',
    inputs: [compr],
    outputs: [gain],
    params: {
      gain: gain.gain,
    },
  };
};

const sampleAttackRelease = (at, p, rt, s) => {
  const samples = new Array(s);
  const t = at + rt;
  const ds = t / (s - 1);
  const peakS = Math.floor(at / ds);
  for (let i = 0; i < peakS; ++i) {
    samples[i] = p * ((ds * i) / at);
  }
  const rOff = at - ds * peakS;

  for (let i = 0; i < samples.length - peakS; ++i) {
    samples[i + peakS] = Math.min(p, p * (1 - (ds * i - rOff) / rt));
  }
  return samples;
};

export type Beat = number;

export type Note = [Beat, MidiNote, number];

export type SimpleTrack = {
  timeSignature: [number, number]; // should be encoded so that time signature := timeSignature[0] / 2 ^ -1 * timeSignature[1], e.g 6/8 := [6, 3]
  offset: number; // offset start/end by number of notes
  notes: Array<Array<Note>>;
};

export type MidiTrack = Array<Array<[Beat, MidiNote]>>;

const noteIterator = function* (track: MidiTrack, repeat = true) {
  let [r, i, j] = [0, 0, 0];
  do {
    i = 0;
    const numBars = track.length;
    while (i < numBars) {
      j = 0;
      while (j < track[i].length) {
        const [beat, pitch] = track[i][j];
        const ctrl = yield [r * numBars + i, beat, pitch];
        if (ctrl == 'peek') --j;
        ++j;
      }
      ++i;
    }
    ++r;
  } while (repeat);
};

export const defaultPitchToFreq = pitchToFreq(scales['12tet']);

export type Sequencer = {
  start: () => void;
  stop: () => void;
  outputs: Array<AudioNode>;
  setPitchToFreq: any;
};

const simpleTrackToMidiTrack = (track: SimpleTrack) =>
  track.notes.map((bar) => {
    const midiNotes = [];
    for (const [beat, note, length] of bar) {
      midiNotes.push([beat, note]);
      midiNotes.push([beat + length, { pitch: note.pitch }]);
    }
    midiNotes.sort(([a_b, a_n], [b_b, b_n]) => {
      if (a_b < b_b || (a_b === b_b && !a_n.velocity && b_n.velocity)) {
        return -1;
      } else if (a_b > b_b || (a_b === b_b && a_n.velocity && !b_n.velocity)) {
        return 1;
      } else return 0;
    });
    return midiNotes;
  });

// based on the design by Chris Wilson to provide high precision audio scheduling https://github.com/cwilso/metronome
export const createSequencer = (
  instrument,
  bpm: number,
  track: SimpleTrack,
  ctx: AudioContext
) => {
  const lookAhead = 25.0; // how frequently to call scheduler (ms)
  const scheduleAhead = 100.0 / 1000; // how far to schedule ahead (s)

  const clock = new Clock(lookAhead);

  const bps = bpm / 60;

  const numMeasures = track.timeSignature[0];

  const getTimeForPosition = (b, m) => (b * numMeasures + m) / bps;

  const midiTrack = simpleTrackToMidiTrack(track);

  const schedule = () => {
    let t = ctx.currentTime;
    while (t < ctx.currentTime + scheduleAhead) {
      const { done, value } = noteIter.next('peek');
      if (done) {
        _stop();
        break;
      }
      const [b, m, note] = value;
      t = getTimeForPosition(b, m) + startTime;

      if (t >= ctx.currentTime + scheduleAhead) {
        break;
      }
      instrument.onMidi(note, t);
      noteIter.next();
    }
  };

  const _stop = () => {
    if (handle) {
      clock.stop();
      clock.removeTickHandler(handle);
      instrument.stop();
      handle = null;
    }
  };

  const _start = () => {
    if (!handle) {
      noteIter = noteIterator(midiTrack);
      handle = clock.addTickHandler(schedule);
      startTime = ctx.currentTime;
      clock.start();
    }
  };

  let startTime = null;
  let handle = null;
  let noteIter = null;

  return {
    name: 'seq',
    outputs: instrument.outputs,
    params: {
      pitchToFreq: leaderParam(opaqueParam, defaultPitchToFreq, [
        instrument.params.pitchToFreq,
      ]),
      playing: booleanParam({
        get value() {
          return !!handle;
        },
        set value(v) {
          v ? _start() : _stop();
        }
      })
    },

    start() {
      _start();
    },

    stop() {
      _stop();
    },
  };
};
