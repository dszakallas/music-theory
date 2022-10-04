import { VolumeDown, VolumeUp } from '@mui/icons-material';
import Button from '@mui/material/Button';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import React from 'react';
import { Movie } from '../audio/movie';
import { handleChange, useParamsState } from './util';

export function Player(props: { movie: Movie }) {
  const { movie } = props;
  const { playing, bpm } = useParamsState(movie.params);
  const { gain } = useParamsState(movie.masterTrack.mixer.params);

  return (
    <div>
      <Stack spacing={2} direction="row" sx={{ mb: 1 }} alignItems="center">
        <Button
          onClick={() => handleChange(playing.set)(null, !playing.value)}
          variant="contained"
        >
          Play
        </Button>
        <VolumeDown />
        <Slider
          id="volume"
          aria-label="Volume"
          min={0}
          max={1}
          step={0.001}
          onChange={handleChange(gain.set)}
          defaultValue={gain.value}
        />
        <VolumeUp />
      </Stack>
    </div>
  );
}
