var gulp = require('gulp');
var webpack = require('gulp-webpack');
var webpackConfig = require('./webpack.config.js');

gulp.task('webpack', function () {
    gulp.src(['./src/*.js'])
        .pipe(webpack(webpackConfig))
        .pipe(gulp.dest('./dist'));
});

gulp.task('watch', function () {
    gulp.watch('./src/*.js', ['webpack']);
});

gulp.task('default', ['webpack', 'watch']);

