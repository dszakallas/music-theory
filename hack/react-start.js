const rewire = require('rewire');
const config = require('./webpack.config');
const defaults = rewire('react-scripts/scripts/start.js');

const defaultConfigFactory = defaults.__get__('configFactory');


// monkey patch configFactory function to override webpack config generator
defaults.__set__('configFactory', (...args) => {
  const c = config(defaultConfigFactory(...args));
  return c;
});
