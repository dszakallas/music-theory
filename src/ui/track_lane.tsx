import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import React from 'react';
import { Instrument } from '../audio/device';
import { MidiTrack } from '../audio/track';
import GenericAudioDevice from './generic_audio_device';

const renderInstrument = (instrument: Instrument) => {
  return <GenericAudioDevice audioDevice={instrument} />;
};

function TrackLaneGain(props: { midiTrack: MidiTrack }) {
  const { midiTrack } = props;
  return <GenericAudioDevice audioDevice={midiTrack.mixer} />;
}

export default function TrackLane(props: { midiTrack: MidiTrack }) {

  const { midiTrack } = props;
  const { instrument } = midiTrack;

  /* eslint-disable react/jsx-key */
  const grid = [
    <TrackLaneGain midiTrack={midiTrack} />,
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
