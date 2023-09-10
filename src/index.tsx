import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

import ReactDOM from 'react-dom/client';
import React from 'react';

import { array, range, map } from './iter';

import { createAudioContext } from './audio';
import { createPoly, createAdsrOsc } from './component/oscillator';
import { A4 } from './audio/tuning';

import { createSequencer, MidiClip } from './component/sequencer';
import { useComponentState } from './ui/util';
import TrackLane from './ui/track_lane';
import { Player } from './ui/player';
import { createMidiTrack, MidiTrack } from './component/track';
import { createMovie } from './component/movie';
import { createFilter } from './component/fx';
import MainWindow, { useViewState } from './ui/view';
import Grid from '@mui/material/Grid';

import { createTheme, ThemeProvider, styled } from '@mui/material/styles';

import CssBaseline from '@mui/material/CssBaseline';

const theme = createTheme({
  palette: {
    mode: 'dark',
  },
});

const root = ReactDOM.createRoot(document.getElementById('root'));

const audioContext = await createAudioContext();

const [
  E,
  F,
  Fs,
  G,
  Gs,
  A,
  Bb,
  B,
  c,
  cs,
  d,
  ds,
  e,
  f,
  fs,
  g,
  gs,
  a,
  bb,
  b,
  c1,
  c1s,
  d1,
  d1s,
  e1,
  f1,
  f1s,
  g1,
] = array(map((i) => ({ pitch: A4 - 17 + i, velocity: 127 }), range(28)));

const convertNotes = (notes) =>
  notes.map((bar) => {
    const midinotes = [];
    for (const [beat, note, length] of bar) {
      midinotes.push([beat, note]);
      midinotes.push([beat + length, { pitch: note.pitch }]);
    }
    midinotes.sort(([a_b, a_n], [b_b, b_n]) => {
      if (a_b < b_b || (a_b === b_b && !a_n.velocity && b_n.velocity)) {
        return -1;
      } else if (a_b > b_b || (a_b === b_b && a_n.velocity && !b_n.velocity)) {
        return 1;
      } else return 0;
    });
    return midinotes;
  });

const greenSleeves: MidiClip = {
  timeSignature: [6, 3], // 6/8
  offset: 0,
  notes: convertNotes([
    [
      // 0
      [0, A, 3],
      [0, a, 2],
      [0, c1, 2],
      [2, d1, 1],
      [3, c, 3],
      [3, c1, 1.5],
      [3, e1, 1.5],
      [4.5, f1, 0.5],
      [5, e1, 1],
    ],
    [
      // 1
      [0, G, 3],
      [0, g, 2],
      [0, d1, 2],
      [2, b, 1],
      [3, G, 3],
      [3, d, 1.5],
      [3, g, 1.5],
      [4.5, a, 0.5],
      [5, b, 1],
    ],
    [
      [0, A, 3],
      [0, a, 2],
      [0, c1, 2],
      [2, a, 1],
      [3, A, 3],
      [3, a, 1.5],
      [4.5, g, 0.5],
      [5, a, 1],
    ],
    [
      [0, E, 6],
      [0, g, 2],
      [0, b, 2],
      [2, g, 1],
      [3, e, 2],
      [5, a, 1],
    ],
  ]),
};

const attackDt = 0.06;
const decayDt = 0.12;
const sustainVol = 0.1;
const peakVol = 1;
const releaseDt = 0.6;
const oscillatorVoices = 4;

const poly = createPoly(audioContext, oscillatorVoices, createAdsrOsc, {
  attackDt,
  releaseDt,
  peakVol,
  decayDt,
  sustainVol,
});

const greenSleevesTrack = createMidiTrack(audioContext, poly, greenSleeves, [
  createFilter(audioContext),
]);

const sequencer = createSequencer(audioContext, 120, greenSleevesTrack);

const movie = createMovie(audioContext, [greenSleevesTrack], sequencer);

movie.children.masterTrack.children.mixer.outputs[0].connect(
  audioContext.destination
);

const Widget = styled('div')(({ theme }) => ({
  padding: 16,
  borderRadius: 16,
  width: 600,
  maxWidth: '100%',
  margin: 'auto',
  position: 'relative',
  zIndex: 1,
  backgroundColor:
    theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.4)',
  backdropFilter: 'blur(40px)',
}));

function TrackChooser(props: any) {
  return <input type="file" />;
}

const Root = () => {
  const view = useViewState();

  const midiTrackComp = useComponentState(
    movie.children.masterTrack.children['track/0'] as MidiTrack
  );
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Grid container direction="column" id="body" spacing={2}>
        <Grid item>
          <Widget>
            <Player movie={movie}></Player>
          </Widget>
        </Grid>
        <Grid item>
          <MainWindow view={view} />
        </Grid>
        <Grid item>
          <TrackLane midiTrack={midiTrackComp} view={view} />
        </Grid>
      </Grid>
    </ThemeProvider>
  );
};

root.render(<Root />);
