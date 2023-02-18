import React, { Dispatch, useEffect } from 'react';
import { ChildrenT, Component, Param, ParamsT } from '../component';

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
  useEffect(() => { param.value = state.value; }, [state.value]);
  return { ...state, param };
};

export const useParamsState = (ps: { [key: string]: Param<any> }) => {
  return Object.fromEntries(
    Object.entries(ps).map(([k, p]) => {
      return [k, useParamState(p)];
    })
  );
};


export interface ComponentState<
  P extends ParamsT,
  C extends ChildrenT,
  T extends Component<P, C>
> {
  const: T
  children: { [key: string]: ComponentState<any, any, any> }
  params: { [key: string]: ParamState<any> }
};

export const useComponentState = <
  P extends ParamsT,
  C extends ChildrenT,
  T extends Component<P, C>
  >(component: T): ComponentState<P, C, T> => {
  return {
    const: component,
    children: Object.fromEntries(Object.entries(component.children).map(([k, v]) => [k, useComponentState(v)])),
    params: useParamsState(component.params)
  };
};

