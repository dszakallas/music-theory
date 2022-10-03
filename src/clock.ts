export class Clock {
  _clock: Worker;
  _started: boolean;
  _cbs: Map<number, ()=>void>;
  _n: number;
  _interval: number;

  constructor(interval = 25) {
    this._clock = new Worker(new URL('./clock.ww.ts', import.meta.url));
    this._cbs = new Map();
    this._clock.onmessage = (e) => {
      if (e.data == 'tick') {
        for(const cb of this._cbs.values()) {
          cb();
        }
      }
    };
    this._n = 0;
    this.setInterval(interval);
  }

  start() {
    if (!this._started) {
      this._clock.postMessage('start');
      this._started = true;
    }
  }

  stop() {
    if (this._started) {
      this._clock.postMessage('stop');
      this._started = false;
    }
  }

  setInterval(interval: number) {
    this._interval = interval;
    this._clock.postMessage({'interval': interval});
  }

  addTickHandler(cb): number {
    const handle = ++this._n;
    this._cbs.set(handle, cb);
    return handle;
  }

  removeTickHandler(handle): boolean {
    const shouldRemove = this._cbs.has(handle);
    if (shouldRemove) {
      this._cbs.delete(handle);
    }
    return shouldRemove;
  }
}
