import { defaultPitchToFreq, PitchToFreq } from '../audio/tuning';
import { Component, typedParam, TypedParam } from '../component';
import { EmptyObj } from '../util';

export type PitchToFreqParam = TypedParam<typeof PitchToFreq, PitchToFreq>;

export type Tuning = Component<
  {
    pitchToFreq: PitchToFreqParam;
  },
  EmptyObj
>;

export const pitchToFreqParam = (props: { value: PitchToFreq }) =>
  typedParam(PitchToFreq, props);

export const createTuning = (
  pitchToFreq: PitchToFreq = defaultPitchToFreq
): Tuning => {
  return {
    name: 'tuning',
    children: {},
    params: {
      pitchToFreq: typedParam(PitchToFreq, { value: pitchToFreq }),
    },
  };
};
