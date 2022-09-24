import { range, array, map } from '../iter';
import { Clock } from '../clock';
import { scales, pitchToFreq } from '../tuning';


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


export type MidiNote = {
  pitch: number,
  velocity: number
};

export type Param = { value: any };

export type Instrument = {
  params: { [name: string]: Param },
  outputs: Array<AudioNode>,
  onMidi: (note: MidiNote, time: number) => void,
  stop: (time: number) => void
};

export type Beat = number;

export type Note = [Beat, MidiNote, number];

export type SimpleTrack = {
  timeSignature: [number, number], // should be encoded so that time signature := timeSignature[0] / 2 ^ -1 * timeSignature[1], e.g 6/8 := [6, 3]
  offset: number // offset start/end by number of notes
  notes: Array<Array<Note>>
}


export type MidiTrack = Array<Array<[Beat, MidiNote]>>

const noteIterator = function*(track: MidiTrack, repeat = true) {
  let [r, i, j] = [0, 0, 0];
  do {
    i = 0;
    const numBars = track.length;
    while(i < numBars) {
      j = 0;
      while(j < track[i].length) {
        const [beat, pitch] = track[i][j];
        const ctrl = yield [r * numBars + i, beat, pitch];
        if (ctrl == 'peek') --j;
        ++j;
      }
      ++i;
    }
    ++r;
  } while(repeat);
};


export const defaultPitchToFreq = pitchToFreq(scales['12tet']);

export const ctrlParam = (followers, defaultValue) => {
  let _value = defaultValue;
  function updateFollowers() {
    for (const follower of followers) {
      follower.value = _value;
    }
  }

  updateFollowers();
  return {
    get value() {
      return _value;
    },
    set value(v) {
      _value = v;
      updateFollowers();
    }
  };
};

export type Sequencer = {
  start: () => void,
  stop: () => void,
  outputs: Array<AudioNode>,
  setPitchToFreq: any
};


const simpleTrackToMidiTrack = (track: SimpleTrack) => track.notes.map(bar => {
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
    } else
      return 0;
  });
  return midiNotes;
});

// based on the design by Chris Wilson to provide high precision audio scheduling https://github.com/cwilso/metronome
export const createSequencer = (instrument, bpm: number, track: SimpleTrack, ctx: AudioContext) => {
  const lookAhead = 25.0; // how frequently to call scheduler (ms)
  const scheduleAhead = 100.0 / 1000; // how far to schedule ahead (s)

  const clock = new Clock(lookAhead);

  const bps = bpm / 60;

  const numMeasures = track.timeSignature[0];

  const getTimeForPosition = (b, m) => (b * numMeasures + m) / bps;

  const midiTrack = simpleTrackToMidiTrack(track);

  const schedule = () => {
    let t = ctx.currentTime;
    while(t < ctx.currentTime + scheduleAhead) {
      const {done, value} = noteIter.next('peek');
      if (done) {
        _stop();
        break;
      }
      const [b, m, note] = value;
      t = getTimeForPosition(b, m) + startTime;

      if(t >= ctx.currentTime + scheduleAhead) {
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

  let startTime = null;
  let handle = null;
  let noteIter = null;

  return {
    outputs: instrument.outputs,
    params: {
      pitchToFreq: ctrlParam([instrument.params.pitchToFreq], defaultPitchToFreq),
    },
    start: () => {
      if (!handle) {
        noteIter = noteIterator(midiTrack);
        handle = clock.addTickHandler(schedule);
        startTime = ctx.currentTime;
        clock.start();
      }
    },

    stop: () => { _stop(); }
  };
};
