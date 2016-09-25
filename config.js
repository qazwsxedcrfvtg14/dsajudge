const path = require('path');
const CONFIG = {
    src: {
        client: {
            base: 'src/client',
            pug: 'pug/**/*.pug',
            js: 'js/**/*.js',
            css: 'css/**/*.css',
            vue: 'vue/**/*.pug',
        },
        server: {
            base: 'src/server/',
            js: '**/*.js',
        },
    },
    dist: {
        base: 'dist/',
        client: 'dist/static/',
    },
    entry: {
        pug: 'src/client/pug/index.pug',
        client: 'src/client/js/app.js',
        server: 'dist/server.js',
    },
    libs: [
        'node_modules/jquery/dist/jquery.min.js',
    ],
};

CONFIG.babel = {
    presets: ['latest'],
    plugins: [
        'syntax-async-functions',
        'transform-es2015-modules-commonjs',
        'transform-strict-mode',
        ['babel-root-slash-import', {
            rootPathSuffix: CONFIG.dist.base,
        }],
    ]
};

CONFIG.nodeInspector = {
    debugPort: 5678,
    webHost: 'localhost',
    webPort: '8765',
};

((...args) => {
    for (let obj of args) {
        for (let x in obj) {
            if (x == 'base') continue;
            obj[x] = path.join(obj.base, obj[x])
        }
    }
})(CONFIG.src.client, CONFIG.src.server);

module.exports = CONFIG;
