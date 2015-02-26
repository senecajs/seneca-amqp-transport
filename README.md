Seneca AMQP transport plugin
============================

This plugin allows seneca servers and clients to communicate over AMQP.

It is **heavily** inspired by [@rjrodger][1]'s [rabbitmq-transport][2] plugin.

## Install

    npm install seneca-amqp-transport

## Usage

Server:

    require('seneca')()
        .use(require('..'))
        .add({generate: 'id'}, function(message, done) {
            done(null, {pid: process.pid, id: '' + Math.random()});
        })
        .listen({type: 'amqp'});

Client:

    var client = require('seneca')()
        .use(require('..'))
        .client({type: 'amqp'}):

    setInterval(function() {
        client.act({generate: 'id'}, function(err, result) {
            console.log(JSON.stringify(result));
        });
    }, 500)

## Options

The following object describes the available options for this transport.
These are applicable to both clients and servers.

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

## TODO

- Tests

Any help/contribution is appreciated!


[1]: https://github.com/rjrodger
[2]: https://github.com/rjrodger/seneca-rabbitmq-transport
