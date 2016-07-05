'use strict';
/**
 * Small utility module that groups functions
 * to resolve queues and topic names on listeners
 * and clients.
 *
 * @module lib/amqp-util
 */
const _ = require('lodash');
const Shortid = require('shortid');
const Jsonic = require('jsonic');

module.exports = {
  resolveListenQueue,
  resolveListenTopics,
  resolveClientQueue,
  resolveClientTopic
};

/**
 * Default prefix for every generated queue name or topic.
 * @type {String}
 */
const DEFAULT_PREFIX = 'seneca';

/**
 * Default separator for each key:value pattern
 * on a queue named after a pin.
 * @type {String}
 */
const DEFAULT_SEPARATOR = '.';

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
function resolveListenQueue(pins, options) {
  options = _.defaults({}, options, {
    prefix: DEFAULT_PREFIX,
    separator: DEFAULT_SEPARATOR
  });
  pins = _.castArray(pins);
  var composition = compose(pins);
  return stringify(composition, options.separator, options.prefix);
}

/**
 * Generates a queue name from the `options`
 * object. If no `options.id` id provided, a random short identifier
 * will be created.
 *
 * For an options object like {id: '66yJJ8', prefix: 'foo', separator: '_'},
 * a name like 'foo_66yJJ8' is returned.
 *
 * @param {Object} options Optional. Use to override default
 *                         prefix (`options.prefix`) and separator (`options.separator`).
 * @return {String} A generated queue name.
 */
function resolveClientQueue(options) {
  options = _.defaults({}, options, {
    prefix: DEFAULT_PREFIX,
    separator: DEFAULT_SEPARATOR
  });
  var sid = options.id || Shortid.generate();
  return `${options.prefix}${options.separator}${sid}`;
}

/**
 * Infers the routing key that should be used during the
 * publishing of a message on an `.act` call on a client.
 * AMQP "routing keys" map to "topics" in the Seneca framework.
 *
 * @param  {Object} options Must contain a `meta$.pattern` attribute with the matching pin
 *                          associated with the `.act`.
 * @return {String}        Routing keys (or "topics") required by the given pin(s).
 */
function resolveClientTopic(options) {
  var topic = Jsonic(options.meta$.pattern);
  return resolveTopic(topic, options);
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
  var topics = pins.map((p) => resolveTopic(p));
  return topics;
}

function resolveTopic(topic, options) {
  var keys = Object.keys(topic).sort();
  var rk = [];
  for (let k of keys) {
    rk.push(k);
    rk.push(options ? options[k] : topic[k]);
  }
  return rk.join('.');
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
      value = o[k].toString()
        .replace(/,/g, '_');
    } else {
      value = value.replace(/\*/g, 'any');
    }
    s.push(`${k}:${value}`);
  });
  return s.join(separator);
}
