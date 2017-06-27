'use strict';
/**
 * Small utility module that groups functions
 * to resolve queues and topic names on clients.
 *
 * @module lib/client/client-util
 */
const uuid = require('uuid');
const jsonic = require('jsonic');
const topic = require('../common/topic');

// Module API
module.exports = {
  resolveClientQueue,
  resolveClientTopic
};

/**
 * Generates a queue name from the `options` object. If no `options.id` is
 * provided, a random short identifier will be created.
 *
 * For an options object like {id: '66yJJ8', prefix: 'foo', separator: '_'},
 * a name like 'foo_66yJJ8' is returned.
 *
 * @param {Object} opts Optional. Use to override default prefix (`opts.prefix`)
 *                      and separator (`opts.separator`).
 * @return {String} A generated queue name.
 */
function resolveClientQueue({ id, prefix = '', separator = '.' } = {}) {
  const sid = id || uuid.v4().split('-')[0];
  return prefix && prefix.length ? `${prefix}${separator}${sid}` : sid;
}

/**
 * Infers the routing key that should be used during the publishing of a message
 * on an `.act` call on a client.
 * AMQP "routing keys" map to "topics" in the Seneca framework.
 *
 * @param  {Object} options Must contain a `meta$.pattern` attribute with the
 *                          matching pin associated with the `.act`.
 * @return {String} Routing keys (or "topics") required by the given pin(s).
 */
function resolveClientTopic(options = {}) {
  const t = jsonic(options.meta$.pattern);
  return topic.resolveTopic(t, options);
}
