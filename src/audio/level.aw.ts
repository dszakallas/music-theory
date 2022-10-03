class LevelProcessor extends AudioWorkletProcessor {

  constructor() {
    super();
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];
    for (let i = 0; i < input.length; ++i) {
      for (let j = 0; j < input[i].length; ++j) {
        output[i][j] = input[i][j];
      }
    }

    return true;
  }
}

registerProcessor('level', LevelProcessor);
