import { enumParam, EnumParam, EnumParamType } from '.';
import { Enum } from '../util';
import { Fx, volumeParam, VolumeParam } from './device';

export type Mixer = Fx<{ gain: VolumeParam }>;

export const createMixer = (ctx: AudioContext): Mixer => {
  const gain = ctx.createGain();

  return {
    name: 'mixer',
    inputs: [gain],
    outputs: [gain],
    children: {},
    params: {
      gain: volumeParam(gain.gain),
    },
    context: ctx
  };
};

export const createMasterMixer = (ctx: AudioContext): Mixer => {
  const compr = ctx.createDynamicsCompressor();
  const gain = ctx.createGain();

  compr.threshold.value = -18;
  compr.knee.value = 12;
  compr.ratio.value = 20;
  compr.attack.value = 0;
  compr.release.value = 0.2;

  compr.connect(gain);

  return {
    name: 'master_mixer',
    inputs: [compr],
    outputs: [gain],
    children: {},
    params: {
      gain: volumeParam(gain.gain),
    },
    context: ctx,
  };
};

export const filterTypeValues = ['lowpass', 'highpass', 'bandpass', 'notch'] as const;

export const filterTypeParamType: EnumParamType<typeof filterTypeValues> = new EnumParamType(filterTypeValues);

export const filterTypeParam = (props: { value: Enum<typeof filterTypeValues> }): EnumParam<typeof filterTypeValues> => enumParam(filterTypeParamType, props);

export type Filter = Fx<{
  type: EnumParam<typeof filterTypeValues>
  frequency: AudioParam,
  q: AudioParam,
  gain: VolumeParam
}>;

export const createFilter = (ctx: AudioContext): Filter => {
  const filter = ctx.createBiquadFilter();
  let _filterType: Enum<typeof filterTypeValues> = 'lowpass';

  return {
    name: 'filter',
    inputs: [filter],
    outputs: [filter],
    children: {},
    params: {
      type: filterTypeParam({
        get value() {
          return _filterType;
        },
        set value(v) {
          _filterType = v;
          filter.type = _filterType;
        }
      }),
      frequency: filter.frequency,
      q: filter.Q,
      gain: volumeParam(filter.gain)
    },
    context: ctx
  };
};
