'use strict';

const CONFIG = require('./config.js');
const gulp = require('gulp');
const $ = require('gulp-load-plugins')();
const webpack = require('webpack-stream');
const del = require('del');
const browserSync = require('browser-sync');
const inspector = require('gulp-node-inspector');
const semantic = require('./semantic/tasks/build');
const path = require('path');

function logError(err) {
    $.util.log($.util.colors.red('[Error]'), err.toString());
    this.emit('end')
}

gulp.task('webpack', () => 
    gulp.src(CONFIG.entry.client)
        .pipe(webpack(require('./webpack.config.js')))
        .on('error', function() {this.emit('end');})
        .pipe(gulp.dest(CONFIG.dist.client))
        .pipe(browserSync.stream())
);

gulp.task('browser-sync', ['nodemon'], () => {
    browserSync.init({
        proxy: "localhost:3333",
        //server: {
            //baseDir: CONFIG.dist.client,
        //},
        //files: ['static/**/*.*'],
        open: false,
    });
});

gulp.task('pug', () =>
    gulp.src(CONFIG.entry.pug)
        .pipe($.pug())
        .on('error', logError)
        .pipe(gulp.dest(CONFIG.dist.client))
        .pipe(browserSync.stream())
);

let nodemon;
gulp.task('server-js', () =>
    gulp.src(CONFIG.src.server.js)
        .pipe($.eslint())
        .pipe($.eslint.format())
        .pipe($.babel(CONFIG.babel))
        .on('error', logError)
        .pipe(gulp.dest(CONFIG.dist.base))
        .on('end', () => {
            if (nodemon) nodemon.emit('restart', 0.5);
        })
);

gulp.task('watch', () => {
    gulp.watch([CONFIG.src.client.pug], ['pug']);
    gulp.watch([
        CONFIG.src.client.css, 
        CONFIG.src.client.js,
        CONFIG.src.client.vue,
    ], ['webpack']);
    gulp.watch([CONFIG.src.server.js], ['server-js']);
});


gulp.task('nodemon', ['build'], () => {
    nodemon = $.nodemon({
        exec: 'cd ./dist && node --inspect',
        //cwd: './dist',
        script: 'server.js',
        watch: false,
        ignore: CONFIG.dist.client,
    });
    return nodemon;
});

// Not compatible with Node 6 QQ
//gulp.task('node-inspector', () => {
    //gulp.src([]).pipe(inspector(CONFIG.nodeInspector));
//});

gulp.task('libs', () => {
    return gulp.src(CONFIG.libs)
               .pipe(gulp.dest(CONFIG.dist.client));
});

gulp.task('links', () => 
    gulp.src(CONFIG.linkDirs)
        .pipe($.sym(CONFIG.linkDirs.map(x => path.join(CONFIG.dist.base, x)), {force: true}))
);


gulp.task('clean', () => {
    del([CONFIG.dist.base])
});

gulp.task('semantic', semantic);
gulp.task('init', ['semantic', 'libs', 'links']);

gulp.task('build', ['webpack', 'pug', 'server-js']);

gulp.task('default', ['build', 'nodemon', 'browser-sync', 'watch']);
