'use strict';
// Removing the visualizer plugin import as it's not compatible with webpack 5
// const Visualizer = require('webpack-visualizer-plugin');
const _ = require('lodash');
const path = require('path');
const webpack = require('webpack');

const DEFAULTS = {
  isDevelopment: process.env.NODE_ENV !== 'production',
  baseDir: path.join(__dirname, '..'),
};

function makePlugins(options) {
  const isDevelopment = options.isDevelopment;

  let plugins = [
    // Removing the visualizer plugin
  ];

  if (!isDevelopment) {
    plugins = plugins.concat([
      new webpack.optimize.AggressiveMergingPlugin(),
    ]);
  }

  return plugins;
}

function makeStyleLoaders(options) {
  if (options.isDevelopment) {
    return [
      {
        test: /\.s[ac]ss$/,
        loaders: [
          'style',
          'css?sourceMap',
          'autoprefixer-loader?browsers=last 2 version',
          'sass?sourceMap&sourceMapContents',
        ],
      },
    ];
  }

  return [
    {
      test: /\.s[ac]ss$/,
      loader: ExtractTextPlugin.extract(
        'style-loader',
        'css!autoprefixer-loader?browsers=last 2 version!sass'
      ),
    },
  ];
}

function makeConfig(options) {
  if (!options) options = {};
  _.defaults(options, DEFAULTS);

  const isDevelopment = options.isDevelopment;

  return {
    devtool: isDevelopment ? 'eval-source-map' : 'source-map',
    entry: {
      steem: path.join(options.baseDir, 'src/browser.js'),
      'steem-tests': path.join(options.baseDir, 'test/api.test.js'),
    },
    output: {
      path: path.join(options.baseDir, 'dist'),
      filename: '[name].min.js',
    },
    plugins: makePlugins(options),
    module: {
      rules: [
        {
          test: /\.js?$/,
          use: 'babel-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.json?$/,
          type: 'json',
        },
      ],
    },
    resolve: {
      fallback: {
        stream: require.resolve('stream-browserify'),
        crypto: false,
        path: false,
        fs: false,
      },
      alias: {
        '@exodus/bytebuffer': 'bytebuffer',
      }
    },
    optimization: {
      minimize: !isDevelopment,
    },
  };
}

if (!module.parent) {
  console.log(makeConfig({
    isDevelopment: process.env.NODE_ENV !== 'production',
  }));
}

exports = module.exports = makeConfig;
exports.DEFAULTS = DEFAULTS;
