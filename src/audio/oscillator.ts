import type {Ar, Adsr} from './envelope';
import { range, array, map } from '../iter';
import { enumParam, EnumParamType, leaderParam, opaqueParam } from './device';
import type { MidiNote, Instrument, EnumParam } from './device';
import { defaultPitchToFreq } from '../audio';
import type { Enum } from '../util';

const timeToSteal = 0.01;

export const waveformValues = ['sine', 'sawtooth', 'square', 'triangle'] as const;
export const waveformParamType: EnumParamType<typeof waveformValues> = new EnumParamType(waveformValues);

export const waveformParam: (props: { value: Enum<typeof waveformValues> }) => EnumParam<typeof waveformValues> = (props) => enumParam(waveformParamType, props);

export const createAdsrOsc: (adsr: Adsr, ctx: AudioContext) => Instrument = (adsr, ctx) => {
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
      pitchToFreq: opaqueParam({ value: defaultPitchToFreq })
    },
    outputs: [env],
    onMidi(note: MidiNote, time: number = undefined) {
      const { pitch, velocity } = note;
      if (velocity) {
        let startT = time || ctx.currentTime;
        env.gain.cancelAndHoldAtTime(startT);
        startT += timeToSteal;
        env.gain.setTargetAtTime(0, startT, timeToSteal / 3);
        const freq = this.params.pitchToFreq.value(pitch);
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
      env.gain.setTargetAtTime(0, startT, releaseDt / 3);
    }
  };
};

const defaultWaveform = 'sine';

export const createPoly: (numVoices: number, createOsc, ...args) => Instrument = function(numVoices: number, createOsc, ...args) {
  const voices = array(map(() => createOsc(...args), range(numVoices)));
  let current = 0;

  let pressedNotes: {[key: number]: number} = {};

  return {
    name: 'poly',
    params: {
      pitchToFreq: leaderParam(opaqueParam, defaultPitchToFreq, voices.map(v => v.params.pitchToFreq)),
      waveform: leaderParam(waveformParam, defaultWaveform, voices.map(v => v.params.waveform))
    },
    outputs: voices.flatMap(v => v.outputs),
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
    }
  };
};
