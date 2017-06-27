'use strict';
/**
 * General purpose, high level module for declaration and setup of an AMQP
 * RPC client and its pre-requisites (such as queues, exchanges and bindings).
 *
 * @module lib/client
 */
const Promise = require('bluebird');
const Client = require('./client-factory');
const amqputil = require('./client-util');

// Module API
module.exports = {
  setup
};

/**
 * Declares an exchange and a queue on the broker using the given channel.
 * Also, sets the "prefetch" value on it (see
 * http://www.squaremobius.net/amqp.node/channel_api.html#channel_prefetch).
 *
 * @param  {Channel} ch Active channel object.
 * @param  {Object} options Plugin options.
 * @return {Promise}  Resolves to an object containing the names of the declared
 *                    exchange and queue.
 */
function declareRoute(ch, options) {
  const ex = options.exchange;
  const qclient = options.client.queues;
  const queueName = amqputil.resolveClientQueue(qclient);
  ch.prefetch(options.client.channel.prefetch);
  return Promise.props({
    exchange: ch.assertExchange(ex.name, ex.type, ex.options).get('exchange'),
    queue: ch.assertQueue(queueName, qclient.options).get('queue')
  });
}

/**
 * Builds a new client and starts it using all passed in parameters.
 *
 * @param  {Seneca}   seneca          This plugin's Seneca instance.
 * @param  {Channel}  options.ch   Active amqplib channel object.
 * @param  {String}   options.queue    Name of the client queue.
 * @param  {String}   options.exchange Name of the exchange to bind to.
 * @param  {Object}   options.options  Plugin general options.
 * @param  {Function} done             Async nodejs style callback.
 * @return {Promise}                   Resolves after AMQP client starts.
 */
function createActor(seneca, { ch, queue, exchange, options }, done) {
  const client = Client(seneca, { ch, queue, exchange, options });
  return Promise.resolve(client.start(done))
    .thenReturn(client);
}

/**
 * Declares everything needed for an AMQP RPC client to function and starts it.
 *
 * @param  {Seneca}   seneca          This plugin's Seneca instance.
 * @param  {Channel}  options.ch  Active amqplib channel object.
 * @param  {Object}   options.options Plugin general options.
 * @param  {Function} done            Async nodejs style callback.
 * @return {Promise}  Resolves when the publisher client has started and the
 *                    corresponding queue and exchange had both been
 *                    declared.
 */
function setup(seneca, { ch, options }, done) {
  return declareRoute(ch, options)
    .then(function({ queue, exchange }) {
      return createActor(seneca, { ch, queue, exchange, options }, done);
    });
}
