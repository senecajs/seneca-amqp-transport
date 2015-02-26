var _ = require('lodash');
var async = require('async');
var amqp = require('amqplib/callback_api');
var shortid = require('shortid');

var defaults = {
    amqp: {
        type: 'amqp',
        url: 'amqp://localhost',
        exchange: {
            name: 'seneca',
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
    var tu = seneca.export('transport/utils');
    async.auto({
        conn: function(cb) {
            amqp.connect(listenOptions.url, cb);
        },
        channel: ['conn', function(cb, results) {
            var conn = results.conn;
            conn.createChannel(function(err, channel) {
                if (err) { return cb(err); }
                channel.prefetch(1);
                channel.on('error', done);
                cb(null, channel);
            });
        }],
        exchange: ['channel', function(cb, results) {
            var channel = results.channel;
            var ex = listenOptions.exchange;
            var name = ex.name;
            var opts = ex.options;
            return channel.assertExchange(name, 'direct', opts, function(err, ok) {
                if (err) { return cb(err); }
                return cb(null, ok.exchange);
            });
        }],
        topic: function(cb) {
            tu.listen_topics(seneca, args, listenOptions, function(topic) {
                cb(null, topic);
            });
        },
        actQueue: ['exchange', 'channel', 'topic', function(cb, results) {
            var exchange = results.exchange;
            var channel = results.channel;
            var topic = results.topic;
            var actQueue = topic + '_act';
            var opts = listenOptions.queues.action;
            channel.assertQueue(actQueue, opts, function(err, ok) {
                if (err) { return cb(err); }
                channel.bindQueue(actQueue, exchange, 'action', {}, function(err, ok) {
                    if (err) { return cb(err); }
                    return cb(null, actQueue);
                });
            });
        }]
    }, function(err, results) {
        if (err) { return done(err); }
        var conn = results.conn;
        var channel = results.channel;
        var exchange = results.exchange;
        var actQueue = results.actQueue;
        seneca.log.debug('listen', 'subscribe', actQueue, listenOptions, seneca);
        channel.consume(actQueue, function(message) {
            var tu = seneca.export('transport/utils');
            var content = message.content ? message.content.toString() : void 0;
            var props = message.properties || {};
            var replyTo = props.replyTo;

            if (!content || !props.replyTo) {
                return channel.nack(message);
            }

            var data = tu.parseJSON(seneca, 'listen-' + type, content);

            tu.handle_request(seneca, data, listenOptions, function(out) {
                if( typeof out === 'undefined' || out === null ) {
                    return;
                }
                var outstr = tu.stringifyJSON(seneca, 'listen-' + type, out);

                channel.ack(message);
                channel.sendToQueue(replyTo, new Buffer(outstr));
            });
        });

        seneca.add('role:seneca,cmd:close', function(closeArgs, done) {
            var closer = this;
            channel.close();
            conn.close();
            closer.prior(closeArgs, done);
        });

        seneca.log.info('listen', 'open', listenOptions, seneca);

        done();
    });

};

var hookClient = function(options, args, done) {
    var seneca = this;
    var type = args.type;
    var clientOptions = seneca.util.clean(_.extend({}, options[type], args));
    var tu = seneca.export('transport/utils');
    async.auto({
        conn: function(cb) {
            amqp.connect(clientOptions.url, cb);
        },
        channel: ['conn', function(cb, results) {
            var conn = results.conn;
            conn.createChannel(cb);
        }],
        exchange: ['channel', function(cb, results) {
            var channel = results.channel;
            var ex = clientOptions.exchange;
            var name = ex.name;
            var opts = ex.options;
            return channel.assertExchange(name, 'direct', opts, function(err, ok) {
                if (err) { return cb(err); }
                cb(null, ok.exchange);
            });
        }],
        resQueue: ['channel', function(cb, results) {
            var channel = results.channel;
            var queueName = 'res_' + shortid.generate();
            var opts = clientOptions.queues.response;
            channel.assertQueue(queueName, opts, function(err, ok) {
                if (err) { return cb(err); }
                return cb(null, ok.queue);
            });
        }]
    }, function(err, results) {
        if (err) { return done(err); }
        var conn = results.conn;
        var channel = results.channel;
        var exchange = results.exchange;
        var resQueue = results.resQueue;

        channel.prefetch(1);

        tu.make_client(function(spec, topic, sendDone) {

            channel.on('error', sendDone);

            seneca.log.debug('client', 'subscribe', resQueue, clientOptions, seneca);
            channel.consume(resQueue, function (message) {
                var content = message.content ? message.content.toString() : undefined;
                var input = tu.parseJSON(seneca, 'client-' + type, content);
                tu.handle_response(seneca, input, clientOptions);
            }, {noAck: true});

            sendDone(null, function (args, done) {
                var outmsg = tu.prepare_request(this, args, done);
                var outstr = tu.stringifyJSON(seneca, 'client-' + type, outmsg);
                var opts = {
                    replyTo: resQueue
                };
                channel.publish(exchange, 'action', new Buffer(outstr), opts);
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
    var options = seneca.util.deepextend(defaults, so.transport, options);
    var tu = seneca.export('transport/utils');
    var listen = hookListen.bind(seneca, options);
    var client = hookClient.bind(seneca, options);
    seneca.add({role:'transport', hook:'listen', type:'amqp'}, listen);
    seneca.add({role:'transport', hook:'client', type:'amqp'}, client);

    return {name: plugin};
};
