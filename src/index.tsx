import ReactDOM from 'react-dom/client';
import React from 'react';

import {array, range, map} from './iter';

import { createMaster, createAttackReleaseOscillator, createPoly } from './audio';

const root = ReactDOM.createRoot(document.getElementById('root'));

const audioContext = new AudioContext();

const master = createMaster(audioContext);

master.output.connect(audioContext.destination);

const volumeInput = (event) => {
  const volume = sliderValueToVolume(event.currentTarget.value);
  master.gain.value = volume;
};

const attackDt = 40;
const peakVol = 1;
const releaseDt = 600;
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

const base = 220;

const numSemitones = 12;

const cents = (f, b) => 1200 * Math.log2(f / b);
const tetNote = (i, base) => base * 2 ** (i/numSemitones);

const tetTable = array(map(i => tetNote(i, base), range(numSemitones)));
const tetCents = tetTable.map(e => cents(e, base));

const pythagoreanQuotients = [
  [0, 0],
  [8, -5],
  [-3, 2],
  [5, -3],
  [-6, 4],
  [2, -1],
  [10, -6], // using diminished fifth, could be [-9, 6] as augmented fourth
  [-1, 1],
  [7, -4],
  [-4, 3],
  [4, -2],
  [-7, 5]
];

const pythagoreanNote = (i, base) => {
  const [e2, e3] = pythagoreanQuotients[i];
  return base * (2 ** e2) * (3 ** e3);
};

type Tuning = {name: string, description: string, tones: Array<number>};

const pythagoreanTable = array(map(i => pythagoreanNote(i, base), range(numSemitones)));

const tunings: Array<Tuning> = [
  {name: '12-TET', description: '', tones: tetTable},
  {name: 'Pythagorean', description: '', tones: pythagoreanTable},
  {name: 'Limit-5', description: '', tones: tetTable}
];

class TuningDoc extends React.Component {
  props: { tunings: Array<Tuning> };
  state: { tuning: number };
  constructor(props) {
    super(props);
    const initialTuning = 0;
    this.state = {tuning: initialTuning};
  }

  changeTuning(e) {
    this.setState({tuning: parseInt(e.currentTarget.value)});
  }

  render() {
    const tunings = this.props.tunings;
    const i = this.state.tuning;
    return <div id="tunings">
      {tunings.map((e, j) => (
        <React.Fragment key={j}>
          <input type="radio" name="tuning" value={j} checked={i==j} onChange={this.changeTuning.bind(this)} ></input> {e.name}
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
              <td><button key={j} id={`note-${j}`} role="switch" aria-checked="false" onClick={() => poly.attack(tunings[i].tones[j])}>Note {j}</button></td>
              <td>{tunings[i].tones[j].toFixed(2)}</td>
              <td>{(cents(tunings[i].tones[j], base) - tetCents[j]).toFixed(2)}</td>
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
      <TuningDoc tunings={tunings}></TuningDoc>
    </div>;

root.render(bodyDoc);
