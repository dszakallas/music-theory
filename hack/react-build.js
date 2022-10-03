const rewire = require('rewire');
const config = require('./webpack.config');
const defaults = rewire('react-scripts/scripts/build.js');

// monkey patch config variable to override webpack config
defaults.__set__('config', config(defaults.__get__('config')));

