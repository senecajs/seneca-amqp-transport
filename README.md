![Seneca](http://senecajs.org/files/assets/seneca-logo.png)

> A [Seneca.js][1] transport plugin

# seneca-amqp-transport
This plugin allows seneca listeners and clients to communicate over AMQP.

## Install

```
npm install seneca-amqp-transport
```

## Usage
The following snippets showcase the most basic usage examples.

### Listener

```
require('seneca')()
    .use('seneca-amqp-transport')
    .add({role: 'create'}, function(message, done) {
        return done(null, {pid: process.pid,
            id: Math.floor(Math.random() * (message.max - message.min + 1)) + message.min;});
    })
    .listen({
        type: 'amqp',
        pin: 'role:create'
    });
```

### Client

```
var client = require('seneca')()
    .use('seneca-amqp-transport')
    .client({
        type: 'amqp',
        pin: 'role:create'
    }):

setInterval(function() {
    client.act('role:create', {max: 100, min: 50}, console.log);
}, 500)
```

## Options
The following object describes the available options for this transport. These are applicable to both clients and listeners.

```javascript
var defaults = {
    amqp: {
        type: 'amqp',
        url: 'amqp://localhost',
        exchange: {
            name: 'seneca.direct',
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
```

To override this settings, pass them to the plugin's `.use` declaration:

```javascript
require('seneca')()
    .use('seneca-amqp-transport', {
        amqp: {
            url: 'amqp://username:password@localhost:5672/vhost'
        }
    });
```

## TODO
- Tests

Any help/contribution is appreciated!

[1]: https://senecajs.org
