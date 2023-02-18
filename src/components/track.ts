import type { Mixer } from './fx';
import type { AudioDevice, Fx, Instrument } from './device';

import { createMixer } from './fx';
import { ChildrenT, Component, ParamsT } from '../component';
import { EmptyObj } from '../util';
import { MidiClip } from './sequencer';

export type Track<C extends ChildrenT> = Component<EmptyObj, {
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

export const createMidiTrack = <P extends ParamsT> (
  ctx: AudioContext,
  instrument: Instrument<P>,
  clip: MidiClip,
  fx: Array<Fx<any>> = [],
  mkMixer = createMixer,
): MidiTrack => {
  const mixer = mkMixer(ctx);

  let prevF: AudioDevice<any> = instrument;
  for (const f of fx) {
    prevF.outputs[0].connect(f.inputs[0]);
    prevF = f;
  }

  prevF.outputs[0].connect(mixer.inputs[0]);

  return {
    name: 'midi_track',
    params: {},
    children: {
      mixer,
      instrument,
      ...Object.fromEntries(fx.map((v, i) => [`fx/${i}`, v]))
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
