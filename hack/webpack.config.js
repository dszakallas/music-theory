const { mergeDeep } = require('./util');
const WorkerUrlPlugin = require('worker-url/plugin');

module.exports = function (config) {
  return mergeDeep(config, {
    experiments: {
      topLevelAwait: true
    },
    plugins: [new WorkerUrlPlugin(), ...config.plugins],
    // chunk splitting does not work with audio worklets: https://github.com/webpack/webpack/issues/11543#issuecomment-1006438781
    optimization: {
      splitChunks: {
        chunks() {
          return false;
        },
      },
    },
  });
};
