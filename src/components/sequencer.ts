import { defaultPitchToFreq, PitchToFreq } from '../audio/tuning';
import { Clock } from '../clock';
import {
  booleanParam,
  BooleanParam,
  Component,
  floatParam,
  FloatParam,
  FloatParamType,
  leaderParam,
} from '../component';
import { EmptyObj } from '../util';
import { MidiNote } from './device';
import { MidiTrack } from './track';
import { pitchToFreqParam, PitchToFreqParam } from './tuning';

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

export type Sequencer = Component<
  {
    pitchToFreq: PitchToFreqParam;
    bpm: FloatParam;
    playing: BooleanParam;
  },
  EmptyObj
>;

export const bpmParam = (p: { value: number }) =>
  floatParam(new FloatParamType(1, 999), p);

// based on the design by Chris Wilson to provide high precision audio scheduling https://github.com/cwilso/metronome
export const createSequencer = (
  ctx: AudioContext,
  defaultBpm: number,
  midiTrack: MidiTrack
): Sequencer => {
  const { clip } = midiTrack;
  const { instrument } = midiTrack.children;
  const lookAhead = 25.0; // how frequently to call scheduler (ms)
  const scheduleAhead = 100.0 / 1000; // how far to schedule ahead (s)

  const clock = new Clock(lookAhead);

  const bpm = bpmParam({ value: defaultBpm });

  const numMeasures = clip.timeSignature[0];

  const schedule = () => {
    const bps = bpm.value / 60;
    const startT = ctx.currentTime;
    const startB = lastT ? (startT - lastT) * bps + lastB : 0;
    let t = startT;
    while (t < startT + scheduleAhead) {
      const { done, value } = noteIter.next('peek');
      if (done) {
        stop();
        break;
      }
      const [b, m, note] = value;
      const noteB = b * numMeasures + m;
      t = (noteB - startB) / bps + startT;

      if (t >= ctx.currentTime + scheduleAhead) {
        break;
      }
      [lastT, lastB] = [t, noteB];
      instrument.onMidi(note, t);
      noteIter.next();
    }
  };

  const stop = () => {
    if (handle) {
      clock.stop();
      instrument.stop();
      [lastT, lastB] = [null, null];
      handle = null;
    }
  };

  const start = () => {
    if (!handle) {
      noteIter = noteIterator(clip);
      handle = clock.addTickHandler(schedule);
      clock.start();
    }
  };

  let [lastT, lastB] = [null, null];
  let handle = null;
  let noteIter = null;

  return {
    name: 'sequencer',
    children: {},
    params: {
      pitchToFreq: leaderParam(pitchToFreqParam, defaultPitchToFreq, [
        instrument.params.pitchToFreq,
      ]),
      bpm,
      playing: booleanParam({
        get value() {
          return !!handle;
        },
        set value(v) {
          v ? start() : stop();
        },
      }),
    },
  };
};
