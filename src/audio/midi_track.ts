import type { TrackGain } from './fx';
import type { AudioDevice, Fx, Instrument } from './device';
import type { MidiClip } from '../audio';

import { createTrackGain } from './fx';

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

  instrument.outputs[0].connect(gain.inputs[0]);

  return {
    name: 'midi_track',
    params: {},
    outputs: gain.outputs,
    instrument,
    fx: [],
    clip,
    gain
  };
};
