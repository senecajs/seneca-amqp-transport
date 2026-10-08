'use strict';
/**
 * Adapts the mocha style used by this suite to the node:test runner.
 * Tests and hooks written as `function(done) {...}` get a node style
 * callback; functions without parameters may return a Promise.
 */
const nodeTest = require('node:test');

// mocha had a 2 second default; allow more for broker round trips.
const TIMEOUT = 10000;

function adapt(fn) {
  if (fn.length === 0) {
    return fn;
  }
  return (t, done) => fn(done);
}

function wrapTest(nodeFn) {
  return function(name, fn) {
    return nodeFn(name, { timeout: TIMEOUT }, adapt(fn));
  };
}

function wrapHook(nodeFn) {
  return function(fn) {
    return nodeFn(adapt(fn), { timeout: TIMEOUT });
  };
}

module.exports = {
  describe: nodeTest.describe,
  it: wrapTest(nodeTest.it),
  before: wrapHook(nodeTest.before),
  after: wrapHook(nodeTest.after),
  beforeEach: wrapHook(nodeTest.beforeEach),
  afterEach: wrapHook(nodeTest.afterEach)
};
