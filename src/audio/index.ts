import { WorkerUrl } from 'worker-url';

export const createAudioContext = async (): Promise<AudioContext> => {
  const ctx = new AudioContext();

  const modules = [
    // these have to look exactly like this, e.g we cannot extract the module path
    // as it will be preprocessed by webpack and replaced with a dynamic resource url.
    // Just copy-paste the whole thing when you add new modules.
    new WorkerUrl(new URL('./level.aw.ts', import.meta.url)),
  ];

  await Promise.all(modules.map((m) => ctx.audioWorklet.addModule(m)));

  return ctx;
};
