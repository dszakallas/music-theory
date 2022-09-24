import React from 'react';

export const posMod = (n, m) => (n % m + m) % m;

export const handleChange = (setState) => (e, newValue) => {
  setState(newValue);
};

export const useState = (s) => {
  const [value, set] = React.useState(s);
  return {value, set};
};

export const noop = () => { // eslint-disable-line: @typescript-eslint/no-empty-function
};

