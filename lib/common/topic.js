'use strict';
/**
 * Small utility module that helps build AMQP routing keys out of regular hash
 * objects representing Seneca patterns (called topics).
 *
 * @module lib/common/topic
 */

// Module API
module.exports = {
  resolveTopic
};

/**
 * If any part of a topic contains a '.' (dot) character, it'll be replaced
 * with this pattern to avoid generating bad routing keys.
 * For example, `version:v1.0` -> `version.v1[:dot:]0`.
 *
 * @type {String}
 */
const DOT_ESCAPE_PATTERN = '[:dot:]';

/**
 * Replaces a '.' literal with `DOT_ESCAPE_PATTERN` on a given string.
 *
 * @param  {String} pinPattern Any string. Defaults to ''.
 * @return {String}            The replacement result.
 */
function escapePattern(pinPattern = '') {
  var pattern = pinPattern == null ? '' : pinPattern.toString();
  return pattern.replace(/\./g, DOT_ESCAPE_PATTERN);
}

/**
 * Creates an AMQP routing key from a Seneca `topic` object.
 *
 * The routing key is a message attribute. The exchange looks at this key when
 * deciding how to route the message to queues.
 *
 * A Seneca "topic" consist on a Jsonic object representing a pattern.
 * See https://github.com/rjrodger/jsonic.
 *
 * Since the AMQP 0-9-1 spec defines '.' (dot) as a routing key's words
 * delimiter, any '.' (dot) character present on the `topic` will be escaped
 * using a `DOT_ESCAPE_PATTERN` string.
 * See https://www.rabbitmq.com/resources/specs/amqp0-9-1.pdf (3.1.3.3).
 *
 * For example, for a pattern such as "{ foo: 'bar', baz: 42 }" a routing key
 * like 'foo.bar.baz.42' will be created.
 *
 * @param  {Object} topic   A Jsonic pattern object.
 * @param  {Object} options Optional. May contain alternative values for keys
 *                          in `topic`. Will take precedence if present.
 * @return {String}         An AMQP routing key.
 */
function resolveTopic(topic, options = {}) {
  var keys = Object.keys(topic).sort();
  var rk = [];
  for (let k of keys) {
    rk.push(k);

    // Escapes out literal periods so the routing key
    // does not get screwed up
    rk.push(escapePattern(options[k] || topic[k]));
  }
  return rk.join('.');
}
