'use strict';
/**
 * @author nfantone
 */

var _ = require('lodash');
var async = require('async');
var shortid = require('shortid');
var amqpuri = require('./amqp-uri');
var amqp = require('amqplib/callback_api');

var ClientHook = (function() {
  var utils;
  var that;

  function AMQPClientHook(seneca, options) {
    this.seneca = seneca;
    this.options = options;
    utils = seneca.export('transport/utils');
    that = this;
  }

  AMQPClientHook.prototype.start = function(options, done) {
    return async.auto({
      conn: function(cb) {
        return amqp.connect(options.url, cb);
      },
      channel: ['conn', function(cb, results) {
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
      exchange: ['channel', function(cb, results) {
        var channel = results.channel;
        var ex = options.exchange;
        return channel.assertExchange(ex.name, ex.type, ex.options, function(err, ok) {
          return cb(err, ok.exchange);
        });
      }],
      resQueue: ['channel', function(cb, results) {
        var channel = results.channel;
        var queueName = 'seneca_res_' + shortid.generate();
        var opts = options.queues.response;
        return channel.assertQueue(queueName, opts, function(err, ok) {
          return cb(err, ok.queue);
        });
      }]
    }, done);
  };

  AMQPClientHook.prototype.makeClient = function(options, transport, done) {
    return utils.make_client(this.seneca, function(spec, topic, sendDone) {
      transport.channel.on('error', sendDone);

      that.seneca.log.debug('client', 'subscribe', that.resQueue, options, that.seneca);
      transport.channel.consume(transport.resQueue, function(message) {
        var content = message.content ? message.content.toString() : undefined;
        var input = utils.parseJSON(that.seneca, 'client-' + options.type, content);
        utils.handle_response(that.seneca, input, options);
      }, {
        noAck: true
      });

      sendDone(null, function(args, done) {
        var outmsg = utils.prepare_request(this, args, done);
        var outstr = utils.stringifyJSON(that.seneca, 'client-' + options.type, outmsg);
        var opts = {
          replyTo: transport.resQueue
        };
        topic = 'seneca.' + args.meta$.pattern.replace(/:/g, '.');
        transport.channel.publish(transport.exchange, topic, new Buffer(outstr), opts);
      });

      that.seneca.add('role:seneca,cmd:close', function(closeArgs, done) {
        transport.channel.close();
        transport.conn.close();
        this.prior(closeArgs, done);
      });
    }, options, done);
  };

  AMQPClientHook.prototype.hook = function() {
    return function(args, done) {
      args = that.seneca.util.clean(_.extend({}, that.options[args.type], args));
      args.url = amqpuri.format(args);
      return that.start(args, function(err, transport) {
        if (err) {
          return done(err);
        }
        return that.makeClient(args, transport, done);
      });
    };
  };

  return AMQPClientHook;
})();

module.exports = ClientHook;
