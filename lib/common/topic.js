'use strict';
/**
 * Small utility module that groups functions
 * to resolve queues and topic names on listeners
 * and clients.
 *
 * @module lib/common/topic
 */

// Module API
module.exports = {
  resolveTopic
};

/**
 * If any part of a ropic contains a '.' (dot)
 * character, it'll be replaced with this pattern to
 * avoid generating bad routing keys.
 * For example, `version:v1.0` -> `version.v1[:dot:]0`.
 * @type {String}
 */
const DOT_ESCAPE_PATTERN = '[:dot:]';

function escapePattern(pinPattern) {
  var pattern = pinPattern ? pinPattern.toString() : '';
  return pattern.replace(/\./g, DOT_ESCAPE_PATTERN);
}

function resolveTopic(topic, options) {
  var keys = Object.keys(topic).sort();
  var rk = [];
  for (let k of keys) {
    rk.push(k);

    // Escapes out literal periods so the routing key
    // does not get screwed up
    rk.push(escapePattern(options ? options[k] : topic[k]));
  }
  return rk.join('.');
}
