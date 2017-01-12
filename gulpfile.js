/* eslint-disable */
'use strict';

const $ = require('gulp-load-plugins')();
const sequence = require('run-sequence');
const config = require('./build.json');
const gulp = require('gulp');

// Declare release task
$.release.register(gulp);

/**
 * Runs eslint linter on source code
 * and prints a report.
 *
 * `gulp eslint`
 */
gulp.task('eslint', () =>
  gulp.src([].concat(config.paths.src, config.paths.test))
    .pipe($.eslint())
    .pipe($.eslint.format())
    .pipe($.if(config.eslint.failOnError, $.eslint.failAfterError()))
);

/**
 * Runs unit tests and prints out
 * a report.
 *
 * `gulp test:unit`
 */
gulp.task('test:unit', (cb) => {
  process.env.NODE_ENV = 'test';
  gulp.src(config.paths.src)
    .pipe($.istanbul()) // Covering files
    .pipe($.istanbul.hookRequire()) // Force `require` to return covered files
    .on('finish', function() {
      gulp.src(config.paths.test)
        .pipe($.mocha(config.mocha))
        .pipe($.istanbul.writeReports()) // Creating the reports after tests ran
        .pipe($.istanbul.enforceThresholds({
          thresholds: {
            global: 80
          }
        })) // Enforce a coverage of at least 90%
        .on('end', cb);
    });
});

/**
 * Runs end to end, functional tests.
 *
 * `gulp test:e2e`
 */
gulp.task('test:e2e', () => {
  process.env.NODE_ENV = 'test';
  return gulp.src(config.paths.e2e)
    .pipe($.mocha(config.mocha));
});

/**
 * Runs both unit and end to end tests, sequentially.
 *
 * `gulp test`
 */
gulp.task('test', function(cb) {
  sequence('test:e2e', 'test:unit', cb);
});

/**
 * Watches sources and runs linter on
 * changes.
 *
 * `gulp watch`
 */
gulp.task('watch', () => gulp.watch(config.paths.src, ['eslint']));

/**
 * Lints source code and runs test suite.
 * Used as a pre-commit hook.
 *
 * `gulp validate`
 */
gulp.task('validate', ['eslint', 'test:unit']);

/**
 * Lints source code and runs unit as well as
 * end to end tests.
 * Used during CI jobs.
 *
 * `gulp integrate`
 */
gulp.task('integrate', function(cb) {
  sequence('validate', 'test:e2e', cb);
});

/**
 * Alias for 'validate'.
 * Default task.
 */
gulp.task('default', ['validate']);
