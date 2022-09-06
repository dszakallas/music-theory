import {array, range, map, iter, zip} from './iter';

export const numSemitones = 12;

// using dimished fifths
const primeComponents = {
  pythagorean: [[], [8, -5], [-3, 2], [5, -3], [-6, 4], [2, -1], [10, -6], [-1, 1], [7, -4], [-4, 3], [4, -2], [-7, 5]],
  '5ls1': [[], [4, -1, -1], [-3, 2], [1, 1, -1], [-2, 0, 1], [2, -1], [6, -2, -1], [-1, 1], [3, 0, -1], [0, -1, 1], [4, -2], [-3, 1, 1]],
  '5ls2': [[], [4, -1, -1], [1, -2, 1], [1, 1, -1], [-2, 0, 1], [2, -1], [6, -2, -1], [-1, 1], [3, 0, -1], [0, -1, 1], [0, 2, -1], [-3, 1, 1]],
  '5la': [[], [4, -1, -1], [-3, 2], [1, 1, -1], [-2, 0, 1], [2, -1], [6, -2, -1], [-1, 1], [3, 0, -1], [0, -1, 1], [0, 2, -1], [-3, 1, 1]],
  '7l': [[], [-1, 1, 1, -1], [3, 0, 0, -1], [1, 1, -1], [-2, 0, 1], [2, -1], [1, 0, 1, -1], [-1, 1], [3, 0, -1], [0, -1, 1], [-2, 0, 0, 1], [-3, 1, 1]]
};

export const toneNames = [
  'Unison',
  'Minor second',
  'Major second',
  'Minor third',
  'Major third',
  'Perfect fourth',
  'Tritone',
  'Perfect fifth',
  'Minor sixth',
  'Major sixth',
  'Minor seventh',
  'Major seventh'
];

export const pitchNames = [
  'C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'B♭', 'B'
];

const primes = [2, 3, 5, 7, 11, 13, 17];

const primeTone = (tones) => (i) => {
  let tone = 1;
  const primePowers = zip([primes, tones[i]]);
  for (const [prime, power] of primePowers) {
    tone = tone * (prime ** power);
  }
  return tone;
};

export const eqTemperedTone = (i) => 2 ** (i/numSemitones);

export const diffInCents = (f, b) => 1200 * Math.log2(f / b);

export type MidiPitch = number;

const scale = (getTone) => array(map(getTone, range(numSemitones)));

export const scales = Object.fromEntries([
  ['12tet', scale(eqTemperedTone)],
  ...map(([k, v]) => [k, scale(primeTone(v))], iter(Object.entries(primeComponents)))
]);

export const standardC = eqTemperedTone(3) * 110;
export const standardPitch = 48; // MIDI number of standardC

const posMod = (n, m) => (n % m + m) % m;

export const pitchToFreq = (scale, referenceFrequency = standardC, referencePitch = standardPitch) => (pitch) => {
  const p = pitch - referencePitch;
  const power = Math.floor(p / numSemitones);
  const tone = scale[posMod(p, numSemitones)];
  return referenceFrequency * tone * (2 ** power);
};

