'use strict';
/**
 * Helper module used to declare AMQP
 * queues and exchanges related to dead-lettering
 * mechanism.
 *
 * @module lib/dead-letter
 */
const Promise = require('bluebird');

// Module API
module.exports = {
  declareDeadLetter
};

// Routing key used in DLQ -> DLX binding
const ROUTING_KEY = '#';

function declareDeadLetterQueue(opt, channel) {
  return channel.assertQueue(opt.name, opt.options);
}

function declareDeadLetterExchange(opt, channel) {
  return channel.assertExchange(opt.name, opt.type, opt.options);
}

function bindDeadLetterQueue(dlq, dlx, channel) {
  return channel.bindQueue(dlq.queue, dlx.exchange, ROUTING_KEY);
}

/**
 * Declares an exchange and queue described by
 * `options` and binds them with '#' as
 * routing key.
 *
 * `options` is an Object matching the following schema:
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
 * @param  {Objet} options   Configuration for the dead-letter queue and exchange.
 * @param  {amqplib.Channel} channel Queue and exchange will be declared on this channel.
 * @return {Promise}         Resolves when the exchange, queue and binding are created.
 */
function declareDeadLetter(options, channel) {
  return Promise.try(() => {
    if (options.queue && options.exchange) {
      return Promise.all([
        declareDeadLetterExchange(options.exchange, channel),
        declareDeadLetterQueue(options.queue, channel)
      ]).spread((dlx, dlq) => bindDeadLetterQueue(dlq, dlx, channel));
    }
  });
}
