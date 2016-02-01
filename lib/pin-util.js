'use strict';
/**
 * Small utility module that groups functions
 * to handle name generation from clients or listeners
 * pins.
 */

const _ = require('lodash');
const Shortid = require('shortid');

module.exports = {
  resolveQueueName,
  createRandomQueueName,
  resolveTopics
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
 * @param  {String} prefix    Optional.
 *                            Prefix for the resulting string. Defaults to 'seneca'.
 * @param  {String} separator Optional.
 *                            Key, value pair separator. Defaults to '.'.
 * @return {String} A generated name to be associated
 *                    to the queue of a listener.
 */
function resolveQueueName(pins, prefix, separator) {
  pins = arrayify(pins);
  prefix = prefix || DEFAULT_PREFIX;
  separator = separator || DEFAULT_SEPARATOR;
  var composition = compose(pins);
  return stringify(composition, separator, prefix);
}

function createRandomQueueName(prefix, separator) {
  prefix = prefix || DEFAULT_PREFIX;
  separator = separator || DEFAULT_SEPARATOR;
  var sid = Shortid.generate();
  return `${prefix}${separator}${sid}`;
}

/**
 * Infers routing keys that should be used in queue
 * bindings for a set of pins. Routing keys map to "topics"
 * in the Seneca framework.
 *
 * @param  {String|Array} pins `pin` or `pins` a listener of client defines.
 * @param  {[type]} prefix Optional.
 *                         Prefix for each resulting routing key. Defaults to 'seneca'.
 * @return {Array}        Routing keys (or "topics") required by the given pin(s).
 */
function resolveTopics(pins, prefix) {
  var topics = [];
  pins = arrayify(pins);
  prefix = prefix || DEFAULT_PREFIX;

  pins.forEach(function(p) {
    topics.push(`${prefix}.` + _.map(p, function(v, k) {
      return [k, v].join('.');
    }).sort().join('.'));
  });

  topics = _.reject(topics, function(o) {
    return _.find(topics, function(r) {
      return r.length < o.length && o.startsWith(r);
    });
  });

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
  for (let k in o) {
    let value;
    if (_.isArray(o[k])) {
      value = o[k].toString()
        .replace(/,/g, '_');
    } else {
      value = o[k].replace(/\*/g, 'any');
    }
    s.push(`${k}:${value}`);
  }
  return s.join(separator);
}

function arrayify(value) {
  return _.isArray(value) ? value : [value];
}
