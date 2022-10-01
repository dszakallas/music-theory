import { Fx } from './device';

export interface TrackGain extends Fx {
  params: { gain: AudioParam }
}

export const createTrackGain: (ctx: AudioContext) => TrackGain = (ctx: AudioContext) => {
  const gain = ctx.createGain();

  return {
    name: 'trackGain',
    inputs: [gain],
    outputs: [gain],
    params: {
      gain: gain.gain,
    },
  };
};


export const createMasterGain: (ctx: AudioContext) => Fx = (ctx: AudioContext) => {
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
  };
};
