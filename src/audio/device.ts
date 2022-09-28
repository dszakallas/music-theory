import type { Enum, EnumValues } from '../util';

export interface TypedParam<TypeTag, T> {
  value: T
  defaultValue: T
  type: TypeTag
}

const typedParam = <TT, T>(type: TT, props: { value: T }) => Object.defineProperties({
  type,
  defaultValue: props.value,
  ...props
}, Object.getOwnPropertyDescriptors(props));

export class BooleanParamType {}

export const booleanParamType = new BooleanParamType();

export type BooleanParam = TypedParam<BooleanParamType, boolean>;

export const booleanParam: (props: { value: boolean }) => BooleanParam = (props) => typedParam(booleanParamType, props);

export class EnumParamType<T> {
  values: EnumValues<T>;
  constructor(values) {
    this.values = values;
  }
}

// Enum params come from a distinct set of values
export type EnumParam<T> = TypedParam<EnumParamType<T>, Enum<T>>;

export const enumParam: <T> (type: EnumParamType<T>, props: { value: Enum<T> }) => EnumParam<T> = (type, props) => typedParam(type, props);

export class OpaqueParamType {}

// Opaque params are an escape hatch for params we don't want to be controlled
// through a generic interface.
export type OpaqueParam<T> = TypedParam<OpaqueParamType, T>;

const opaqueParamType = new OpaqueParamType();

export const opaqueParam: <T> (props: { value: T }) => OpaqueParam<T> = (props) => typedParam(opaqueParamType, props);

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
