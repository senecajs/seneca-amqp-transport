'use strict';
/**
 * @author nfantone
 */
var _ = require('lodash');
var async = require('async');
var amqpuri = require('./amqp-uri');
var amqp = require('amqplib/callback_api');

var ListenHook = (function() {
  var utils;
  var that;

  function AMQPListenHook(seneca, options) {
    this.seneca = seneca;
    this.options = options;
    utils = seneca.export('transport/utils');
    that = this;
  }

  AMQPListenHook.prototype.start = function(options, done) {
    return async.auto({
      conn: function(cb) {
        return amqp.connect(options.url, options.socketOptions, cb);
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
          if (err) {
            return cb(err);
          }
          return cb(null, ok.exchange);
        });
      }],
      topics: function(cb) {
        var pins = utils.resolve_pins(options);

        var topics = [];

        pins.forEach(function(p) {
          topics.push('seneca.' + _.map(p, function(v, k) {
            return [k, v].join('.');
          }).join('.'));
        });

        topics = _.reject(topics, function(o) {
          return _.find(topics, function(r) {
            return r.length < o.length && o.startsWith(r);
          });
        });

        return cb(null, topics);
      },
      actQueues: ['exchange', 'channel', 'topics', function(cb, results) {
        var exchange = results.exchange;
        var channel = results.channel;
        var opts = options.queues.action;
        var queues = [];

        async.each(results.topics, function(topic, done) {
          var actQueue = topic.replace(/\./g, '_') + '_act';
          actQueue = actQueue.replace(/\*/, 'any');
          channel.assertQueue(actQueue, opts, function(err) {
            if (err) {
              return cb(err);
            }
            channel.bindQueue(actQueue, exchange, topic, {}, function(err) {
              if (err) {
                return cb(err);
              }
              queues.push(actQueue);
              return done();
            });
          });
        }, function(err) {
          return cb(err, queues);
        });
      }]
    }, done);
  };

  AMQPListenHook.prototype.makeRequestHandlers = function(options, transport, done) {
    _.each(transport.actQueues, function(q) {
      transport.channel.consume(q, function(message) {
        var content = message.content ? message.content.toString() : void 0;
        var props = message.properties || {};
        var replyTo = props.replyTo;

        if (!content || !props.replyTo) {
          return transport.channel.nack(message);
        }

        var data = utils.parseJSON(that.seneca, 'listen-' + options.type, content);

        utils.handle_request(that.seneca, data, options, function(out) {
          if (typeof out === 'undefined' || out === null) {
            return;
          }
          var outstr = utils.stringifyJSON(that.seneca, 'listen-' + options.type, out);
          transport.channel.ack(message);
          transport.channel.sendToQueue(replyTo, new Buffer(outstr));
        });
      });
    });

    that.seneca.add('role:seneca,cmd:close', function(closeArgs, cb) {
      transport.channel.close();
      transport.conn.close();
      this.prior(closeArgs, cb);
    });

    that.seneca.log.info('listen', 'open', options, that.seneca);
    return done();
  };

  AMQPListenHook.prototype.hook = function() {
    return function(args, done) {
      args = that.seneca.util.clean(_.extend({}, that.options[args.type], args));
      args.url = amqpuri.format(args);
      return that.start(args, function(err, transport) {
        if (err) {
          return done(err);
        }
        return that.makeRequestHandlers(args, transport, done);
      });
    };
  };

  return AMQPListenHook;
})();

module.exports = ListenHook;
