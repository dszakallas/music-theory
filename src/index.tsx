import ReactDOM from 'react-dom/client';
import React from 'react';

import {array, range, map} from './iter';

import { createMaster, createAttackReleaseOscillator, createPoly, createSequencer } from './audio';
import { primeToneToFreqScale, eqTemperedToneToFreqScale, diffInCents, numSemitones, standardC, pitchToFreqFromScale } from './tuning';

import type { Sequencer, Track } from './audio';

const root = ReactDOM.createRoot(document.getElementById('root'));

const audioContext = new AudioContext();

const master = createMaster(audioContext);

master.output.connect(audioContext.destination);

const volumeInput = (event) => {
  const volume = sliderValueToVolume(event.currentTarget.value);
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

const baseTone = standardC;

const tetTable = eqTemperedToneToFreqScale(baseTone);

const tetCents = tetTable.map(e => diffInCents(e, baseTone));

type Tuning = {name: string, description: string, tones: Array<number>};

const tunings: Array<Tuning> = [
  {name: '12-TET', description: '', tones: tetTable},
  {name: 'Pythagorean', description: '', tones: primeToneToFreqScale(baseTone, 'pythagorean') },
  {name: '5-limit symmetric No.1', description: '', tones: primeToneToFreqScale(baseTone, '5ls1')},
  {name: '5-limit symmetric No.2', description: '', tones: primeToneToFreqScale(baseTone, '5ls2')},
  {name: '5-limit asymmetric', description: '', tones: primeToneToFreqScale(baseTone, '5la')},
  {name: '7-limit', description: '', tones: primeToneToFreqScale(baseTone, '7l')}
];

const midiC = 48;

const [E, F, Fs, G, Gs, A, Bb, B, c, cs, d, ds,
  e, f, fs, g, gs, a, bb, b, c1, c1s, d1, d1s,
  e1, f1, f1s, g1] = array(map(i => ({ pitch: midiC + 4 + i, velocity: 127 }), range(28)));


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

const pitchToFreq = (i) => (pitch) => pitchToFreqFromScale(pitch, tunings[i].tones);

class InstrumentDoc extends React.Component {
  state: { tuning: number, playing: boolean };
  props: Record<string, never>;
  sequencer: Sequencer;

  constructor(props) {
    super(props);
    this.state = {tuning: 0, playing: false};
    this.sequencer = createSequencer(poly, 120, greenSleeves, audioContext);
  }

  changeTuning(e) {
    const tuning = parseInt(e.currentTarget.value);
    this.setState(() => {
      this.sequencer.setPitchToFreq(pitchToFreq(tuning));
      return {tuning};
    });
  }

  play(e) {
    this.setState((state: {playing: boolean}, props) => {
      if (state.playing)
        this.sequencer.stop();
      else
        this.sequencer.start();
      return {playing: !state.playing};
    });
  }

  render() {
    const i = this.state.tuning;
    const startOctave = 5;
    const startPitch = startOctave * numSemitones;
    return <div>
      <div>
        <button onClick={this.play.bind(this)} aria-pressed={this.state.playing}>Play</button>
      </div>
      {tunings.map((e, j) => (
        <React.Fragment key={j}>
          <input type="radio" name="tuning" value={j} checked={i==j} onChange={this.changeTuning.bind(this)}></input> {e.name}
        </React.Fragment>
      ))}
      <table>
        <thead>
          <tr>
            <th></th>
            <th>Frequency (Hz)</th>
            <th>Cents from 12-TET</th>
          </tr>
        </thead>
        <tbody>
          {array(map(j => (
            <tr key={j}>
              <td><button key={j} id={`note-${j}`} role="switch" aria-checked="false" onClick={() => poly.attack(
                {pitch: j + startPitch, velocity: 127},
                undefined,
                pitchToFreq(i)
              )}>Note {j}</button></td>
              <td>{pitchToFreq(i)(j + startPitch).toFixed(2)}</td>
              <td>{(diffInCents(tunings[i].tones[j], baseTone) - tetCents[j]).toFixed(2)}</td>
            </tr>
          ), range(numSemitones)))}
        </tbody>
      </table>
    </div>;
  }
}

const bodyDoc =
    <div id="body">
      <h1>Music Theory</h1>
      <div>
        Volume
        <input type="range" min="0" max="1" step="0.001" defaultValue={volumeToSliderValue(initialVol)} className="slider" id="volume" onInput={volumeInput}></input>
      </div>
      <InstrumentDoc></InstrumentDoc>
    </div>;

root.render(bodyDoc);
