import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Collapse from '@mui/material/Collapse';
import React from 'react';
import { Instrument } from '../components/device';
import { Mixer } from '../components/fx';
import { MidiTrack } from '../components/track';
import GenericAudioDevice from './generic_audio_device';
import { ComponentState, useState } from './util';
import Stack from '@mui/material/Stack';
import { ViewState } from './view';

function TrackLaneGain(props: { midiTrack: ComponentState<any, any, MidiTrack>, view: ViewState }) {
  const { midiTrack, view } = props;
  const mixer = midiTrack.children.mixer as ComponentState<any, any, Mixer>;
  return <GenericAudioDevice view={view} audioDevice={mixer} />;
}

function DevicePane(props: any) {
  const collapsed = useState(false);
  return (
    <Stack>
      <Button onClick={() => collapsed.set(!collapsed.value)}>Collapse</Button>
      <Collapse in={!collapsed.value}>
        {props.children}
      </Collapse>
    </Stack>
  );
}

export default function TrackLane(props: { midiTrack: ComponentState<any, any, MidiTrack>, view: ViewState }) {

  const { midiTrack, view } = props;
  const instrument = midiTrack.children.instrument as ComponentState<any, any, Instrument<any>>;
  const fx = Object.entries(midiTrack.children).filter(([key, cs]) => key.startsWith('fx/'));


  const wrapDevice = (d, i: number) => (
    <Grid item key={i}>
      <DevicePane>{d}</DevicePane>
    </Grid>
  );

  const renderInstrument = (instrument: ComponentState<any, any, Instrument<any>>) => {
    return <GenericAudioDevice view={view} audioDevice={instrument} />;
  };

  /* eslint-disable react/jsx-key */
  const grid = [
    <TrackLaneGain midiTrack={midiTrack} view={view} />,
    ...fx.map(([_, v]) => renderInstrument(v)),
    ...(instrument ? [renderInstrument(instrument)] : [])
  ].map(wrapDevice);
  /* eslint-enable react/jsx-key */

  return (
    <Paper elevation={4}>
      <div>
        Track name
      </div>
      <Grid
        container
        spacing={2}
        direction="row"
        justifyContent="flex-start"
        alignItems="flex-start"
      >
        { grid }
      </Grid>
    </Paper>
  );
}
