import { defaultPitchToFreq, PitchToFreq } from '../audio/tuning';
import {
  booleanParam,
  BooleanParam,
  Component,
  CustomParamType,
  FloatParam,
  leaderParam,
  TypedParam,
} from '../component';
import { createMasterMixer } from './fx';
import { bpmParam, Sequencer } from './sequencer';
import { createTrackGroup, Track, TrackGroup } from './track';
import { createTuning, Tuning } from './tuning';

export type Movie = Component<
  {
    playing: BooleanParam;
    bpm: FloatParam;
  },
  {
    masterTrack: TrackGroup;
    masterTuning: Tuning;
  }
>;

export const createMovie = (
  ctx: AudioContext,
  tracks: Array<Track<any>>,
  sequencer: Sequencer,
  pitchToFreq: PitchToFreq = defaultPitchToFreq,
): Movie => {
  const masterTrack = createTrackGroup(ctx, tracks, createMasterMixer);

  const masterTuning = createTuning(pitchToFreq);

  return {
    name: 'master',
    children: {
      masterTrack,
      masterTuning,
    },
    params: {
      playing: leaderParam(booleanParam, false, [sequencer.params.playing]),
      bpm: leaderParam(bpmParam, 120, [sequencer.params.bpm]),
    },
  };
};
