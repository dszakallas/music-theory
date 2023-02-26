import { Stack } from '@mui/system';
import Slider from '@mui/material/Slider';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Paper from '@mui/material/Paper';
import { AudioDevice, VolumeParamType } from '../component/device';

import React from 'react';
import { ComponentState, handleChange, ParamState, State, useParamsState } from './util';
import LevelMeter from './level_meter';
import Button from '@mui/material/Button';
import { PitchToFreq } from '../audio/tuning';
import { TuningSystem } from './tuning';
import { ViewState } from './view';
import { BooleanParamType, EnumParamType, isOfType } from '../component';

const sliderResolution = 1000;

// make it a registry
const getConfigurationView = (ts: ParamState<any>) => {
  if (isOfType(ts.param, PitchToFreq.constructor as typeof PitchToFreq)) {
    return (
      <TuningSystem pitchToFreq={ts}></TuningSystem>
    );
  }

  return;
};

export default function GenericAudioDevice(props: {
  audioDevice: ComponentState<any, any, AudioDevice<any>>;
  view: ViewState;
}) {
  const { audioDevice, view } = props;

  const params = Object.entries(audioDevice.params);

  const openInMainWindow = (mainWindow) => {
    view.mainWindow.set(mainWindow);
  };

  return (
    <Paper elevation={4}>
      <span>{audioDevice.const.name}</span>
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
                <LevelMeter device={audioDevice.const} />
              </React.Fragment>
            );
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
            const mainWindow = getConfigurationView(ps);
            if (mainWindow) {
              comp = (
                <Button onClick={() => openInMainWindow(mainWindow)}>
                  Open
                </Button>
              );
            } else {
              comp = <span>{param.toString()}</span>;
            }
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
