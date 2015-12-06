var gulp = require('gulp');
var traceur = require('gulp-traceur');

gulp.task('compat', function () {
    return gulp.src('app.js')
        .pipe(traceur())
        .pipe(gulp.dest('compat'));
});
