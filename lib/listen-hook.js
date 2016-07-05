'use strict';
/**
 * @module lib/listen-hook
 */
const _ = require('lodash');
const Amqp = require('amqplib');
const Promise = require('bluebird');
const Amqputil = require('./amqp-util');
const SenecaHook = require('./hook');
const AMQPSenecaListener = require('./listener');

module.exports =
  class AMQPListenHook extends SenecaHook {
    createTransport(args) {
      return Amqp.connect(args.url, args.socketOptions)
        .then((conn) => conn.createChannel())
        .then((channel) => {
          var ex = args.exchange;
          channel.prefetch(1);
          return Promise.all([
            channel,
            channel.assertExchange(ex.name, ex.type, ex.options),
            this.utils.resolve_pins(args)
          ]);
        })
        .spread((channel, exchange, pins) => {
          var topics = Amqputil.resolveListenTopics(pins);
          var qact = args.queues.action;
          var queue = _.trim(args.name) || Amqputil.resolveListenQueue(pins, qact);
          return channel.assertQueue(queue, qact.options)
            .then((q) => Promise.map(topics,
              (topic) => channel.bindQueue(q.queue, exchange.exchange, topic))
            )
            .then(() => {
              return {
                channel,
                exchange: exchange.exchange,
                queue
              };
            });
        });
    }

    createActor(args, transport, done) {
      var listener = new AMQPSenecaListener(this.seneca, transport, args);
      return listener.listen()
        .then(() => done());
    }
  };
