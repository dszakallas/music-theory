import React, { Dispatch, useEffect } from 'react';
import { Param } from '../component';

export const handleChange =
  <T>(setState: Dispatch<T>, nullable = true) =>(e, newValue: T) => {
    if (nullable || newValue != null) {
      setState(newValue);
    }
  };

export type State<T> = {
  value: T;
  set: Dispatch<T>;
};

export const useState = <T>(s: T): State<T> => {
  const [value, set] = React.useState(s);
  return { value, set };
};

export interface ParamState<T> extends State<T> {
  param: Param<T>;
}

export const useParamState = <T>(
  param: Param<T>
): ParamState<T> => {
  const state: State<T> = useState(param.defaultValue);

  useEffect(() => {
    param.value = state.value;
  }, [state.value]);

  return { ...state, param };
};

export const useParamsState = (ps: { [key: string]: Param<any> }) => {
  return Object.fromEntries(
    Object.entries(ps).map(([k, p]) => {
      return [k, useParamState(p)];
    })
  );
};
