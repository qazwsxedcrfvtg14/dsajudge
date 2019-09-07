const CONFIG = require('./config.js');
const postcss_import = require('postcss-import');
const precss = require('precss');
const cssnext = require('postcss-cssnext');
const cssnano = require('cssnano')({autoprefixer: false});
const webpack = require('webpack');
const path = require('path');

module.exports = {
  mode: 'production',
  // mode:"development",
  entry: {
    'babel': '@babel/polyfill',
    'editor.worker': 'monaco-editor/esm/vs/editor/editor.worker.js',
    'json.worker': 'monaco-editor/esm/vs/language/json/json.worker',
    'css.worker': 'monaco-editor/esm/vs/language/css/css.worker',
    'html.worker': 'monaco-editor/esm/vs/language/html/html.worker',
    'ts.worker': 'monaco-editor/esm/vs/language/typescript/ts.worker',
    'mathjax': 'mathjax/es5/tex-mml-chtml',
    'app': './src/client/js/app'
  },
  plugins: [
  ],
  resolve: {
    alias: {
      vue: 'vue/dist/vue.js'
    },
    modules: [
      path.resolve('./src/client'),
      path.resolve('./node_modules')
    ]
  },
  output: {
    globalObject: 'self',
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel-loader',
        options: {
          presets: ['@babel/env', 'vue']
        }
      },
      {
        test: /\.css$/,
        use: [
          { loader: 'style-loader' },
          { loader: 'css-loader', options: { importLoaders: 1 } },
          { loader: 'postcss-loader', options: { plugins: [postcss_import, precss, cssnext, cssnano] }}
        ]
      },
      {
        test: /\.pug$/,
        use: ['raw-loader', 'pug-html-loader']
      }
    ]
  },
  stats: {
    errorDetails: true
  }
};
