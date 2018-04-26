const CONFIG = require('./config.js');
const precss = require('precss');
const cssnext = require('postcss-cssnext');
const cssnano = require('cssnano')({autoprefixer: false});
const webpack = require('webpack');
const path = require('path');
const MinifyPlugin = require("babel-minify-webpack-plugin");

module.exports = {
	entry: ["babel-polyfill", "./src/client/js/app.js"],
	plugins: [new MinifyPlugin()],
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
                loader: 'babel-loader',
				options:{
					presets:['env','vue']
				}
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
    },
    stats: {
        errorDetails: true,
    }
}

