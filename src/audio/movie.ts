import { createSequencer, Sequencer } from '.';
import { booleanParam, BooleanParam, Component, floatParam, FloatParam, FloatParamType, leaderParam } from '../component';
import { createMasterMixer } from './fx';
import { createTrackGroup, Track, TrackGroup } from './track';

export interface Movie extends Component {
  params: {
    playing: BooleanParam;
    bpm: FloatParam;
  };
  masterTrack: TrackGroup;
}

export const createMovie = (ctx: AudioContext, tracks: Array<Track>, sequencer: Sequencer): Movie => {
  const masterTrack = createTrackGroup(ctx, tracks, createMasterMixer);

  return {
    name: 'master',
    params: {
      playing: leaderParam(booleanParam, false, [sequencer.params.playing]),
      bpm: leaderParam(floatParam.bind(null, new FloatParamType(1, 999)), 120, [sequencer.params.bpm]),
    },
    masterTrack
  };
};
