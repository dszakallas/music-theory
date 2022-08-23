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

export const array = it => [...it];
