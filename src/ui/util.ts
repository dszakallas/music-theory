import React from 'react';

export const handleChange = (setState, nullable = true) => (e, newValue) => {
  if (nullable || newValue != null) {
    setState(newValue);
  }
};

export const useState = (s) => {
  const [value, set] = React.useState(s);
  return { value, set };
};
