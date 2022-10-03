
export type Level = AudioNode;

export const movingRms = (samples, tav, init = 0) => {
  let y = init;
  for (let i = 0; i < samples.length; ++i) {
    y = (1 - tav) * y + tav * samples[i] * samples[i];
  }
  return y;
};

export const todBFS = (x: number) => {
  return 20 * Math.log(x);
};

export const createLevel = (ctx: AudioContext): AudioNode => {
  return new AudioWorkletNode(ctx, 'level');
};
