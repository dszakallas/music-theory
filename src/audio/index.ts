import { WorkerUrl } from 'worker-url';
import { Clock } from '../clock';
import { BooleanParam, booleanParam, Component, leaderParam, OpaqueParam, opaqueParam } from '../component';
import { scales, pitchToFreq } from '../tuning';
import { MidiNote } from './device';
import { MidiTrack } from './track';

export const createAudioContext = async (): Promise<AudioContext> => {
  const ctx = new AudioContext();

  const modules = [
    // these have to look exactly like this, e.g we cannot extract the module path
    // as it will be preprocessed by webpack and replaced with a dynamic resource url.
    // Just copy-paste the whole thing when you add new modules.
    new WorkerUrl(new URL('./level.aw.ts', import.meta.url))
  ];

  await Promise.all(modules.map((m) => ctx.audioWorklet.addModule(m)));

  return ctx;
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

export type MidiClip = {
  timeSignature: [number, number]; // denominator should be encoded by power e.g 6/8 := [6, 3]
  offset: number; // offset start/end by number of notes
  notes: Array<Array<[Beat, MidiNote]>>;
};

const noteIterator = function* (clip: MidiClip, repeat = true) {
  let [r, i, j] = [0, 0, 0];
  do {
    i = 0;
    const numBars = clip.notes.length;
    while (i < numBars) {
      j = 0;
      while (j < clip.notes[i].length) {
        const [beat, pitch] = clip.notes[i][j];
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

export interface Sequencer extends Component {
  params: {
    pitchToFreq: OpaqueParam<(pitch: number) => number>,
    playing: BooleanParam
  }
};

// based on the design by Chris Wilson to provide high precision audio scheduling https://github.com/cwilso/metronome
export const createSequencer = (
  ctx: AudioContext,
  bpm: number,
  midiTrack: MidiTrack
): Sequencer => {
  const { instrument, clip } = midiTrack;
  const lookAhead = 25.0; // how frequently to call scheduler (ms)
  const scheduleAhead = 100.0 / 1000; // how far to schedule ahead (s)

  const clock = new Clock(lookAhead);

  const bps = bpm / 60;

  const numMeasures = clip.timeSignature[0];

  const getTimeForPosition = (b, m) => (b * numMeasures + m) / bps;

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
      noteIter = noteIterator(clip);
      handle = clock.addTickHandler(schedule);
      startTime = ctx.currentTime;
      clock.start();
    }
  };

  let startTime = null;
  let handle = null;
  let noteIter = null;

  return {
    name: 'sequencer',
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
  };
};


