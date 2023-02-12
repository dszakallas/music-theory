import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

import ReactDOM from 'react-dom/client';
import React, { useEffect } from 'react';
import Button from '@mui/material/Button';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Slider from '@mui/material/Slider';
import { VolumeUp, VolumeDown } from '@mui/icons-material';

import { array, range, map } from './iter';

import { createAudioContext, createSequencer } from './audio';
import { createPoly, createAdsrOsc, waveformValues } from './audio/oscillator';
import {
  diffInCents,
  numSemitones,
  scales,
  pitchToFreq,
  toneNames,
  pitchNames,
  eqTemperedTone,
  concertPitchFreq,
  A4,
} from './tuning';

import GenericAudioDevice from './ui/generic_audio_device';

import type { MidiClip } from './audio';
import { handleChange, useState, useComponentState, ComponentState } from './ui/util';
import { createMidiTrack, MidiTrack } from './audio/track';
import TrackLane from './ui/track_lane';
import { createMovie } from './audio/movie';
import { Player } from './ui/player';
import { styled, useTheme } from '@mui/material/styles';
import { AudioDevice } from './audio/device';

const root = ReactDOM.createRoot(document.getElementById('root'));

const audioContext = await createAudioContext();

type Tuning = { name: string; description: string; tones: Array<number> };

const tunings: Array<Tuning> = [
  { name: '12-TET', description: '', tones: scales['12tet'] },
  { name: 'Pythagorean', description: '', tones: scales['pythagorean'] },
  { name: '5-limit symmetric No.1', description: '', tones: scales['5ls1'] },
  { name: '5-limit symmetric No.2', description: '', tones: scales['5ls2'] },
  { name: '5-limit asymmetric', description: '', tones: scales['5la'] },
  { name: '7-limit', description: '', tones: scales['7l'] },
];

const refFreqs = [
  { name: '440 Hz (concert pitch)', freq: concertPitchFreq },
  { name: '432 Hz', freq: 432 },
];

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
  timeSignature: [6, 3], // 6/8 where
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

const TuningSystemDoc = (props: { baseTone; tuning; refFreq }) => {
  const { baseTone, tuning, refFreq } = props;
  return (
    <div>
      <div>
        Tonic root:
        <ToggleButtonGroup
          value={baseTone.value}
          exclusive
          onChange={handleChange(baseTone.set, false)}
          aria-label="baseTone"
        >
          {pitchNames.map((e, j) => (
            <ToggleButton key={j} value={j}>
              {e}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </div>
      <div>
        Reference frequency for A:
        <ToggleButtonGroup
          value={refFreq.value}
          exclusive
          onChange={handleChange(refFreq.set, false)}
          aria-label="reference frequency"
        >
          {refFreqs.map((e, j) => (
            <ToggleButton key={j} value={j}>
              {e.name}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </div>
      <div>
        Tuning system:
        <ToggleButtonGroup
          value={tuning.value}
          exclusive
          onChange={handleChange(tuning.set, false)}
          aria-label="baseTone"
        >
          {tunings.map((e, j) => (
            <ToggleButton key={j} value={j}>
              {e.name}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </div>
    </div>
  );
};

const ToneTableDoc = (props: { baseTone; tuning; refFreq }) => {
  const { baseTone, tuning, refFreq } = props;
  const baseToneFromA = baseTone.value - 9;
  const baseFreq = refFreqs[refFreq.value].freq * eqTemperedTone(baseToneFromA);
  const basePitch = A4 + baseToneFromA;
  const tones = pitchToFreq(tunings[tuning.value].tones, baseFreq, basePitch);
  const etTones = pitchToFreq(tunings[0].tones, baseFreq, basePitch);
  const startOctave = 5;
  const startPitch = startOctave * numSemitones + baseTone.value;

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell></TableCell>
            <TableCell>Pitch</TableCell>
            <TableCell>Frequency (Hz)</TableCell>
            <TableCell>Cents from 12-TET</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {array(
            map(
              (j) => (
                <TableRow key={j}>
                  <TableCell>
                    <Button
                      key={j}
                      id={`note-${j}`}
                      role="switch"
                      variant="contained"
                      onClick={() => {
                        const now = audioContext.currentTime;
                        poly.onMidi(
                          { pitch: j + startPitch, velocity: 127 },
                          now
                        );
                        poly.onMidi(
                          { pitch: j + startPitch, velocity: 0 },
                          now + 0.1
                        );
                      }}
                    >
                      {toneNames[j]}
                    </Button>
                  </TableCell>
                  <TableCell>{pitchNames[(j + baseTone.value) % 12]}</TableCell>
                  <TableCell>{tones(j + startPitch).toFixed(2)}</TableCell>
                  <TableCell>
                    {diffInCents(
                      tones(j + startPitch),
                      etTones(j + startPitch)
                    ).toFixed(2)}
                  </TableCell>
                </TableRow>
              ),
              range(numSemitones)
            )
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
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

const greenSleevesTrack = createMidiTrack(audioContext, poly, greenSleeves);

const sequencer = createSequencer(audioContext, 120, greenSleevesTrack);

const movie = createMovie(audioContext, [greenSleevesTrack], sequencer);

movie.children.masterTrack.children.mixer.outputs[0].connect(audioContext.destination);

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

const BodyDoc = () => {
  const theme = useTheme();
  const tuning = useState(0);
  const refFreq = useState(0);
  const baseTone = useState(0);


  const mainIconColor = theme.palette.mode === 'dark' ? '#fff' : '#000';

  useEffect(() => {
    const baseToneFromA = baseTone.value - 9;
    const baseFreq =
      refFreqs[refFreq.value].freq * eqTemperedTone(baseToneFromA);
    const basePitch = A4 + baseToneFromA;
    const tones = pitchToFreq(tunings[tuning.value].tones, baseFreq, basePitch);
    sequencer.params.pitchToFreq.value = tones;
  }, [baseTone, refFreq, tuning]);

  const midiTrackComp = useComponentState(movie.children.masterTrack.children['track/0'] as MidiTrack);
  console.log(midiTrackComp);
  return (
    <div id="body">
      <Widget>
        <Player movie={movie}></Player>
      </Widget>
      <TrackLane midiTrack={midiTrackComp} />
      <GenericAudioDevice audioDevice={midiTrackComp.children.instrument as ComponentState<any, any, AudioDevice<any>>}></GenericAudioDevice>
      <TuningSystemDoc tuning={tuning} baseTone={baseTone} refFreq={refFreq} />
      <ToneTableDoc tuning={tuning} baseTone={baseTone} refFreq={refFreq} />
    </div>
  );
};

root.render(<BodyDoc />);
