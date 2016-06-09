'use strict';

const $ = require('gulp-load-plugins')();
const Config = require('./build.json');
const Gulp = require('gulp');

// Declare release task
$.release.register(Gulp);

/**
 * Runs eslint linter on source code
 * and prints a report.
 *
 * `Gulp eslint`
 */
Gulp.task('eslint', () =>
  Gulp.src([].concat(Config.paths.src, Config.paths.test))
    .pipe($.eslint())
    .pipe($.eslint.format())
    .pipe($.if(Config.eslint.failOnError, $.eslint.failOnError()))
);

/**
 * Runs unit tests and prints out
 * a report.
 *
 * `Gulp test`
 */
Gulp.task('test', (cb) => {
  Gulp.src(Config.paths.src)
    .pipe($.istanbul()) // Covering files
    .pipe($.istanbul.hookRequire()) // Force `require` to return covered files
    .on('finish', function() {
      Gulp.src(Config.paths.test)
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
 * `Gulp watch`
 */
Gulp.task('watch', () => Gulp.watch(Config.paths.src, ['eslint']));

/**
 * Lints source code and runs test suite.
 * Used as a pre-commit hook.
 *
 * `Gulp validate`
 */
Gulp.task('validate', ['eslint', 'test']);

/**
 * Alias for 'validate'.
 * Default task.
 *
 * `Gulp [--debug|--debug-brk]`
 */
Gulp.task('default', ['validate']);
