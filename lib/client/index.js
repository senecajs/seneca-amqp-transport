'use strict';
/**
 * @module lib/client-factory
 */
const Promise = require('bluebird');
const Client = require('./client-factory');
const amqputil = require('./client-util');

module.exports = {
  setup
};

function declareRoute(ch, options) {
  var ex = options.exchange;
  var qclient = options.client.queues;
  var queueName = amqputil.resolveClientQueue(qclient);
  ch.prefetch(options.client.channel.prefetch);
  return Promise.props({
    exchange: ch.assertExchange(ex.name, ex.type, ex.options)
      .get('exchange'),
    queue: ch.assertQueue(queueName, qclient.options)
      .get('queue')
  });
}

function createActor(seneca, { ch, queue, exchange, options }, done) {
  var client = Client(seneca, { ch, queue, exchange, options });
  return client.start(done);
}

function setup(seneca, { ch, options }, done) {
  return declareRoute(ch, options)
    .then(function({ queue, exchange }) {
      return createActor(seneca, { ch, queue, exchange, options }, done);
    });
}
