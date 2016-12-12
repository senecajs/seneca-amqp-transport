'use strict';
/**
 * @module lib/listen-factory
 */
const Promise = require('bluebird');
const _ = require('lodash');
const amqputil = require('./listener-util');
const Listener = require('./listener-factory');

// Module API
module.exports = {
  setup
};

function declareRoute(seneca, { ch, options }) {
  var utils = seneca.export('transport/utils');
  var ex = options.exchange;
  ch.prefetch(options.listen.channel.prefetch);
  return Promise.join(
    ch.assertExchange(ex.name, ex.type, ex.options),
    utils.resolve_pins(options)
  ).spread((exchange, pins) => {
    var topics = amqputil.resolveListenTopics(pins);
    var qlisten = options.listen.queues;
    var queue = _.trim(options.name) || amqputil.resolveListenQueue(pins, qlisten);
    return ch.assertQueue(queue, qlisten.options)
      .then((q) => Promise.map(topics,
        (topic) => ch.bindQueue(q.queue, exchange.exchange, topic)))
      .then(() => {
        return {
          exchange: exchange.exchange,
          queue
        };
      });
  });
}

function createActor(seneca, { ch, queue, options }, done) {
  var listener = Listener(seneca, { ch, queue, options });
  return listener.listen().then(() => done());
}

function setup(seneca, { ch, options }, done) {
  return declareRoute(seneca, { ch, options })
    .then(function({ queue }) {
      return createActor(seneca, { ch, queue, options }, done);
    });
}
