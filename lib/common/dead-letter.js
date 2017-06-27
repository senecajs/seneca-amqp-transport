'use strict';
/**
 * Helper module used to declare AMQP queues and exchanges
 * related to dead-lettering mechanism.
 *
 * @module lib/common/dead-letter
 */
const Promise = require('bluebird');

// Module API
module.exports = {
  declareDeadLetter
};

/**
 * Routing key used in DLQ -> DLX binding
 *
 * @type {String}
 */
const ROUTING_KEY = '#';

/**
 * Declares a new queue given its name and options using the provided `channel`.
 * @param  {Channel} channel An amqplib Channel object.
 * @param  {Object} opt     Should contain a `name` and `options` properties.
 * @return {Promise}         Resolves when queue has been asserted.
 */
function declareDeadLetterQueue(channel, opt) {
  return channel.assertQueue(opt.name, opt.options);
}

/**
 * Declares a new exchange given its name, type and options using the provided
 * `channel`.
 * @param  {Channel} channel An amqplib Channel object.
 * @param  {Object} opt     Should contain a `name`, `type` and `options`
 *                          properties.
 * @return {Promise}         Resolves when exchange has been asserted.
 */
function declareDeadLetterExchange(channel, opt) {
  return channel.assertExchange(opt.name, opt.type, opt.options);
}

/**
 * Binds a queue to an exchange using `ROUTING_KEY` as the routing key.
 * @param  {Object} dlq     [description]
 * @param  {Object} dlx     [description]
 * @param  {Channel} channel [description]
 * @return {Promise}         [description]
 */
function bindDeadLetterQueue(dlq, dlx, channel) {
  return channel.bindQueue(dlq.queue, dlx.exchange, ROUTING_KEY)
    .thenReturn({ rk: ROUTING_KEY });
}

/**
 * Declares an exchange and queue described by `options` and binds them with
 * '#' as routing key.
 *
 * `options` is an Object matching the following example:
 * {
 *   "queue": {
 *     "name": "seneca.dlq"
 *   },
 *   "exchange": {
 *     "type": "topic",
 *     "name": "seneca.dlx",
 *     "options": {
 *       "durable": true,
 *       "autoDelete": false
 *     }
 *   }
 * }
 *
 * @param  {Channel} channel Queue and exchange will be declared on this
 *                                   channel.
 * @param  {Objet} options   Configuration for the dead-letter queue and
 *                           exchange.
 * @return {Promise}         Resolves when the exchange, queue and binding are
 *                           created.
 */
function declareDeadLetter(channel, options) {
  return Promise.try(() => {
    if (channel && options.queue && options.exchange) {
      return Promise.join(
        declareDeadLetterExchange(channel, options.exchange),
        declareDeadLetterQueue(channel, options.queue)
      ).spread((dlx, dlq) =>
        bindDeadLetterQueue(dlq, dlx, channel)
          .then((bind) => {
            return { dlq: dlq.queue, dlx: dlx.exchange, rk: bind.rk };
          })
      );
    }
  });
}
