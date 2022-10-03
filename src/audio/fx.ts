import { Fx, volumeParam, VolumeParam } from './device';

export interface TrackGain extends Fx {
  params: { gain: VolumeParam }
}

export const createTrackGain = (ctx: AudioContext) : TrackGain => {
  const gain = ctx.createGain();

  return {
    name: 'trackGain',
    inputs: [gain],
    outputs: [gain],
    params: {
      gain: volumeParam(gain.gain),
    },
    context: ctx
  };
};


export const createMasterGain = (ctx: AudioContext) : Fx => {
  const compr = ctx.createDynamicsCompressor();
  const gain = ctx.createGain();

  compr.threshold.value = -18;
  compr.knee.value = 12;
  compr.ratio.value = 20;
  compr.attack.value = 0;
  compr.release.value = 0.2;

  compr.connect(gain);

  return {
    name: 'masterGain',
    inputs: [compr],
    outputs: [gain],
    params: {
      gain: gain.gain,
    },
    context: ctx,
  };
};
