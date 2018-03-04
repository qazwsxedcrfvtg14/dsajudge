const CONFIG = require('./config.js');
const precss = require('precss');
const cssnext = require('postcss-cssnext');
const cssnano = require('cssnano')({autoprefixer: false});
const webpack = require('webpack');
const path = require('path');
module.exports = {
	resolve:{
		alias:{
			vue: 'vue/dist/vue.js'
		},
		modules: [
			path.resolve('./src/client'),
			path.resolve('./node_modules')
		]
	},
    output: {
        path: path.join(__dirname, 'client'),
        filename: 'app.js',
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /(node_modules|bower_components)/,
                loader: 'eslint-loader',
            },
			{
				test: /\.css$/,
				use: [
					{ loader: 'style-loader' },
					{ loader: 'css-loader' },
					{ loader: 'postcss-loader', options: { plugins: [precss, cssnext, cssnano] }}
				]
			},
			{
				test: /\.pug$/,
				use: ['raw-loader', 'pug-html-loader']
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
                loaders: ['html', 'pug-html'],
            },
            {
                test: /\.json$/, 
                loaders: ['json-loader'],
            },
        ],
    },
    stats: {
        errorDetails: true,
    }
}

