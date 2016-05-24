'use strict';
/**
 * @module lib/client-hook
 */
const Amqp = require('amqplib');
const Promise = require('bluebird');
const Amqputil = require('./amqp-util');
const SenecaHook = require('./hook');
const AMQPSenecaClient = require('./client');

module.exports =
  class AMQPClientHook extends SenecaHook {
    createTransport(args) {
      return Amqp.connect(args.url, args.socketOptions)
        .then((conn) => conn.createChannel())
        .then((channel) => {
          var ex = args.exchange;
          var qres = args.queues.response;
          var queueName = Amqputil.resolveClientQueue(qres);
          channel.prefetch(1);
          return Promise.props({
            channel,
            exchange: channel.assertExchange(ex.name, ex.type, ex.options),
            queue: channel.assertQueue(queueName, qres.options)
          }).then((transport) => {
            return {
              channel: transport.channel,
              exchange: transport.exchange.exchange,
              queue: transport.queue.queue
            };
          });
        });
    }

    createActor(args, transport, done) {
      transport.channel.on('error', done);
      var client = new AMQPSenecaClient(this.seneca, transport, args);
      return this.utils.make_client(this.seneca, client.callback(), args, done);
    }

  };
