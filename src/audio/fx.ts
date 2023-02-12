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
