import {
  PauseRounded,
  PlayArrowRounded,
  VolumeDown,
  VolumeUp,
} from '@mui/icons-material';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import IconButton from '@mui/material/IconButton';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import React from 'react';
import { Movie } from '../component/movie';
import { handleChange, useParamsState } from './util';

export function Player(props: { movie: Movie }) {
  const theme = useTheme();
  const mainIconColor = theme.palette.mode === 'dark' ? '#fff' : '#000';
  const lightIconColor =
    theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';

  const { movie } = props;
  const { playing, bpm } = useParamsState(movie.params);
  const { gain } = useParamsState(movie.children.masterTrack.children.mixer.params);

  const bpmInc = 1.1; // +10%

  return (
    <div>
      <Stack spacing={2} direction="row" sx={{ mb: 1 }} alignItems="center">
        <IconButton
          aria-label={playing.value ? 'stop' : 'play'}
          onClick={() => handleChange(playing.set)(null, !playing.value)}
        >
          {!playing.value ? (
            <PlayArrowRounded
              sx={{ fontSize: '3rem' }}
              htmlColor={mainIconColor}
            />
          ) : (
            <PauseRounded sx={{ fontSize: '3rem' }} htmlColor={mainIconColor} />
          )}
        </IconButton>
        <VolumeDown htmlColor={lightIconColor} />
        <Slider
          id="volume"
          aria-label="Volume"
          min={0}
          max={1}
          step={0.001}
          onChange={handleChange(gain.set)}
          value={gain.value}
          sx={{
            color: theme.palette.mode === 'dark' ? '#fff' : 'rgba(0,0,0,0.87)',
            '& .MuiSlider-track': {
              border: 'none',
            },
            '& .MuiSlider-thumb': {
              width: 24,
              height: 24,
              backgroundColor: '#fff',
              '&:before': {
                boxShadow: '0 4px 8px rgba(0,0,0,0.4)',
              },
              '&:hover, &.Mui-focusVisible, &.Mui-active': {
                boxShadow: 'none',
              },
            },
          }}
        />
        <VolumeUp htmlColor={lightIconColor} />
        <Typography>{`${bpm.value.toPrecision(5)} BPM`}</Typography>

        <ButtonGroup
          size="small"
          orientation="vertical"
          aria-label="vertical outlined button group"
        >
          <Button onClick={() => bpm.set(bpm.value * bpmInc) }>+</Button>
          <Button onClick={() => bpm.set(bpm.value * (1 / bpmInc))} >-</Button>
        </ButtonGroup>
      </Stack>
    </div>
  );
}
