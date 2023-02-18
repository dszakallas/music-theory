import { booleanParam, BooleanParam, Component, FloatParam, leaderParam } from '../component';
import { createMasterMixer } from './fx';
import { bpmParam, Sequencer } from './sequencer';
import { createTrackGroup, Track, TrackGroup } from './track';

export type Movie = Component<
  {
    playing: BooleanParam,
    bpm: FloatParam
  }, {
    masterTrack: TrackGroup
  }>;

export const createMovie = (ctx: AudioContext, tracks: Array<Track<any>>, sequencer: Sequencer): Movie => {
  const masterTrack = createTrackGroup(ctx, tracks, createMasterMixer);

  return {
    name: 'master',
    children: {
      masterTrack
    },
    params: {
      playing: leaderParam(booleanParam, false, [sequencer.params.playing]),
      bpm: leaderParam(bpmParam, 120, [sequencer.params.bpm]),
    }
  };
};
