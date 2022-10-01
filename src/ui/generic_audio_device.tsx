import { Stack } from '@mui/system';
import Slider from '@mui/material/Slider';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Paper from '@mui/material/Paper';
import {
  AudioDevice,
  Param,
  EnumParamType,
  OpaqueParamType,
  BooleanParamType,
  isOfType,
  VolumeParamType,
} from '../audio/device';

import React, { useEffect, Dispatch } from 'react';
import { useState, handleChange } from '../util';

const sliderResolution = 1000;

interface ParamState {
  value: any;
  set: Dispatch<any>;
  effect(): void;
  param: Param<any, any>;
}

const paramState = (param: Param<any, any>): ParamState => ({
  effect() {
    this.param.value = this.value;
  },
  param,
  ...useState(param.defaultValue),
});

export default function GenericAudioDevice(props: {
  audioDevice: AudioDevice;
}) {
  const { audioDevice } = props;
  const paramStates: Array<[string, ParamState]> = Object.entries(
    audioDevice.params
  ).map(([name, param]) => {
    return [name, paramState(param)];
  });

  for (const [_name, paramState] of paramStates) {
    useEffect(paramState.effect.bind(paramState), [paramState.value]);
  }

  return (
    <Paper elevation={4}>
      <span>{audioDevice.name}</span>
      <Stack>
        {paramStates.map(([name, paramState]) => {
          const { param } = paramState;
          let comp = null;
          if (isOfType(param, BooleanParamType)) {
            comp = (
              <ToggleButtonGroup
                value={paramState.value}
                exclusive
                onChange={handleChange(paramState.set, true)}
              >
                <ToggleButton value={true}>{name}</ToggleButton>
              </ToggleButtonGroup>
            );
          } else if (isOfType(param, EnumParamType<[any]>)) {
            comp = (
              <ToggleButtonGroup
                value={paramState.value}
                exclusive
                onChange={handleChange(paramState.set, false)}
              >
                {param.type.values.map((e, j) => (
                  <ToggleButton key={j} value={e}>
                    {e}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            );
          } else if (isOfType(param, VolumeParamType)) {
            const step =
              (param.type.maxValue - param.type.minValue) / sliderResolution;
            comp = (
              <React.Fragment>
                <span>{param.type.minValue.toPrecision(3)}</span>
                <Slider
                  min={param.type.minValue}
                  max={param.type.maxValue}
                  step={step}
                  onChange={handleChange(paramState.set)}
                  value={paramState.value}
                />
                <span>{param.type.maxValue.toPrecision(3)}</span>
              </React.Fragment>
            );
          } else if (isOfType(param, OpaqueParamType)) {
            comp = <span>{param.toString()}</span>;
          } else if (param instanceof AudioParam) {
            const step = (param.maxValue - param.minValue) / sliderResolution;
            comp = (
              <React.Fragment>
                <span>{param.minValue.toPrecision(3)}</span>
                <Slider
                  min={param.minValue}
                  max={param.maxValue}
                  step={step}
                  onChange={handleChange(paramState.set)}
                  value={paramState.value}
                />
                <span>{param.maxValue.toPrecision(3)}</span>
              </React.Fragment>
            );
          } else {
            throw Error('Should not happen!');
          }
          return (
            <Stack spacing={2} direction="row" key={name}>
              <span>{name}</span>
              {comp}
            </Stack>
          );
        })}
      </Stack>
    </Paper>
  );
}
