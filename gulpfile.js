var gulp = require('gulp');
var webpack = require('gulp-webpack');
var webpackConfig = require('./webpack.config.js');
var env = require('gulp-env');
var nodemon = require('gulp-nodemon');

gulp.task('webpack', function () {
    gulp.src(['./src/*.js'])
        .pipe(webpack(webpackConfig))
        .pipe(gulp.dest('./dist'));
});

gulp.task('watch', function () {
    gulp.watch('./src/**/*.js', ['webpack']);
});

gulp.task('run', function () {
    env({
        file: '.env.json'
    });
    nodemon({
        script: 'dist/app.js',
        ext: 'js',
        stdout: true,
        env: {
            NODE_ENV: 'development'
        }
    });
});

gulp.task('default', ['webpack', 'run', 'watch']);

