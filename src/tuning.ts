import {array, range, map, zip} from './iter';

export const numSemitones = 12;

// using dimished fifths
const primeComponents = {
  pythagorean: [[], [8, -5], [-3, 2], [5, -3], [-6, 4], [2, -1], [10, -6], [-1, 1], [7, -4], [-4, 3], [4, -2], [-7, 5]],
  '5ls1': [[], [4, -1, -1], [-3, 2], [1, 1, -1], [-2, 0, 1], [2, -1], [6, -2, -1], [-1, 1], [3, 0, -1], [0, -1, 1], [4, -2], [-3, 1, 1]],
  '5ls2': [[], [4, -1, -1], [1, -2, 1], [1, 1, -1], [-2, 0, 1], [2, -1], [6, -2, -1], [-1, 1], [3, 0, -1], [0, -1, 1], [0, 2, -1], [-3, 1, 1]],
  '5la': [[], [4, -1, -1], [-3, 2], [1, 1, -1], [-2, 0, 1], [2, -1], [6, -2, -1], [-1, 1], [3, 0, -1], [0, -1, 1], [0, 2, -1], [-3, 1, 1]],
  '7l': [[], [-1, 1, 1, -1], [3, 0, 0, -1], [1, 1, -1], [-2, 0, 1], [2, -1], [1, 0, 1, -1], [-1, 1], [3, 0, -1], [0, -1, 1], [-2, 0, 0, 1], [-3, 1, 1]]
};

const primes = [2, 3, 5, 7, 11, 13, 17];

const primeToneToFreq = (tones, i, base) => {
  let tone = base;
  const primePowers = zip([primes, tones[i]]);
  for (const [prime, power] of primePowers) {
    tone = tone * (prime ** power);
  }
  return tone;
};

export const primeToneToFreqScale = (base, primeScale) => array(map(i => primeToneToFreq(primeComponents[primeScale], i, base), range(numSemitones)));

export const eqTemperedToneToFreq = (i, base) => base * 2 ** (i/numSemitones);

export const eqTemperedToneToFreqScale = (base) => array(map(i => eqTemperedToneToFreq(i, base), range(numSemitones)));

export const diffInCents = (f, b) => 1200 * Math.log2(f / b);

export type MidiPitch = number;

export const pitchToFreqFromScale = (pitch: MidiPitch, scale: Array<number>, startPitch = 48) => {
  const freqPower = Math.floor((pitch - startPitch) / numSemitones);
  const freqBase = scale[(pitch - startPitch) % numSemitones];
  const freq = freqBase * (2 ** freqPower);
  return freq;
};

export const standardC = eqTemperedToneToFreq(3, 110);
