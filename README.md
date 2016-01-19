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
  .add({
    role: 'create'
  }, function(message, done) {
    return done(null, {
      pid: process.pid,
      id: Math.floor(Math.random() * (message.max - message.min + 1)) + message.min
    });
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
  });

setInterval(function() {
  client.act('role:create', {
    max: 100,
    min: 50
  }, console.log);
}, 500);
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

## Run the examples

There are simple examples under the `/examples` directory. To run them, just execute:

```sh
# Start listener.js
cd examples
AMQP_URL='amqp://guest:guest@dev.rabbitmq.com:5672' node listener.js
2016-01-19T19:43:41.883Z xsgjohldv9st/1453232621872/26290/- INFO	hello	Seneca/1.0.0/xsgjohldv9st/1453232621872/26290/-
2016-01-19T19:43:42.272Z xsgjohldv9st/1453232621872/26290/- INFO	listen	{type:amqp,pin:role:create}
2016-01-19T19:43:45.114Z xsgjohldv9st/1453232621872/26290/- INFO	plugin	amqp-transport	listen	open	{type:amqp,url:amqp://guest:guest@dev.rabbitmq.com:5672,exchange:{name:seneca.direct,options:{durable:true,auto	{did:(4eq8t),fixedargs:{},context:{module:{id:/home/nfantone/dev/js/seneca-amqp-transport/node_modules/seneca/l...

# Start client.js
cd examples
AMQP_URL='amqp://guest:guest@dev.rabbitmq.com:5672' node listener.js
2016-01-19T19:45:27.797Z kozrmji8xksw/1453232727786/26313/- INFO	hello	Seneca/1.0.0/kozrmji8xksw/1453232727786/26313/-
2016-01-19T19:45:28.162Z kozrmji8xksw/1453232727786/26313/- INFO	client	{type:amqp,pin:role:create}
null { pid: 26290, id: 46 }
null { pid: 26290, id: 36 }
null { pid: 26290, id: 73 }
...
```

> If you don't export the env variable AMQP_URL the default value of 'amqp://localhost' will be used.

## TODO
- Tests

Any help/contribution is appreciated!

[1]: https://senecajs.org
