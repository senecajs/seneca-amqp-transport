![Seneca](http://senecajs.org/files/assets/seneca-logo.png)

> A [Seneca.js][1] transport plugin

# seneca-amqp-transport
[![Build Status](https://travis-ci.org/seneca-contrib/seneca-amqp-transport.svg?branch=develop)](https://travis-ci.org/seneca-contrib/seneca-amqp-transport) [![codecov.io](https://codecov.io/github/seneca-contrib/seneca-amqp-transport/coverage.svg?branch=develop)](https://codecov.io/github/seneca-contrib/seneca-amqp-transport?branch=develop) [![MIT License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](https://github.com/seneca-contrib/seneca-amqp-transport/blob/master/LICENSE)

This plugin allows seneca listeners and clients to communicate over [AMQP][2].

## Install

```sh
npm install seneca-amqp-transport
```

## Usage
The following snippets showcase the most basic usage examples.

### Listener

```javascript
require('seneca')()
  .use('seneca-amqp-transport')
  .add('role:create', function(message, done) {
    return done(null, {
      pid: process.pid,
      id: Math.floor(Math.random() * (message.max - message.min + 1)) + message.min
    });
  })
  .listen({
    name: 'create_act.queue', // This is optional
    type: 'amqp',
    pin: 'role:create'
  });
```

#### How it works
A listener _always_ creates one _and only one_ queue. The queue name can be provided via the `name` parameter, but it will be auto-generated from the `pin` (or `pins`) if not.

> Be careful with name clashing when specifying a `name` for a listener. Having more than one queue with the same name declared on the AMQP broker will probably behave unexpectedly. It is recommended that you leave the name generation to the plugin in order to avoid problems, unless you know what you are doing.

In the example above, the following things are declared:

- A **topic** exchange named `seneca.topic`.
- A **queue** named `seneca.create_act`.
- A **binding** between the queue and the exchange using the _routing key_ `role.create` (named after the pin).

> Queue names are prefixed with a configurable word (`seneca.`, by default). It can be disabled or modified during plugin declaration (read below).

If your intention is to **create multiple queues**, just declare multiple listeners. Each queue will be bound to an exchange (`seneca.topic`, by default) using routing keys derived from the `pin` (or `pins`).

If your intention is to **declare multiple consumers** on a single queue, run multiple listeners with the same set of `pins`. Or just spawn many instances of a single microservice.

### Client

```javascript
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

#### How it works
A client creates an [exclusive][6], randomly named response queue (something similar to `seneca.res.x42jK0l`) and starts consuming from it - much like a listener would do. On every `act`, the client publishes the message to the  `seneca.topic` exchange using a routing key built from the _pin that matches the act pattern_. In the simple example above, the _pattern_ is `role:create` which equals the only declared pin. With that, the routing key `role.create` is inferred. An AMQP `replyTo` header is set to the name of the random queue, in an [RPC-schema][7] fashion.

> Manual queue naming on a client (using the `name` parameter as seen in the listener configuration) is not supported. Client queues are deleted once the client disconnect and re-created each time.

As you can see, pins play an important role on routing messages on the broker, so in order for a listener to receive messages from a client, **their pins must match**.

In the example, the following things are declared:

- A **topic** exchange named `seneca.topic`.
- An exclusive **queue** with a random alphanumeric name (like `seneca.res.x42jK0l`).

> Clients _do not_ declare the queue of their listener counterpart. So, if the message does not reach its destination and is discarded, the `seneca` instance will fail with a `TIMEOUT` error on the client side.

## Options
The following object describes the available options for this transport. These are applicable to both clients and listeners.

```json
{
  "amqp": {
    "type": "amqp",
    "url": "amqp://localhost",
    "exchange": {
      "type": "topic",
      "name": "seneca.topic",
      "options": {
        "durable": true,
        "autoDelete": false
      }
    },
    "queues": {
      "action": {
        "prefix": "seneca",
        "separator": ".",
        "options": {
          "durable": true
        }
      },
      "response": {
        "prefix": "seneca.res",
        "separator": ".",
        "options": {
          "autoDelete": true,
          "exclusive": true
        }
      }
    }
  }
}
```

To override this settings, pass them to the plugin's `.use` declaration:

```javascript
require('seneca')()
  .use('seneca-amqp-transport', {
    queues: {
      action: {
        durable: false,
        prefix: 'my.namespace'
      }
    }
  });
```

### Transport options
AMQP related options may be indicated either by [the connection URI](https://www.rabbitmq.com/uri-spec.html) or by passing additional parameters to the `seneca#client()` or `seneca#listen()` functions.

This,

```javascript
require('seneca')()
  .use('seneca-amqp-transport')
  .client({
    type: 'amqp',
    url: 'amqp://guest:guest@rabbitmq.host:5672/seneca?locale=es_AR'
  });
```

will result in the same connection URI as:

```javascript
require('seneca')()
  .use('seneca-amqp-transport')
  .client({
    type: 'amqp',
    hostname: 'rabbitmq.host',
    port: 5672,
    vhost: 'seneca',
    locale: 'es_AR',
    username: 'guest',
    password: 'guest'
  });
```

### Socket options
Additionally, you may pass in options to the `amqp.connect` method of [amqplib][3] as documented in [its API reference][4], using the `socketOptions` parameter.

```javascript
// Example of using a TLS/SSL connection. Note that the server must be
// configured to accept SSL connections; see http://www.rabbitmq.com/ssl.html.

var fs = require('fs');

var opts = {
  cert: fs.readFileSync('../etc/client/cert.pem'),
  key: fs.readFileSync('../etc/client/key.pem'),
  // cert and key or
  // pfx: fs.readFileSync('../etc/client/keycert.p12'),
  passphrase: 'MySecretPassword',
  ca: [fs.readFileSync('../etc/testca/cacert.pem')]
};

require('seneca')()
  .use('seneca-amqp-transport')
  .client({
    type: 'amqp',
    url: 'amqp://guest:guest@rabbitmq.host:5672/seneca?locale=es_AR',
    socketOptions: opts
  });
```

> Snippet above is based on [amqplib/examples/ssl.js][5]

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
AMQP_URL='amqp://guest:guest@dev.rabbitmq.com:5672' node client.js
2016-01-19T19:45:27.797Z kozrmji8xksw/1453232727786/26313/- INFO	hello	Seneca/1.0.0/kozrmji8xksw/1453232727786/26313/-
2016-01-19T19:45:28.162Z kozrmji8xksw/1453232727786/26313/- INFO	client	{type:amqp,pin:role:create}
null { pid: 26290, id: 46 }
null { pid: 26290, id: 36 }
null { pid: 26290, id: 73 }
# ...
```

> If you don't export the env variable `AMQP_URL` the default value of `amqp://localhost` will be used.

## Contributors
- George Haidar (ghaidar0@gmail.com) _(author of the original version)_.
- Chris Spiliotopoulos (chrysanthos.spiliotopoulos@gmail.com)

## Roadmap
- ~~Mocha unit tests~~
- Functional tests.
- ~~Setup Travis CI~~
- Support for message TTL and dead-lettering.
- Better support for work queues.

## License
MIT

Any help/contribution is appreciated!

[1]: https://senecajs.org/
[2]: https://www.amqp.org/
[3]: https://github.com/squaremo/amqp.node
[4]: http://www.squaremobius.net/amqp.node/channel_api.html#connect
[5]: https://github.com/squaremo/amqp.node/blob/b74a7ca6acbfcd0fb10127d4770b4f825da57745/examples/ssl.js
[6]: https://www.rabbitmq.com/semantics.html
[7]: https://www.rabbitmq.com/tutorials/tutorial-six-javascript.html
