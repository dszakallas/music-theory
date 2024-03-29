import { range, array, map } from '../iter';
import { EnumParam, enumParam, EnumParamType, leaderParam } from '.';
import type { MidiNote, Instrument } from './device';
import type { Enum } from '../util';
import { defaultPitchToFreq } from '../audio/tuning';
import { pitchToFreqParam, PitchToFreqParam } from './tuning';

const timeToSteal = 0.01;

export const waveformValues = ['sine', 'sawtooth', 'square', 'triangle'] as const;
export const waveformParamType: EnumParamType<typeof waveformValues> = new EnumParamType(waveformValues);

export const waveformParam = (props: { value: Enum<typeof waveformValues> }): EnumParam<typeof waveformValues> => enumParam(waveformParamType, props);

export type Adsr = {
  attackDt: number,
  peakVol: number,
  decayDt: number,
  sustainVol: number,
  releaseDt: number
};

export type AdsrOsc = Instrument<{
  waveform: EnumParam<typeof waveformValues>,
  pitchToFreq: PitchToFreqParam
}>;

const sampleAttackRelease = (at, p, rt, s) => {
  const samples = new Array(s);
  const t = at + rt;
  const ds = t / (s - 1);
  const peakS = Math.floor(at / ds);
  for (let i = 0; i < peakS; ++i) {
    samples[i] = p * ((ds * i) / at);
  }
  const rOff = at - ds * peakS;

  for (let i = 0; i < samples.length - peakS; ++i) {
    samples[i + peakS] = Math.min(p, p * (1 - (ds * i - rOff) / rt));
  }
  return samples;
};

export const createAdsrOsc = (ctx: AudioContext, adsr: Adsr): AdsrOsc => {
  const { attackDt, releaseDt, peakVol, sustainVol, decayDt } = adsr;
  const osc = ctx.createOscillator();
  const env = ctx.createGain();

  let _waveform: Enum<typeof waveformValues> = defaultWaveform;

  env.gain.value = 0;
  osc.connect(env);
  osc.type = _waveform;
  osc.start();

  return {
    name: 'osc',
    params: {
      waveform: waveformParam({
        get value() {
          return _waveform;
        },
        set value(v) {
          _waveform = v;
          osc.type = v;
        }
      }),
      pitchToFreq: pitchToFreqParam({ value: defaultPitchToFreq })
    },
    outputs: [env],
    children: {},
    onMidi(note: MidiNote, time: number = undefined) {
      const { pitch, velocity } = note;
      if (velocity) {
        let startT = time || ctx.currentTime;
        env.gain.cancelAndHoldAtTime(startT);
        startT += timeToSteal;
        env.gain.setTargetAtTime(0, startT, timeToSteal / 3);
        const freq = this.params.pitchToFreq.value.toFreq(pitch);
        osc.frequency.setValueAtTime(freq, startT);
        const attackT = startT + attackDt;
        env.gain.setTargetAtTime(peakVol, startT, decayDt / 3);
        env.gain.setTargetAtTime(sustainVol, attackT, decayDt / 3);
      } else {
        this.stop(time);
      }
    },

    stop(time: number = undefined) {
      const startT = time || ctx.currentTime;
      env.gain.cancelAndHoldAtTime(startT);
      env.gain.setTargetAtTime(0, startT, releaseDt / 3);
    },
    context: ctx
  };
};

const defaultWaveform = 'sine';

export function createPoly(ctx: AudioContext, numVoices: number, createOsc, ...args): AdsrOsc {
  const voices = array(map(() => createOsc(ctx, ...args), range(numVoices)));
  const gain = ctx.createGain();
  let current = 0;

  let pressedNotes: {[key: number]: number} = {};

  voices.map(v => v.outputs[0].connect(gain));
  return {
    name: 'poly',
    params: {
      pitchToFreq: leaderParam(pitchToFreqParam, defaultPitchToFreq, voices.map(v => v.params.pitchToFreq)),
      waveform: leaderParam(waveformParam, defaultWaveform, voices.map(v => v.params.waveform))
    },
    outputs: [gain],
    children: {},
    onMidi(note: MidiNote, time: number = undefined) {
      const { pitch, velocity } = note;
      if (velocity) {
        voices[current].onMidi(note, time);
        pressedNotes[pitch] = current;
        current = (current + 1) % numVoices;
      } else {
        voices[pressedNotes[pitch]].onMidi(note, time);
        delete pressedNotes[pitch];
      }
    },
    stop(time: number = undefined) {
      for (const [pitch, voice] of Object.entries(pressedNotes)) {
        voices[voice].onMidi({ pitch: pitch }, time);
      }
      pressedNotes = {};
    },
    context: ctx
  };
}
