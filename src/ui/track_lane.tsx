import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import React from 'react';
import { Instrument } from '../components/device';
import { Mixer } from '../components/fx';
import { MidiTrack } from '../components/track';
import GenericAudioDevice from './generic_audio_device';
import { ComponentState } from './util';

const renderInstrument = (instrument: ComponentState<any, any, Instrument<any>>) => {
  return <GenericAudioDevice audioDevice={instrument} />;
};

function TrackLaneGain(props: { midiTrack: ComponentState<any, any, MidiTrack> }) {
  const { midiTrack } = props;
  const mixer = midiTrack.children.mixer as ComponentState<any, any, Mixer>;
  return <GenericAudioDevice audioDevice={mixer} />;
}

export default function TrackLane(props: { midiTrack: ComponentState<any, any, MidiTrack> }) {

  const { midiTrack } = props;
  const instrument = midiTrack.children.instrument as ComponentState<any, any, Instrument<any>>;
  const fx = Object.entries(midiTrack.children).filter(([key, cs]) => key.startsWith('fx/'));

  /* eslint-disable react/jsx-key */
  const grid = [
    <TrackLaneGain midiTrack={midiTrack} />,
    ...fx.map(([_, v]) => renderInstrument(v)),
    ...(instrument ? [renderInstrument(instrument)] : [])
  ].map((dev, i) => (<Grid item key={i}>{dev}</Grid>));
  /* eslint-enable react/jsx-key */

  return (
    <Paper elevation={4}>
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
