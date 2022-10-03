import type { TrackGain } from './fx';
import type { AudioDevice, Fx, Instrument } from './device';
import type { MidiClip } from '../audio';

import { createTrackGain } from './fx';
import { createLevel } from './level';

export interface Track extends AudioDevice {
  gain: TrackGain;
}

export interface MidiTrack extends Track {
  instrument: Instrument;
  fx: Array<Fx>;
  clip: MidiClip;
  gain: TrackGain;
}

export const createMidiTrack = (ctx: AudioContext, instrument: Instrument, clip: MidiClip): MidiTrack => {
  const gain = createTrackGain(ctx);
  const level = createLevel(ctx);

  instrument.outputs[0].connect(gain.inputs[0]);
  gain.outputs[0].connect(level);

  return {
    name: 'midi_track',
    params: {},
    outputs: [level],
    instrument,
    fx: [],
    clip,
    gain,
    context: ctx
  };
};
