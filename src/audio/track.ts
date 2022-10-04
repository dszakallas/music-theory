import type { Mixer } from './fx';
import type { AudioDevice, Fx, Instrument } from './device';
import type { MidiClip } from '../audio';

import { createMixer } from './fx';
import { Component } from '../component';

export interface Track extends Component {
  fx: Array<Fx>;
  mixer: Mixer;
}

export interface MidiTrack extends Track {
  instrument: Instrument;
  clip: MidiClip;
}

export interface TrackGroup extends Track {
  child_tracks: Array<Track>;
}

export const createMidiTrack = (ctx: AudioContext, instrument: Instrument, clip: MidiClip, mkMixer = createMixer): MidiTrack => {
  const mixer = mkMixer(ctx);

  instrument.outputs[0].connect(mixer.inputs[0]);

  return {
    name: 'midi_track',
    params: {},
    instrument,
    fx: [],
    clip,
    mixer
  };
};

export const createTrackGroup = (ctx: AudioContext, child_tracks: Array<Track>, mkMixer = createMixer): TrackGroup => {
  const mixer = mkMixer(ctx);

  for (const child_track of child_tracks) {
    child_track.mixer.outputs[0].connect(mixer.inputs[0]);
  }

  return {
    name: 'track_group',
    params: {},
    fx: [],
    child_tracks: child_tracks,
    mixer
  };
};
