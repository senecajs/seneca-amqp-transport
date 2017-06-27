'use strict';
/**
 * General purpose, high level module for declaration and setup of an AMQP
 * RPC listeners/consumers and its pre-requisites (such as queues, exchanges
 * and bindings).
 *
 * @module lib/listener
 */
const Promise = require('bluebird');
const trim = require('lodash/trim');
const amqputil = require('./listener-util');
const Listener = require('./listener-factory');

// Module API
module.exports = {
  setup
};

/**
 * Declares an exchange and a queue on the broker using the given channel and
 * binds them together using a routing key generated from the pin or pins the
 * Seneca listener was declared with.
 *
 * Also, sets the "prefetch" value on it (see
 * http://www.squaremobius.net/amqp.node/channel_api.html#channel_prefetch).
 *
 * @param {Seneca} The plugin's Seneca instance.
 * @param  {Channel} options.ch Active amqplib channel object.
 * @param  {Object} options.options Plugin options.
 * @return {Promise}  Resolves to an object containing the names of the declared
 *                    exchange and queue.
 */
function declareRoute(seneca, { ch, options }) {
  const utils = seneca.export('transport/utils');
  const ex = options.exchange;

  // Old API compatibility
  options.listener = options.listener || options.listen;

  ch.prefetch(options.listener.channel.prefetch);
  return Promise.join(
    ch.assertExchange(ex.name, ex.type, ex.options),
    utils.resolve_pins(options)
  ).spread((exchange, pins) => {
    const topics = amqputil.resolveListenTopics(pins);
    const qlisten = options.listener.queues;
    const queue = trim(options.name) || amqputil.resolveListenQueue(pins, qlisten);
    return ch.assertQueue(queue, qlisten.options)
      .then((q) => Promise.map(topics,
        (topic) => ch.bindQueue(q.queue, exchange.exchange, topic)))
      .thenReturn({ exchange: exchange.exchange, queue });
  });
}

/**
 * Builds a new listener and immediatly starts consuming from the queue using
 * all passed in parameters.
 *
 * @param  {Seneca}   seneca          This plugin's Seneca instance.
 * @param  {Channel}  options.ch      Active amqplib channel object.
 * @param  {String}   options.queue   Name of the consumer queue.
 * @param  {Object}   options.options Plugin general options.
 * @param  {Function} done            Async nodejs style callback.
 * @return {Promise}                  Resolves when setup is finished and the
 *                                    AMQP consumer has been started.
 */
function createActor(seneca, { ch, queue, options }, done) {
  const listener = Listener(seneca, { ch, queue, options });
  return listener.listen()
    .then(() => done())
    .thenReturn(listener);
}

/**
 * Declares and creates everything needed for an AMQP RPC consumer to function
 * and starts it.
 *
 * @param  {Seneca}   seneca          This plugin's Seneca instance.
 * @param  {Channel}  options.ch Active amqplib channel object.
 * @param  {Object}   options.options Plugin general options.
 * @param  {Function} done            Async nodejs style callback.
 * @return {Promise}  Resolves when the consumer listener has started and the
 *                    corresponding queue and exchange had both been
 *                    declared and bound.
 */
function setup(seneca, { ch, options }, done) {
  return declareRoute(seneca, { ch, options })
    .then(({ queue }) => {
      return createActor(seneca, { ch, queue, options }, done);
    });
}
