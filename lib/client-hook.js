'use strict';
/**
 * @module lib/client-hook
 */
const Amqputil = require('./amqp-util');
const Amqpuri = require('amqpuri');
const Amqp = require('amqplib');
const Promise = require('bluebird');
const AMQPSenecaClient = require('./client');

module.exports =
  class AMQPClientHook {
    constructor(seneca) {
      this.seneca = seneca;
      this.utils = seneca.export('transport/utils');
    }

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

    addCloseCmd(transport) {
      return this.seneca.add('role:seneca,cmd:close', function(closeArgs, done) {
        transport.channel.close();
        transport.channel.conn.close();
        this.prior(closeArgs, done);
      });
    }

    createClient(args, transport, done) {
      transport.channel.on('error', done);
      var client = new AMQPSenecaClient(this.seneca, transport, args);
      return this.utils.make_client(this.seneca, client.callback(), args, done);
    }

    hook(options) {
      return (args, done) => {
        args = this.seneca.util.clean(this.seneca.util.deepextend(options[args.type], args));
        args.url = Amqpuri.format(args);
        return this.createTransport(args)
          .then((transport) => Promise.all([
            this.createClient(args, transport, done),
            this.addCloseCmd(transport)
          ])).catch(done);
      };
    }
  };
