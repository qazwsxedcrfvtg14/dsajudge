'use strict';

const CONFIG = require('./config.js');
const gulp = require('gulp');
const $ = require('gulp-load-plugins')();
const webpack = require('webpack-stream');
const del = require('del');
const browserSync = require('browser-sync');
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
        .pipe($.sourcemaps.init())
        .pipe($.babel(CONFIG.babel))
        .on('error', logError)
        .pipe($.sourcemaps.write('.'))
        .pipe(gulp.dest(CONFIG.dist.base))
        .on('end', () => {
            if (nodemon) nodemon.emit('restart', 0.5);
        })
);

gulp.task('watch', () => {
    gulp.watch([CONFIG.src.client.pug], ['pug']);
    gulp.watch([
        CONFIG.src.client.js,
    ], ['webpack']);
    gulp.watch([CONFIG.src.server.js], ['server-js']);
    gulp.watch([CONFIG.src.images], ['images']);
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

gulp.task('images', () =>
    gulp.src(CONFIG.src.images)
        .pipe($.imagemin())
        .pipe(gulp.dest(CONFIG.dist.images))
);


gulp.task('libs', () => {
    return gulp.src(CONFIG.libs)
               .pipe(gulp.dest(CONFIG.dist.client));
});

gulp.task('links', () => 
    gulp.src(CONFIG.linkDirs)
        .pipe($.sym(x => path.join(CONFIG.dist.base, path.basename(x.relative)), {force: true}))
);

gulp.task('isolate:make', (next) => {
    (new $.run.Command('make', {cwd: './isolate'})).exec();
    next();
});

gulp.task('isolate:cp', (next) => {
    (new $.run.Command(`sudo cp ./isolate/isolate ${path.join(CONFIG.dist.base, 'judger', 'isolate')}`)).exec();
    (new $.run.Command(`sudo chown root:root ${path.join(CONFIG.dist.base, 'judger', 'isolate')}`)).exec();
    (new $.run.Command(`sudo chmod +s ${path.join(CONFIG.dist.base, 'judger', 'isolate')}`)).exec();
    next();
});

gulp.task('isolate', $.sequence(['make', 'cp'].map(x => `isolate:${x}`)));

gulp.task('cfiles', () => {
    gulp.src(path.join(CONFIG.cfiles, '*'))
        .pipe(gulp.dest(path.join(CONFIG.dist.base, 'cfiles')));
});

gulp.task('clean', () => {
    del([CONFIG.dist.base]);
});

gulp.task('semantic', semantic);

gulp.task('init', ['semantic', 'libs', 'links']);

gulp.task('build', ['webpack', 'pug', 'server-js', 'images', 'cfiles']);

gulp.task('default', ['build', 'nodemon', 'browser-sync', 'watch']);
