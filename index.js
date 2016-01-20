'use strict';

var _ = require('lodash');
var async = require('async');
var amqp = require('amqplib/callback_api');
var amqpuri = require('./lib/amqp-uri');
var shortid = require('shortid');

var defaults = {
  amqp: {
    type: 'amqp',
    url: 'amqp://localhost',
    exchange: {
      type: 'topic',
      name: 'seneca.topic',
      options: {
        durable: true,
        autoDelete: false
      }
    },
    queues: {
      action: {
        durable: true
      },
      response: {
        autoDelete: true,
        exclusive: true
      }
    }
  }
};

var hookListen = function(options, args, done) {
  var seneca = this;
  var type = args.type;
  var listenOptions = seneca.util.clean(_.extend({}, options[type], args));
  var url = amqpuri.format(listenOptions);
  var tu = seneca.export('transport/utils');
  async.auto({
    conn: function(cb) {
      return amqp.connect(url, cb);
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
      var ex = listenOptions.exchange;
      var name = ex.name;
      var opts = ex.options;
      return channel.assertExchange(name, ex.type, opts, function(err, ok) {
        if (err) {
          return cb(err);
        }
        return cb(null, ok.exchange);
      });
    }],
    topics: function(cb) {
      var pins = tu.resolve_pins(listenOptions);

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
      var opts = listenOptions.queues.action;
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
  }, function(err, results) {
    if (err) {
      return done(err);
    }
    var conn = results.conn;
    var channel = results.channel;
    var actQueues = results.actQueues;
    seneca.log.debug('listen', 'subscribe', actQueues, listenOptions, seneca);

    _.each(actQueues, function(q) {
      channel.consume(q, function(message) {
        var tu = seneca.export('transport/utils');
        var content = message.content ? message.content.toString() : void 0;
        var props = message.properties || {};
        var replyTo = props.replyTo;

        if (!content || !props.replyTo) {
          return channel.nack(message);
        }

        var data = tu.parseJSON(seneca, 'listen-' + type, content);

        tu.handle_request(seneca, data, listenOptions, function(out) {
          if (typeof out === 'undefined' || out === null) {
            return;
          }
          var outstr = tu.stringifyJSON(seneca, 'listen-' + type, out);
          channel.ack(message);
          channel.sendToQueue(replyTo, new Buffer(outstr));
        });
      });
    });

    seneca.add('role:seneca,cmd:close', function(closeArgs, done) {
      var closer = this;
      channel.close();
      conn.close();
      closer.prior(closeArgs, done);
    });

    seneca.log.info('listen', 'open', listenOptions, seneca);

    return done();
  });
};

var hookClient = function(options, args, done) {
  var seneca = this;
  var type = args.type;
  var clientOptions = seneca.util.clean(_.extend({}, options[type], args));
  var url = amqpuri.format(clientOptions);
  var tu = seneca.export('transport/utils');
  async.auto({
    conn: function(cb) {
      return amqp.connect(url, cb);
    },
    channel: ['conn', function(cb, results) {
      var conn = results.conn;
      return conn.createChannel(cb);
    }],
    exchange: ['channel', function(cb, results) {
      var channel = results.channel;
      var ex = clientOptions.exchange;
      var name = ex.name;
      var opts = ex.options;
      return channel.assertExchange(name, ex.type, opts, function(err, ok) {
        return cb(err, ok.exchange);
      });
    }],
    resQueue: ['channel', function(cb, results) {
      var channel = results.channel;
      var queueName = 'seneca_res_' + shortid.generate();
      var opts = clientOptions.queues.response;
      return channel.assertQueue(queueName, opts, function(err, ok) {
        return cb(err, ok.queue);
      });
    }]
  }, function(err, results) {
    if (err) {
      return done(err);
    }
    var conn = results.conn;
    var channel = results.channel;
    var exchange = results.exchange;
    var resQueue = results.resQueue;

    channel.prefetch(1);

    tu.make_client(seneca, function(spec, topic, sendDone) {
      channel.on('error', sendDone);

      seneca.log.debug('client', 'subscribe', resQueue, clientOptions, seneca);
      channel.consume(resQueue, function(message) {
        var content = message.content ? message.content.toString() : undefined;
        var input = tu.parseJSON(seneca, 'client-' + type, content);
        tu.handle_response(seneca, input, clientOptions);
      }, {
        noAck: true
      });

      sendDone(null, function(args, done) {
        var outmsg = tu.prepare_request(this, args, done);
        var outstr = tu.stringifyJSON(seneca, 'client-' + type, outmsg);
        var opts = {
          replyTo: resQueue
        };
        topic = 'seneca.' + args.meta$.pattern.replace(/:/g, '.');
        channel.publish(exchange, topic, new Buffer(outstr), opts);
      });

      seneca.add('role:seneca,cmd:close', function(closeArgs, done) {
        var closer = this;
        channel.close();
        conn.close();
        closer.prior(closeArgs, done);
      });
    }, clientOptions, done);
  });
};

module.exports = function(opts) {
  var seneca = this;
  var plugin = 'amqp-transport';
  var so = seneca.options();
  var options = seneca.util.deepextend(defaults, so.transport, opts);
  var listen = hookListen.bind(seneca, options);
  var client = hookClient.bind(seneca, options);
  seneca.add({
    role: 'transport',
    hook: 'listen',
    type: 'amqp'
  }, listen);
  seneca.add({
    role: 'transport',
    hook: 'client',
    type: 'amqp'
  }, client);

  return {
    name: plugin
  };
};
