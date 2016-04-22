'use strict';
/**
 * @author nfantone
 */
const _ = require('lodash');
const Async = require('async');
const Amqpuri = require('amqpuri');
const Amqputil = require('./amqp-util');
const Amqp = require('amqplib/callback_api');

var ListenHook = (function() {
  var utils;
  var self;

  function AMQPListenHook(seneca, options) {
    this.seneca = seneca;
    this.options = options;
    utils = seneca.export('transport/utils');
    self = this;
  }

  AMQPListenHook.prototype.start = function(options, done) {
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
          if (err) {
            return cb(err);
          }
          return cb(null, ok.exchange);
        });
      }],
      pins: function(cb) {
        return cb(null, utils.resolve_pins(options));
      },
      topics: ['pins', function(results, cb) {
        var topics = Amqputil.resolveListenTopics(results.pins);
        return cb(null, topics);
      }],
      actQueue: ['exchange', 'channel', 'pins', 'topics', function(results, cb) {
        var exchange = results.exchange;
        var channel = results.channel;
        var qact = options.queues.action;
        var queue = _.trim(options.name) || Amqputil.resolveListenQueue(results.pins, qact);
        channel.assertQueue(queue, qact.options, function(err) {
          if (err) {
            return cb(err);
          }
          Async.each(results.topics, function(topic, done) {
            channel.bindQueue(queue, exchange, topic, {}, function(err) {
              if (err) {
                return cb(err);
              }
              return done();
            });
          }, function(err) {
            return cb(err, queue);
          });
        });
      }]
    }, done);
  };

  AMQPListenHook.prototype.makeRequestHandlers = function(options, transport, done) {
    transport.channel.consume(transport.actQueue, function(message) {
      var content = message.content ? message.content.toString() : void 0;
      var props = message.properties || {};
      var replyTo = props.replyTo;

      if (!content || !props.replyTo) {
        return transport.channel.nack(message);
      }

      var data = utils.parseJSON(self.seneca, 'listen-' + options.type, content);

      utils.handle_request(self.seneca, data, options, function(out) {
        if (typeof out === 'undefined' || out === null) {
          return;
        }
        var outstr = utils.stringifyJSON(self.seneca, 'listen-' + options.type, out);
        transport.channel.ack(message);
        transport.channel.sendToQueue(replyTo, new Buffer(outstr));
      });
    });

    self.seneca.add('role:seneca,cmd:close', function(closeArgs, cb) {
      transport.channel.close();
      transport.conn.close();
      this.prior(closeArgs, cb);
    });

    self.seneca.log.info('listen', 'open', options, self.seneca);
    return done();
  };

  AMQPListenHook.prototype.hook = function() {
    return function(args, done) {
      args = self.seneca.util.clean(_.extend({}, self.options[args.type], args));
      args.url = Amqpuri.format(args);
      return self.start(args, function(err, transport) {
        if (err) {
          return done(err);
        }
        return self.makeRequestHandlers(args, transport, done);
      });
    };
  };

  return AMQPListenHook;
})();

module.exports = ListenHook;
