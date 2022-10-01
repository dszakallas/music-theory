import type { TrackGain } from './fx';
import type { Fx, Instrument } from './device';
import type { MidiClip } from '../audio';

import { createTrackGain } from './fx';

export interface Track {
  gain: TrackGain;
}

export interface MidiTrack extends Track {
  instrument: Instrument;
  fx: Array<Fx>;
  clip: MidiClip;
  gain: TrackGain;
}

export const createMidiTrack: (instrument: Instrument, clip: MidiClip, ctx: AudioContext) => MidiTrack = (instrument, clip, ctx) => {
  const gain = createTrackGain(ctx);

  return {
    instrument,
    fx: [],
    clip,
    gain
  };
};
