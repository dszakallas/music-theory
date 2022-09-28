import React from 'react';

type InArray<T, X> =
  // See if X is the first element in array T
  T extends readonly [X, ...infer _Rest]
  ? true
  // If not, is X the only element in T?
  : T extends readonly [X]
  ? true
  // No match, check if there's any elements left in T and loop recursive
  : T extends readonly [infer _, ...infer Rest]
  ? InArray<Rest, X>
  // There's nothing left in the array and we found no match
  : false

export type UniqueArray<T> =
  T extends readonly [infer X, ...infer Rest]
  // We've just extracted X from T, having Rest be the remaining values.
  // Let's see if X is in Rest, and if it is, we know we have a duplicate
  ? InArray<Rest, X> extends true
  ? never
  // X is not duplicated, move on to check the next value, and see
  // if that's also unique.
  : readonly [X, ...UniqueArray<Rest>]
  // T did not extend [X, ...Rest], so there's nothing to do - just return T
  : T;

export type AsUnion<T> =
  T extends readonly [infer X, ...infer Rest]
  ? X | AsUnion<Rest>
  : T extends readonly [infer X]
  ? X
  : never;


export type Enum<T> = T extends UniqueArray<infer _> ? AsUnion<T> : never;
export type EnumValues<T> = T extends UniqueArray<infer _> ? T : never;

export const posMod = (n, m) => (n % m + m) % m;

export const handleChange = (setState, nullable=true) => (e, newValue) => {
  if (nullable || newValue != null) {
    setState(newValue);
  }
};

export const useState = (s) => {
  const [value, set] = React.useState(s);
  return {value, set};
};

export const noop = () => { // eslint-disable-line: @typescript-eslint/no-empty-function
};

export function isWritable<T extends Record<string, unknown>>(obj: T, key: keyof T) {
  let desc = null;
  do {
    desc = Object.getOwnPropertyDescriptor(obj, key);
    obj = Object.getPrototypeOf(obj);
  } while (desc == null && obj != null);
  return Boolean(desc.writable);
}
