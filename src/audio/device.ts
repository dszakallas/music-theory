import type { Enum, EnumValues } from '../util';

export interface TypedParam<TypeTag, T> {
  value: T
  defaultValue: T
  type: TypeTag
}

export class EnumParamType<T> {
  values: EnumValues<T>;
  constructor(values) {
    this.values = values;
  }
}


// Enum params come from a distinct set of values
export interface EnumParam<T> extends TypedParam<EnumParamType<T>, Enum<T>> {
  type: EnumParamType<T>
}

const paramCopy = <TT, T> (type: TT, props: { value: T }) => Object.defineProperties({
  type,
  defaultValue: props.value,
  ...props
}, Object.getOwnPropertyDescriptors(props));

export const enumParam: <T> (values: EnumValues<T>, props: { value: Enum<T> }) => EnumParam<T> = (values, props) => paramCopy(new EnumParamType(values), props);


export class OpaqueParamType {}

// Opaque params are an escape hatch for params we don't want to be controlled
// through a generic interface.
export interface OpaqueParam<T> extends TypedParam<OpaqueParamType, T> {
  type: OpaqueParamType;
}

export const opaqueParam: <T> (props: { value: T }) => OpaqueParam<T> = (props) => paramCopy(new OpaqueParamType(), props);

export type Param<TT, T> = AudioParam | TypedParam<TT, T>;

export type MkParam<TT, T> = (props: { value: T }) => TypedParam<TT, T>;

// A param (leader) that controls other parameters (followers). Followers must be of the same type.
export const leaderParam: <TT, T> (mkParam: MkParam<TT, T>, defaultValue: T, followers: Array<TypedParam<TT, T>>) => TypedParam<TT, T> = (mkParam, defaultValue, followers) => {
  let _value = defaultValue;
  function updateFollowers() {
    for (const follower of followers) {
      follower.value = _value;
    }
  }

  updateFollowers();
  return mkParam({
    get value() {
      return _value;
    },
    set value(v) {
      _value = v;
      updateFollowers();
    }
  });
};

export interface AudioDevice {
  name: string
  params: { [name: string]: Param<any, any> },
  outputs: Array<AudioNode>
}

export type MidiNote = {
  pitch: number,
  velocity: number
};

export interface Instrument extends AudioDevice {
  stop(time: number): void
  onMidi(note: MidiNote, time: number): void
}

export interface Fx extends AudioDevice {
  inputs: Array<AudioNode>
}
