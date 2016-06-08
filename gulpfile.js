'use strict';

const $ = require('gulp-load-plugins')();
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
    .pipe($.if(config.eslint.failOnError, $.eslint.failOnError()))
);

/**
 * Runs unit tests and prints out
 * a report.
 *
 * `gulp test`
 */
gulp.task('test', (cb) => {
  gulp.src(config.paths.src)
    .pipe($.istanbul()) // Covering files
    .pipe($.istanbul.hookRequire()) // Force `require` to return covered files
    .on('finish', function() {
      gulp.src(config.paths.test)
        .pipe($.mocha())
        .pipe($.istanbul.writeReports()) // Creating the reports after tests ran
        .pipe($.istanbul.enforceThresholds({
          thresholds: {
            global: 80
          }
        })) // Enforce a coverage of at least 80%
        .on('end', cb);
    });
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
gulp.task('validate', ['eslint', 'test']);

/**
 * Alias for 'validate'.
 * Default task.
 *
 * `gulp [--debug|--debug-brk]`
 */
gulp.task('default', ['validate']);
