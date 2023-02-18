import type { Enum, EnumValues } from './util';

export interface Param<T> {
  value: T
  defaultValue: T
}

export interface TypedParam<TypeTag, T> extends Param<T> {
  type: TypeTag
}

export type MkParam<TT, T> = (props: { value: T }) => TypedParam<TT, T>;

export const isOfType = <TT, T>(p: Param<T>, tt: { new(...args: any): TT }): p is TypedParam<TT, T> => {
  return 'type' in p && p['type'] instanceof tt;
};

export const typedParam = <TT, T>(type: TT, props: { value: T, [index: string]: any }): TypedParam<TT, T> => Object.defineProperties({
  type,
  defaultValue: props.value,
  ...props
}, Object.getOwnPropertyDescriptors(props));

export class BooleanParamType {}
export const booleanParamType = new BooleanParamType();
export type BooleanParam = TypedParam<BooleanParamType, boolean>;
export const booleanParam = (props: { value: boolean }) : BooleanParam => typedParam(booleanParamType, props);

export class EnumParamType<T> {
  values: EnumValues<T>;
  constructor(values) {
    this.values = values;
  }
}
// Enum params come from a distinct set of values
export type EnumParam<T> = TypedParam<EnumParamType<T>, Enum<T>>;
export const enumParam = <T> (type: EnumParamType<T>, props: { value: Enum<T> }): EnumParam<T> => typedParam(type, props);

export type FloatParam = TypedParam<FloatParamType, number>;
export const floatParam = (type: FloatParamType, props: { value: number }): FloatParam => typedParam(type, props);
export class FloatParamType {
  minValue: number;
  maxValue: number;
  constructor(minValue: number, maxValue: number) {
    this.minValue = minValue;
    this.maxValue = maxValue;
  }
}

// Opaque params are an escape hatch for params we don't want to be controlled
// through a generic interface.
export class OpaqueParamType {}
export type OpaqueParam<T> = TypedParam<OpaqueParamType, T>;
const opaqueParamType = new OpaqueParamType();
export const opaqueParam = <T>(props: { value: T }): OpaqueParam<T> => typedParam(opaqueParamType, props);

// A param (leader) that controls other parameters (followers). Followers must be of the same type.
export const leaderParam = <TT, T>(mkParam: MkParam<TT, T>, defaultValue: T, followers: Array<Param<T>>): TypedParam<TT, T> => {
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


export type ParamsT = { [name: string]: Param<any> }
export type ChildrenT = { [name: string]: Component<any, any> }

export interface Component<P extends ParamsT, C extends ChildrenT> {
  name: string;
  params: P;
  children: C;
};
