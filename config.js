const path = require('path');
const CONFIG = {
    src: {
        client: {
            base: 'src/client',
            pug: 'pug/**/*.pug',
            js: 'js/**/*.*',
        },
        server: {
            base: 'src/server/',
            js: '**/*.js',
        },
        images: 'src/images/*',
    },
    dist: {
        base: 'dist/',
        client: 'dist/static/',
        images: 'dist/static/images/',
    },
    entry: {
        pug: 'src/client/pug/index.pug',
        client: 'src/client/js/app.js',
        server: 'dist/server.js',
    },
    libs: [
        'node_modules/jquery/dist/jquery.min.js',
        'node_modules/mathjax/MathJax.js',
        'node_modules/ace-builds/src-min-noconflict/ace.js',
        'node_modules/ace-builds/src-min-noconflict/theme-monokai.js',
        'node_modules/ace-builds/src-min-noconflict/mode-c_cpp.js',
        'node_modules/ace-builds/src-min-noconflict/mode-markdown.js',
        'node_modules/mathjax/config/TeX-AMS-MML_HTMLorMML.js',
        'node_modules/chart.js/dist/Chart.bundle.min.js',
    ],
    linkDirs: [
        'problems',
        'submissions',
    ],
    cfiles: 'src/server/cfiles',
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
