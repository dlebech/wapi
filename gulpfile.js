'use strict';

// General packages.
var del = require('del');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');

// Gulp packages.
var gulp = require('gulp');
var gutil = require('gulp-util');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');

var JS_SRC = './js/';
var DIST = './dist/';
var JS_DIST = DIST + 'js/';

// Cleans up the dist folders.
gulp.task('clean', function(cb) {
  del([DIST], cb);
});

gulp.task('browserify', function() {
  return browserify(JS_SRC + 'wapi.js', {
    debug: gutil.env.type === 'development'
  })
  // Bundle things up
  .bundle()

  // Pipe to a source? This is confusing but it doesn't seem to work
  // without it.
  .pipe(source('wapi.js'))

  // Turn into a buffer so we can uglify later.
  .pipe(buffer())

  // Output to dist folder
  .pipe(gulp.dest(JS_DIST))

  // Uglify and rename to minified version.
  .pipe(uglify())
  .pipe(rename('wapi.min.js'))

  // Output to dist folder
  .pipe(gulp.dest(JS_DIST))

  .on('error', function(e) {
    console.error(e);
  });
});

gulp.task('dist', ['clean'], function() {
  gulp.start('browserify');
});

gulp.task('default', function() {
  gulp.start('dist');
});

gulp.task('watch', function() {
  // Watch js
  gulp.watch(JS_SRC + '**/*.js', ['browserify']);
});
