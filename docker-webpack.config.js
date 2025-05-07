const path = require('path');
const webpack = require('webpack');

module.exports = {
  mode: 'production',
  devtool: 'source-map',
  entry: {
    steem: path.resolve(__dirname, 'src/browser.js'),
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].min.js',
  },
  resolve: {
    alias: {
      '@exodus/bytebuffer': 'bytebuffer',
    }
  },
  node: {
    stream: true,
    crypto: 'empty',
    path: 'empty',
    fs: 'empty'
  },
  module: {
    rules: [
      {
        test: /\.js?$/,
        use: 'babel-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.json?$/,
        use: 'json-loader'
      },
    ],
  },
  plugins: [
    new webpack.optimize.AggressiveMergingPlugin()
  ],
  optimization: {
    minimize: true,
  }
}; 