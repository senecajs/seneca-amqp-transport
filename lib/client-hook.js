'use strict';
/**
 * @author nfantone
 */

const _ = require('lodash');
const Async = require('async');
const Amqputil = require('./amqp-util');
const Amqpuri = require('./amqp-uri');
const Amqp = require('amqplib/callback_api');

var ClientHook = (function() {
  var utils;
  var self;

  function AMQPClientHook(seneca, options) {
    this.seneca = seneca;
    this.options = options;
    utils = seneca.export('transport/utils');
    self = this;
  }

  AMQPClientHook.prototype.start = function(options, done) {
    return Async.auto({
      conn: function(cb) {
        return Amqp.connect(options.url, options.socketOptions, cb);
      },
      channel: ['conn', function(results, cb) {
        var conn = results.conn;
        conn.createChannel(function(err, channel) {
          if (err) {
            return cb(err);
          }
          channel.prefetch(1);
          channel.on('error', done);
          return cb(null, channel);
        });
      }],
      exchange: ['channel', function(results, cb) {
        var channel = results.channel;
        var ex = options.exchange;
        return channel.assertExchange(ex.name, ex.type, ex.options, function(err, ok) {
          return cb(err, ok.exchange);
        });
      }],
      resQueue: ['channel', function(results, cb) {
        var channel = results.channel;
        var qres = options.queues.response;
        var queueName = Amqputil.resolveClientQueue(qres);
        return channel.assertQueue(queueName, qres.options, function(err, ok) {
          return cb(err, ok.queue);
        });
      }]
    }, done);
  };

  AMQPClientHook.prototype.makeClient = function(options, transport, done) {
    return utils.make_client(this.seneca, function(spec, topic, sendDone) {
      transport.channel.on('error', done);

      self.seneca.log.debug('client', 'subscribe', transport.resQueue, options, self.seneca);
      transport.channel.consume(transport.resQueue, function(message) {
        var content = message.content ? message.content.toString() : undefined;
        var input = utils.parseJSON(self.seneca, 'client-' + options.type, content);
        utils.handle_response(self.seneca, input, options);
      }, {
        noAck: true
      });

      sendDone(null, function(args, done) {
        var outmsg = utils.prepare_request(this, args, done);
        var outstr = utils.stringifyJSON(self.seneca, 'client-' + options.type, outmsg);
        var opts = {
          replyTo: transport.resQueue
        };
        topic = Amqputil.resolveClientTopic(args);
        transport.channel.publish(transport.exchange, topic, new Buffer(outstr), opts);
      });

      self.seneca.add('role:seneca,cmd:close', function(closeArgs, done) {
        transport.channel.close();
        transport.conn.close();
        this.prior(closeArgs, done);
      });
    }, options, done);
  };

  AMQPClientHook.prototype.hook = function() {
    return function(args, done) {
      args = self.seneca.util.clean(_.extend({}, self.options[args.type], args));
      args.url = Amqpuri.format(args);
      return self.start(args, function(err, transport) {
        if (err) {
          return done(err);
        }
        return self.makeClient(args, transport, done);
      });
    };
  };

  return AMQPClientHook;
})();

module.exports = ClientHook;
