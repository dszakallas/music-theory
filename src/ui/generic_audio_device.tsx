import { Stack } from '@mui/system';
import Slider from '@mui/material/Slider';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Paper from '@mui/material/Paper';
import {
  AudioDevice,
  VolumeParamType,
} from '../audio/device';

import React from 'react';
import { handleChange, useParamsState } from './util';
import LevelMeter from './level_meter';
import { BooleanParamType, EnumParamType, isOfType, OpaqueParamType } from '../component';

const sliderResolution = 1000;

export default function GenericAudioDevice(props: {
  audioDevice: AudioDevice;
}) {
  const { audioDevice } = props;

  const params = Object.entries(useParamsState(audioDevice.params));

  return (
    <Paper elevation={4}>
      <span>{audioDevice.name}</span>
      <Stack>
        {params.map(([name, ps]) => {
          const { param } = ps;
          let comp = null;
          if (isOfType(param, BooleanParamType)) {
            comp = (
              <ToggleButtonGroup
                value={ps.value}
                exclusive
                onChange={handleChange(ps.set, true)}
              >
                <ToggleButton value={true}>{name}</ToggleButton>
              </ToggleButtonGroup>
            );
          } else if (isOfType(param, EnumParamType<[any]>)) {
            comp = (
              <ToggleButtonGroup
                value={ps.value}
                exclusive
                onChange={handleChange(ps.set, false)}
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
                  orientation="vertical"
                  onChange={handleChange(ps.set)}
                  value={ps.value}
                />
                <span>{param.type.maxValue.toPrecision(3)}</span>
                <LevelMeter device={audioDevice} />
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
                  orientation="vertical"
                  onChange={handleChange(ps.set)}
                  value={ps.value}
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
