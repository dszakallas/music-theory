import React, { useEffect, useRef } from 'react';
import { AudioDevice } from '../component/device';
import { movingRms, todBFS } from '../audio/level';

export default function LevelMeter(props: { device: AudioDevice<any> }) {
  const canvasRef = useRef(null);

  const { device } = props;

  const analyser = device.context.createAnalyser();

  analyser.fftSize = 4096;
  device.outputs[0].connect(analyser);

  const buffer = new Float32Array(analyser.frequencyBinCount);

  const t_avg = 50 / 1000; // 50 ms averaging time;
  const sampleRate = analyser.context.sampleRate;

  const tav = 1 - Math.exp(-2.19 / (sampleRate * t_avg)); // convert averaging time to feedback factor

  const dbLimit = -120;

  const draw = (ctx) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    analyser.getFloatTimeDomainData(buffer);

    let level = todBFS(movingRms(buffer, tav, 0));
    level = level < dbLimit ? dbLimit : level;
    level = 1 - level / dbLimit;

    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.rect(
      0,
      (1 - level) * ctx.canvas.height,
      ctx.canvas.width,
      level * ctx.canvas.height
    );
    ctx.fill();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    let lastFrame = null;

    const render = () => {
      draw(context);
      lastFrame = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.cancelAnimationFrame(lastFrame);
    };
  }, []);

  return (
    <React.Fragment>
      <canvas ref={canvasRef}></canvas>
    </React.Fragment>
  );
}
