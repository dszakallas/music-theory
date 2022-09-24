import type {Ar, Adsr} from './envelope';
import { range, array, map } from '../iter';
import { defaultPitchToFreq, ctrlParam } from '../audio';
import type { MidiNote, Instrument } from '../audio';

const timeToSteal = 0.01;

export const createAdsrOsc: (adsr: Adsr, ctx: AudioContext) => Instrument = (adsr, ctx) => {
  const { attackDt, releaseDt, peakVol, sustainVol, decayDt } = adsr;
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  env.gain.value = 0;
  osc.connect(env);
  osc.start();

  return {
    params: {
      pitchToFreq: { value: defaultPitchToFreq }
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


export const createPoly = function (numVoices: number, osc, ...args) {
  const voices = array(map(() => osc(...args), range(numVoices)));
  let current = 0;

  let pressedNotes: {[key: number]: number} = {};

  return {
    params: {
      pitchToFreq: ctrlParam(voices.map(v => v.params.pitchToFreq), defaultPitchToFreq)
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
