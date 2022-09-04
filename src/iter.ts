export const range = function*(length) {
  let i = 0;
  do { yield i; } while(++i < length);
};

export const map = function*(fn, it) {
  do {
    const {done, value} = it.next();
    if (done)
      return;
    yield fn(value);
  } while (true);
};

export const enumerate = (it) => {
  let i = 0;
  return map(v => [i++, v], it);
};

export const zip = function*(its) {
  const l = its.length;
  const _its = new Array(l);
  for (let i = 0; i < l; ++i) {
    _its[i] = iter(its[i]);
  }
  do {
    const res = new Array(l);
    for (let i = 0; i < l; ++i) {
      const {done, value} = _its[i].next();
      if (done)
        return;
      res[i] = value;
    }
    yield res;
  } while (true);
};

export const array = it => [...it];

export const iter = col => col[Symbol.iterator]();
