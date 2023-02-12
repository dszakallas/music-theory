import type { Mixer } from './fx';
import type { Fx, Instrument } from './device';
import type { MidiClip } from '../audio';

import { createMixer } from './fx';
import { CMapT, Component, PMapT } from '../component';
import { EmptyObj } from '../util';

export type Track<C extends CMapT> = Component<EmptyObj, {
  mixer: Mixer,
  [key: `fx/${string}`]: Fx<any>,
} & C>;

export interface MidiTrack extends Track<{
  instrument: Instrument<any>
}> {
  clip: MidiClip;
}

export type TrackGroup = Track<{
  [key: `track/${string}`]: Track<any>
}>;

export const createMidiTrack = <P extends PMapT> (ctx: AudioContext, instrument: Instrument<P>, clip: MidiClip, mkMixer = createMixer): MidiTrack => {
  const mixer = mkMixer(ctx);

  instrument.outputs[0].connect(mixer.inputs[0]);

  return {
    name: 'midi_track',
    params: {},
    children: {
      mixer,
      instrument
    },
    clip,
  };
};

export const createTrackGroup = (ctx: AudioContext, child_tracks: Array<Track<any>>, mkMixer = createMixer): TrackGroup => {
  const mixer = mkMixer(ctx);

  for (const child_track of child_tracks) {
    child_track.children.mixer.outputs[0].connect(mixer.inputs[0]);
  }

  return {
    name: 'track_group',
    params: {},
    children: {
      mixer,
      ...Object.fromEntries(
        child_tracks.map((v, i) => [`track/${i}`, v])
      )
    },
  };
};
