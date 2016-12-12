'use strict';
/**
 * Small utility module that groups functions
 * to resolve queues and topic names on listeners
 * and clients.
 *
 * @module lib/listener/listener-util.js
 */
const _ = require('lodash');
const topic = require('../common/topic');

// Module API
module.exports = {
  resolveListenQueue,
  resolveListenTopics
};

/**
 * Listener queue names are generated from the act
 * pattern. If said pattern contains a '*' (wildcard)
 * it'll be replaced by this string in the name.
 * For example, 'version:*' -> 'version.any'.
 * @type {String}
 */
const WILDCARD_REPLACEMENT = 'any';

/**
 * Builds a string based on the pins of
 * a listener that can be used an AMQP
 * queue name.
 *
 * For a pin such as 'role:entity,cmd:save', it
 * generates another string like: 'seneca.role:entity.cmd:save' (using defaults).
 *
 * An array of pins such as ['role:entity,cmd:save', 'role:entity,cmd:list', 'foo:*'],
 * resolves to 'seneca.role:entity.cmd:save_list.foo:any'.
 *
 * Prefix and separators can be customized.
 *
 * @param  {Array|String} pins  `pin` or `pins` attribute of a listener.
 * @param  {Object} options  Listener options provided to `.listen(..)` method.
 *                           This methods looks for `options.prefix`
 *                           and `options.separator` attributes.
 *                           Both of them are optional.
 * @return {String} A generated name to be associated
 *                    to the queue of a listener.
 */
function resolveListenQueue(pins, opts = {}) {
  pins = _.castArray(pins);
  var composition = compose(pins);
  return stringify(composition, opts.separator, opts.prefix);
}

/**
 * Infers routing keys that should be used in listener queues
 * bindings for a set of pins. AMQP "routing keys" map to "topics"
 * in the Seneca framework.
 *
 * @param  {Object|Array} pins `pin` or `pins` a listener of client defines.
 * @return {Array}        Routing keys (or "topics") derived from the given `pins`.
 */
function resolveListenTopics(pins) {
  pins = _.castArray(pins);
  var topics = pins.map((p) => topic.resolveTopic(p));
  return topics;
}

function compose(pins) {
  var o = {};
  pins.forEach(function(e) {
    for (let k in e) {
      if (o[k]) {
        if (_.isArray(o[k])) {
          o[k].push(e[k]);
        } else {
          o[k] = [o[k], e[k]];
        }
        o[k] = _.uniq(o[k]);
      } else {
        o[k] = e[k];
      }
    }
  });
  return o;
}

function stringify(o, separator, prefix) {
  var s = [prefix];
  _.forOwn(o, (value, k) => {
    if (_.isArray(value)) {
      value = value.toString().replace(/,/g, '_');
    } else {
      value = value.toString().replace(/\*/g, WILDCARD_REPLACEMENT);
    }
    s.push(`${k}:${value}`);
  });
  return s.join(separator);
}
