const webpack = require('webpack');
const path = require('path');

const config = {
  entry: {
    main: ['@babel/polyfill', './src/javascript/index.js'],
    dns: ['@babel/polyfill', './src/javascript/dns_display.js'],
    states: ['@babel/polyfill', './src/javascript/state_display.js']

  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name]-bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: 'babel-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader'
        ]
      }
    ]
  }
};

module.exports = config;
