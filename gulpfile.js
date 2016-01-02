var gulp = require('gulp');
var traceur = require('gulp-traceur');
var merge = require('merge-stream');
var fs = require('fs');

gulp.task('compat', function () {
    // Delete compat directory if it exists

    var compileApp = gulp.src(['app.js'])
        .pipe(traceur())
        .pipe(gulp.dest('compat'));

    var compileCommands = gulp.src(['commands/*'])
        .pipe(traceur())
        .pipe(gulp.dest('compat/commands'));

    var copy = gulp.src(['*.json'])
        .pipe(gulp.dest('compat'));

    return merge(compileApp, compileCommands, copy);
});
