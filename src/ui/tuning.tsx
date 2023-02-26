import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import React, { useEffect } from 'react';
import { A4, concertPitchFreq, diffInCents, eqTemperedTone, numSemitones, PitchToFreq, scales } from '../audio/tuning';
import { Instrument } from '../components/device';
import { createAdsrOsc, createPoly } from '../components/oscillator';
import { PitchToFreqParam } from '../components/tuning';
import { array, map, range } from '../iter';
import { handleChange, ParamState, useState } from './util';

const refFreqs = [
  { name: '440 Hz (concert pitch)', freq: concertPitchFreq },
  { name: '432 Hz', freq: 432 },
];

type Tuning = { name: string; description: string; tones: Array<number> };

const tunings: Array<Tuning> = [
  { name: '12-TET', description: '', tones: scales['12tet'] },
  { name: 'Pythagorean', description: '', tones: scales['pythagorean'] },
  { name: '5-limit symmetric No.1', description: '', tones: scales['5ls1'] },
  { name: '5-limit symmetric No.2', description: '', tones: scales['5ls2'] },
  { name: '5-limit asymmetric', description: '', tones: scales['5la'] },
  { name: '7-limit', description: '', tones: scales['7l'] },
];

const toneNames = [
  'Unison',
  'Minor second',
  'Major second',
  'Minor third',
  'Major third',
  'Perfect fourth',
  'Tritone',
  'Perfect fifth',
  'Minor sixth',
  'Major sixth',
  'Minor seventh',
  'Major seventh'
];

const pitchNames = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'B♭', 'B'];

export function TuningSystem(props: { pitchToFreq: ParamState<PitchToFreq> }) {

  const { pitchToFreq } = props;

  const tuning = useState(0);
  const refFreq = useState(0);
  const baseTone = useState(0);

  useEffect(() => {
    const baseToneFromA = baseTone.value - 9;
    const baseFreq =
      refFreqs[refFreq.value].freq * eqTemperedTone(baseToneFromA);
    const basePitch = A4 + baseToneFromA;
    const tones = new PitchToFreq(tunings[tuning.value].tones, baseFreq, basePitch);
    pitchToFreq.set(tones);
  }, [baseTone, refFreq, tuning]);

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
}


// create demo instrument
const createDemo = (audioContext: AudioContext): Instrument<any> => {
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

  return poly;
};

export type ToneTableProps = {
  demoInstrument: Instrument<any>,
  baseTone: number,
  tuning: number,
  refFreq: number
};

export function ToneTable(props: ToneTableProps) {
  const { baseTone, tuning, refFreq, demoInstrument } = props;
  const baseToneFromA = baseTone - 9;
  const baseFreq = refFreqs[refFreq].freq * eqTemperedTone(baseToneFromA);
  const basePitch = A4 + baseToneFromA;
  const tones = new PitchToFreq(tunings[tuning].tones, baseFreq, basePitch);
  const etTones = new PitchToFreq(tunings[0].tones, baseFreq, basePitch);
  const startOctave = 5;
  const startPitch = startOctave * numSemitones + baseTone;

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
                        const now = demoInstrument.context.currentTime;
                        demoInstrument.onMidi(
                          { pitch: j + startPitch, velocity: 127 },
                          now
                        );
                        demoInstrument.onMidi(
                          { pitch: j + startPitch, velocity: 0 },
                          now + 0.1
                        );
                      }}
                    >
                      {toneNames[j]}
                    </Button>
                  </TableCell>
                  <TableCell>{pitchNames[(j + baseTone) % 12]}</TableCell>
                  <TableCell>{tones.toFreq(j + startPitch).toFixed(2)}</TableCell>
                  <TableCell>
                    {diffInCents(
                      tones.toFreq(j + startPitch),
                      etTones.toFreq(j + startPitch)
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
