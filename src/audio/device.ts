import { Component, FloatParamType, typedParam, TypedParam } from '../component';

export class VolumeParamType extends FloatParamType {
  constructor() {
    super(0, 1);
  }
}
export const volumeParamType = new VolumeParamType();

export type VolumeParam = TypedParam<VolumeParamType, number>;

export const volumeParam = (audioParam: AudioParam): VolumeParam => typedParam(volumeParamType, {
  audioParam,
  get value() {
    return audioParam.value;
  },
  set value(v) {
    audioParam.value = v;
  }
});

export interface AudioDevice extends Component {
  outputs: Array<AudioNode>,
  context: AudioContext
}

export type MidiNote = {
  pitch: number,
  velocity: number
};

export interface Instrument extends AudioDevice {
  stop(time: number): void
  stop(): void
  onMidi(note: MidiNote, time: number): void
}

export interface Fx extends AudioDevice {
  inputs: Array<AudioNode>
}
