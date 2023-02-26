import { Component, FloatParamType, ParamsT, typedParam, TypedParam } from '.';
import { EmptyObj } from '../util';

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

export interface AudioDevice<P extends ParamsT> extends Component<P, EmptyObj> {
  outputs: Array<AudioNode>,
  context: AudioContext
}

export type MidiNote = {
  pitch: number,
  velocity: number
};

export interface Instrument<P extends ParamsT> extends AudioDevice<P> {
  stop(time: number): void
  stop(): void
  onMidi(note: MidiNote, time: number): void
}

export interface Fx<P extends ParamsT> extends AudioDevice<P> {
  inputs: Array<AudioNode>
}
