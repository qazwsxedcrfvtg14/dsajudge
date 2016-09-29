const CONFIG = require('./config.js');
const precss = require('precss');
const cssnext = require('postcss-cssnext');
const cssnano = require('cssnano')({autoprefixer: false});
const webpack = require('webpack');
const path = require('path');
module.exports = {
    output: {
        path: path.join(__dirname, 'client'),
        filename: 'app.js',
    },
    module: {
        preLoaders: [
            {
                test: /\.js$/,
                exclude: /(node_modules|bower_components)/,
                loader: 'eslint',
            }
        ],
        loaders: [
            {
                test: /\.js$/, 
                exclude: /(node_modules|bower_components)/,
                loader: 'babel',
                query: {
                    presets: ['latest'],
                    plugins: [
                        'transform-es2015-modules-commonjs',
                        'transform-strict-mode',
                        ['babel-root-slash-import', {
                            rootPathSuffix: path.join(CONFIG.src.client.base, 'js'),
                        }],
                    ]
                }
            },
            {
                test: /\.css$/, 
                loader: 'style!css!postcss',
            },
            {
                test: /\.pug$/, 
                loaders: ['pug-html-loader'],
            },
            {
                test: /\.json$/, 
                loaders: ['json-loader'],
            },
        ]
    },
    postcss: () => [precss, cssnext, cssnano],
    stats: {
        errorDetails: true,
    }
}

