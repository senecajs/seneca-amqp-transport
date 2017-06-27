'use strict';
/**
 * Small utility module that groups functions
 * to resolve queues and topic names on listeners.
 *
 * @module lib/listener/listener-util
 */
const castArray = require('lodash/castArray');
const isArray = require('lodash/isArray');
const uniq = require('lodash/uniq');
const forOwn = require('lodash/forOwn');
const topic = require('../common/topic');

// Module API
module.exports = {
  resolveListenQueue,
  resolveListenTopics
};

/**
 * Listener queue names are generated from the act pattern. If said pattern
 * contains a '*' (wildcard) it'll be replaced by this string in the name.
 * For example, 'version:*' -> 'version.any'.
 *
 * @type {String}
 */
const WILDCARD_REPLACEMENT = 'any';

/**
 * Builds a string based on the pins of a listener that can be used an AMQP
 * queue name.
 *
 * For a pin such as 'role:entity,cmd:save', it generates another string like:
 * 'seneca.role:entity.cmd:save' (using defaults).
 *
 * An array of pins such as ['role:entity,cmd:save', 'role:entity,cmd:list',
 * 'foo:*'], resolves to 'seneca.role:entity.cmd:save_list.foo:any'.
 *
 * Prefix and separator can be customized.
 *
 * @param  {Array|String} pins  `pin` or `pins` attribute of a listener.
 * @param  {Object} options  Listener options provided to `.listen(..)` method.
 *                           This methods looks for `opts.prefix`
 *                           and `opts.separator` attributes.
 *                           Both of them are optional.
 * @return {String} A generated name to be associated
 *                    to the queue of a listener.
 */
function resolveListenQueue(pins, { prefix = '', separator = '.' } = {}) {
  pins = castArray(pins);
  const composition = groupByKeys(pins);
  return toQueueName(composition, separator, prefix);
}

/**
 * Infers routing keys that should be used in listener queues bindings for a set
 * of pins. AMQP "routing keys" map to "topics" in the Seneca framework.
 *
 * @param  {Object|Array} pins `pin` or `pins` a listener of client defines.
 * @return {Array}        Routing keys (or "topics") derived from the given
 *                        `pins`.
 */
function resolveListenTopics(pins) {
  pins = castArray(pins);
  const topics = pins.map((p) => topic.resolveTopic(p));
  return topics;
}

/**
 * For an array of `pins`, such as [{ role: 'entity', cmd: 'save' },
 * { role: 'entity', cmd: 'list' }], groups together values of equal keys and
 * reduce it to a single hash object with all different keys in it to create:
 *
 * { role: 'entity', cmd: [ 'save', 'list' ]}
 *
 * @param  {Array} pins Any array of map objects
 * @return {Object}     A composition
 */
function groupByKeys(pins) {
  return pins && pins.reduce(_groupByKey, {});
}

/**
 * Constructs a name for a queue from keys and values of a `source` hash object.
 * Each key/value entry will be joined by a `separator` character. Keys and
 * values will be separated by a ':' (colon). The entire name will start
 * with the given `prefix`.
 *
 * Example:
 *
 * toQueueName({ role: 'entity', cmd: [ 'save', 'list' ] }, '.', 'seneca');
 * // 'seneca.role:entity.cmd:save_list'
 *
 * @param  {Object} source    Any plain flat object.
 *                            Nested objects are not supported.
 * @param  {String} separator Character (or sequence of characters) to separate
 *                            each key/value pair with (will also follow the
 *                            prefix). Defaults to '.' (dot).
 * @param  {String} prefix    The queue name will start with this.
 * @return {String}           A newly created queue name.
 */
function toQueueName(source, separator = '.', prefix = '') {
  return _stringify(prefix ? [prefix] : [], source).join(separator);
}

function _groupByKey(result, pin) {
  forOwn(pin, (value, k) => {
    if (result[k]) {
      if (isArray(result[k])) {
        result[k].push(value);
      } else {
        result[k] = [result[k], value];
      }
      result[k] = uniq(result[k]);
    } else {
      result[k] = value;
    }
  });

  return result;
}

function _stringify(acum, o) {
  forOwn(o, (value, k) => {
    if (isArray(value)) {
      value = value.toString().replace(/,/g, '_');
    } else {
      value = value.toString().replace(/\*/g, WILDCARD_REPLACEMENT);
    }
    acum.push(`${k}:${value}`);
  });
  return acum;
}
