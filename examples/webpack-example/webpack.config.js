module.exports = {
  entry: './src/index.js',
  target: process.env.USE_NODE ? 'node' : 'web',
  output: {
    filename: process.env.USE_NODE ? 'node-bundle.js' : 'bundle.js'
  },
  module: {
    loaders: [
      // { test: /\.json$/, loader: 'json-loader'},
    ]
  },
}
