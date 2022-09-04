import ReactDOM from 'react-dom/client';
import React from 'react';

import {array, range, map} from './iter';

import { createMaster, createAttackReleaseOscillator, createPoly } from './audio';
import { primeToneToFreqScale, eqTemperedToneToFreqScale, diffInCents, numSemitones, standardC, pitchToFreqFromScale } from './tuning';

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
const oscillatorVoices = 1;

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

class InstrumentDoc extends React.Component {
  state: { tuning: number };
  props: Record<string, never>;

  constructor(props) {
    super(props);
    this.state = {tuning: 0};
  }

  changeTuning(e) {
    this.setState({tuning: parseInt(e.currentTarget.value)});
  }

  pitchToFreq(pitch) {
    return pitchToFreqFromScale(pitch, tunings[this.state.tuning].tones);
  }

  render() {
    const i = this.state.tuning;
    const startOctave = 5;
    const startPitch = startOctave * numSemitones;
    return <div>
      <PlayerDoc tuning={i}></PlayerDoc>
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
                this.pitchToFreq.bind(this)
              )}>Note {j}</button></td>
              <td>{this.pitchToFreq(j + startPitch).toFixed(2)}</td>
              <td>{(diffInCents(tunings[i].tones[j], baseTone) - tetCents[j]).toFixed(2)}</td>
            </tr>
          ), range(numSemitones)))}
        </tbody>
      </table>
    </div>;
  }
}


class PlayerDoc extends React.Component {
  props: { tuning: number };
  state: { playing: boolean };
  constructor(props) {
    super(props);
    this.state = {playing: false};
  }

  play(e) {
    this.setState((state: {playing:boolean}, props) => ({playing: !state.playing}));
  }

  render() {
    return <div>
      <button onClick={this.play.bind(this)} aria-pressed={this.state.playing}>Play</button>
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
