import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

import ReactDOM from 'react-dom/client';
import React, {useEffect} from 'react';
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


import {array, range, map} from './iter';

import { createMaster, createAttackReleaseOscillator, createPoly, createSequencer } from './audio';
import { diffInCents, numSemitones, scales, pitchToFreq, toneNames, pitchNames, eqTemperedTone, concertPitchFreq, A4 } from './tuning';

import type { Sequencer, Track } from './audio';
import { handleChange, useState } from './util';

const root = ReactDOM.createRoot(document.getElementById('root'));

const audioContext = new AudioContext();

const master = createMaster(audioContext);

master.output.connect(audioContext.destination);

const volumeInput = (event, newValue: number) => {
  const volume = sliderValueToVolume(newValue);
  master.gain.value = volume;
};

const attackDt = 0.06;
const peakVol = 1;
const releaseDt = 0.6;
const oscillatorVoices = 4;

const poly = createPoly(oscillatorVoices, createAttackReleaseOscillator, {attackDt, releaseDt, peakVol}, audioContext);

poly.outputs.map(o => o.connect(master.input));

const maxVol = 1.0;
const minVol = 0.0;
const initialVol = 1.0;

const sliderValueToVolume = v => {
  return minVol + v * (maxVol - minVol);
};

const volumeToSliderValue = v => {
  return (v - minVol) / (maxVol - minVol);
};

master.gain.value = initialVol;

type Tuning = {name: string, description: string, tones: Array<number>};

const tunings: Array<Tuning> = [
  {name: '12-TET', description: '', tones: scales['12tet'] },
  {name: 'Pythagorean', description: '', tones: scales['pythagorean'] },
  {name: '5-limit symmetric No.1', description: '', tones: scales['5ls1']},
  {name: '5-limit symmetric No.2', description: '', tones: scales['5ls2']},
  {name: '5-limit asymmetric', description: '', tones: scales['5la']},
  {name: '7-limit', description: '', tones: scales['7l']}
];

const refFreqs = [
  {name: '440 Hz (concert pitch)', freq: concertPitchFreq},
  {name: '432 Hz', freq: 432}
];

const [E, F, Fs, G, Gs, A, Bb, B, c, cs, d, ds,
  e, f, fs, g, gs, a, bb, b, c1, c1s, d1, d1s,
  e1, f1, f1s, g1] = array(map(i => ({ pitch: A4 - 17 + i, velocity: 127 }), range(28)));


const greenSleeves: Track = {
  timeSignature: [6, 3], // 6/8 where
  offset: 0,
  notes: [
    [ // 0
      [0, A], [0, a], [0, c1],
      [2, d1],
      [3, c], [3, c1], [3, e1],
      [4.5, f1],
      [5, e1]
    ], [ // 1
      [0, G], [0, g], [0, d1],
      [2, b],
      [3, G], [3, d], [3, g],
      [4.5, a],
      [5, b]
    ], [
      [0, A], [0, a], [0, c1],
      [2, a],
      [3, A], [3, a],
      [4.5, g],
      [5, a]
    ], [
      [0, E], [0, g], [0, b],
      [2, g],
      [3, e],
      [5, a]
    ]
  ]
};

const TuningSystemDoc = (props: { baseTone, tuning, refFreq }) => {
  const { baseTone, tuning, refFreq } = props;
  return <div>
    <div>
      Tonic root:
      <ToggleButtonGroup
        value={baseTone.value}
        exclusive
        onChange={handleChange(baseTone.set)}
        aria-label="baseTone"
      >
        {pitchNames.map((e, j) => (
          <ToggleButton key={j} value={j}>{e}</ToggleButton>
        ))}
      </ToggleButtonGroup>
    </div>
    <div>
      Reference frequency for A:
      <ToggleButtonGroup
        value={refFreq.value}
        exclusive
        onChange={handleChange(refFreq.set)}
        aria-label="reference frequency"
      >
        {refFreqs.map((e, j) => (
          <ToggleButton key={j} value={j}>{e.name}</ToggleButton>
        ))}
      </ToggleButtonGroup>
    </div>
    <div>
      Tuning system:

      <ToggleButtonGroup
        value={tuning.value}
        exclusive
        onChange={handleChange(tuning.set)}
        aria-label="baseTone"
      >
        {tunings.map((e, j) => (
          <ToggleButton key={j} value={j}>{e.name}</ToggleButton>
        ))}
      </ToggleButtonGroup>
    </div>
  </div>;
};

const ToneTableDoc = (props: { baseTone, tuning, refFreq }) => {
  const { baseTone, tuning, refFreq } = props;
  const baseToneFromA = baseTone.value - 9;
  const baseFreq = refFreqs[refFreq.value].freq * eqTemperedTone(baseToneFromA);
  const basePitch = A4 + baseToneFromA;
  const tones = pitchToFreq(tunings[tuning.value].tones, baseFreq, basePitch);
  const etTones = pitchToFreq(tunings[0].tones, baseFreq, basePitch);
  const startOctave = 5;
  const startPitch = startOctave * numSemitones + baseTone.value;

  return <TableContainer component={Paper}>
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
        {array(map(j => (
          <TableRow key={j}>
            <TableCell><Button key={j} id={`note-${j}`} role="switch" variant="contained" onClick={() => poly.attack(
              {pitch: j + startPitch, velocity: 127},
              undefined,
              tones
            )}>{toneNames[j]}</Button></TableCell>
            <TableCell>{pitchNames[(j + baseTone.value) % 12]}</TableCell>
            <TableCell>{tones(j + startPitch).toFixed(2)}</TableCell>
            <TableCell>{diffInCents(tones(j + startPitch), etTones(j + startPitch)).toFixed(2)}</TableCell>
          </TableRow>
        ), range(numSemitones)))}
      </TableBody>
    </Table>
  </TableContainer>;
};

const PlayerDoc = (props: { playing }) => {
  const { playing } = props;

  return <div>
    <Stack spacing={2} direction="row" sx={{ mb: 1 }} alignItems="center">
      <Button onClick={() => handleChange(playing.set)(null, !playing.value)} variant="contained">Play</Button>
      <VolumeDown />
      <Slider id="volume" aria-label="Volume" min={0} max={1} step={0.001} onChange={volumeInput} defaultValue={volumeToSliderValue(initialVol)} />
      <VolumeUp />
    </Stack>
  </div>;
};


const sequencer = createSequencer(poly, 120, greenSleeves, audioContext);

const BodyDoc = () => {
  const tuning = useState(0);
  const refFreq = useState(0);
  const baseTone = useState(0);
  const playing = useState(false);

  useEffect(() => {
    playing.value ? sequencer.start() : sequencer.stop();
  }, [playing.value]);


  useEffect(() => {
    const baseToneFromA = baseTone.value - 9;
    const baseFreq = refFreqs[refFreq.value].freq * eqTemperedTone(baseToneFromA);
    const basePitch = A4 + baseToneFromA;
    const tones = pitchToFreq(tunings[tuning.value].tones, baseFreq, basePitch);
    sequencer.setPitchToFreq(tones);
  }, [baseTone, refFreq, tuning]);

  return <div id="body">
    <h1>Music Theory</h1>
    <PlayerDoc playing={playing}></PlayerDoc>
    <TuningSystemDoc tuning={tuning} baseTone={baseTone} refFreq={refFreq}/>
    <ToneTableDoc tuning={tuning} baseTone={baseTone} refFreq={refFreq}/>
  </div>;
};

root.render(<BodyDoc />);
