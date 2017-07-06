![Seneca](http://senecajs.org/files/assets/seneca-logo.png)

> Official [Seneca][1] AMQP transport plugin

# seneca-amqp-transport

[![Greenkeeper badge](https://badges.greenkeeper.io/senecajs/seneca-amqp-transport.svg)](https://greenkeeper.io/)
[![Build Status](https://travis-ci.org/senecajs/seneca-amqp-transport.svg?branch=develop)](https://travis-ci.org/senecajs/seneca-amqp-transport) [![codecov.io](https://codecov.io/github/senecajs/seneca-amqp-transport/coverage.svg?branch=develop)](https://codecov.io/github/senecajs/seneca-amqp-transport?branch=develop) [![Known Vulnerabilities](https://snyk.io/test/github/senecajs/seneca-amqp-transport/badge.svg)](https://snyk.io/test/github/senecajs/seneca-amqp-transport) [![MIT License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](https://github.com/senecajs/seneca-amqp-transport/blob/master/LICENSE)

This plugin allows seneca listeners and clients to communicate over [AMQP][2].

> **Important**: Starting from `2.2.0` this plugin will require the usage of the `--harmony` flag in order to run in node versions _older_ than LTS (currently 6.x.x).

> **Important**: If you are upgrading to `2.1.0` (or later) from an older version, _please read and follow_ instructions on [this wiki guide][13] to avoid some potential issues.

## Install

```sh
npm install --save seneca-amqp-transport
```

> This transport supports AMQP 0-9-1, which is what [amqplib][3] currently supports. For an AMQP 1.0 compliant transport, take a look at [seneca-servicebus-transport][8]

## Usage
The following snippets showcase the most basic usage examples.

### Listener

```js
require('seneca')()
  .use('seneca-amqp-transport')
  .add('cmd:log,level:*', function(req, done) {
    console[req.level](req.message);
    return done(null, { ok: true, when: Date.now() });
  })
  .listen({
    type: 'amqp',
    pin: 'cmd:log,level:*',
    url: process.env.AMQP_URL
  });
```

#### How it works
A listener _always_ creates one _and only one_ queue. The queue name can be provided via the `name` parameter, but it will be auto-generated from the `pin` (or `pins`) if not.

> Be careful with name clashing when specifying a `name` for a listener. Having more than one queue with the same name declared on the AMQP broker will probably behave unexpectedly. It is recommended that you leave the name generation to the plugin in order to avoid problems, unless you know what you are doing.

In the example above, the following things are declared:

- A **topic** exchange named `seneca.topic`.
- A **queue** named `seneca.cmd:log.level:any`.
- A **binding** between the queue and the exchange using the _routing key_ `cmd.log.level.*` (named after the pin).

> Queue names are prefixed with a configurable word (`seneca.`, by default). It can be disabled or modified during plugin declaration (read below).

If your intention is to **create multiple queues**, just declare multiple listeners. Each queue will be bound to an exchange (`seneca.topic`, by default) using routing keys derived from the `pin` (or `pins`).

If your intention is to **declare multiple consumers** on a single queue, run multiple listeners with the same set of `pins`. Or just spawn many instances of a single microservice.

### Client

```js
var client = require('seneca')()
  .use('seneca-amqp-transport')
  .client({
    type: 'amqp',
    pin: 'cmd:log,level:log',
    url: process.env.AMQP_URL
  });

setInterval(function() {
  client.act('cmd:log,level:log', {
    message: 'Hello World'
  }, (err, res) => {
    if (err) {
      // Handle error in some way
      throw err;
    }
    // Print out the response
    console.log(res);
  });
}, 2000);

```

#### How it works
A client creates an [exclusive][6], randomly named response queue (something similar to `seneca.act.x42jK0l`) and starts consuming from it - much like a listener would do. On every `act`, the client publishes the message to the  `seneca.topic` exchange using a routing key built from the _pin that matches the act pattern_. In the simple example above, the _pattern_ is `cmd:log,level:log` which equals the only declared pin. With that, the routing key `cmd.log.level.log` is inferred. An AMQP `replyTo` header is set to the name of the random queue, in an [RPC-schema][7] fashion.

> Manual queue naming on a client (using the `name` parameter as seen in the listener configuration) is not supported. Client queues are deleted once the client disconnects and re-created each time.

As you can see, pins play an important role on routing messages on the broker, so in order for a listener to receive messages from a client, **their pins must match**.

In the example, the following things are declared:

- A **topic** exchange named `seneca.topic`.
- An exclusive **queue** with a random alphanumeric name (like `seneca.act.x42jK0l`).

> Clients _do not_ declare the queue of their listener counterpart. So, if the message does not reach its destination or is discarded by the broker, the `seneca` instance will fail with a `TIMEOUT` error on the client side.

## Options
The JSON object in [`defaults.json`](./defaults.json) describes the available options for this transport. These are applicable to both clients and listeners.

To override this settings, pass them to the plugin's `.use` declaration:

```js
require('seneca')()
  .use('seneca-amqp-transport', {
    amqp: {
      client: {
        queues: {
          options: {
            durable: false
          }
        }
      }
    }
  });
```

### Transport options
AMQP related options may be indicated either by [the connection URI](https://www.rabbitmq.com/uri-spec.html) or by passing additional parameters to the `seneca#client()` or `seneca#listen()` functions.

This,

```js
require('seneca')()
  .use('seneca-amqp-transport')
  .client({
    type: 'amqp',
    url: 'amqp://guest:guest@rabbitmq.host:5672/seneca?locale=es_AR'
  });
```

will result in the same connection URI as:

```js
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

You may also pass in additional options for the `channel#publish` and `channel#consume` methods of [amqplib][3] under `publish` and `consume`, respectively.

```js
require('seneca')()
  .use('seneca-amqp-transport')
  .client({
    type: 'amqp',
    hostname: 'rabbitmq.host',
    publish: {
      persistent: true
    }
  });
```

> Read the offical [amqplib][3] docs for a list of available options for [`publish`](http://www.squaremobius.net/amqp.node/channel_api.html#channel_publish) and [`consume`](http://www.squaremobius.net/amqp.node/channel_api.html#channel_consume).

### Socket options
Additionally, you may pass in options to the `amqp.connect` method of [amqplib][3] as documented in [its API reference][4], using the `socketOptions` parameter.

```js
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

There are simple examples under the `/examples` directory. To run them, just install latest `seneca` (if you didn't install `devDependencies`) and execute:

```sh
#Install seneca
npm i seneca

# Start listener.js
cd examples
AMQP_URL='amqp://guest:guest@localhost:5672' node listener.js
{"kind":"notice","notice":"seneca started","level":"info","when":1476216405556}

# Start client.js
cd examples
AMQP_URL='amqp://guest:guest@localhost:5672' node client.js
{"kind":"notice","notice":"seneca started","level":"info","when":1476216473818}
{ id: 93,
  message: 'Hello World!',
  from: { pid: 4150, file: 'examples/listener.js' },
  now: 1476306009801 }
# ...
```

> If you don't export the env variable `AMQP_URL` the default value of `amqp://localhost` will be used.

## Contributors
- George Haidar (ghaidar0@gmail.com) _(author of the original version)_.
- Chris Spiliotopoulos (chrysanthos.spiliotopoulos@gmail.com)

## Roadmap
- [x] :muscle: ~~Mocha unit tests.~~
- [x] :muscle: ~~Functional tests~~ ([#74](https://github.com/senecajs/seneca-amqp-transport/issues/74)).
- [x] :muscle: ~~Setup Travis CI.~~
- [x] :muscle: ~~Support for message TTL and dead-lettering~~ ([#59](https://github.com/senecajs/seneca-amqp-transport/issues/59)).
- [ ] Better support for work queues.
- [ ] Better support for fanout exchanges.
- [ ] Improve logging using `seneca.log`.
- [ ] Don't depend on pins for routing ([#58](https://github.com/senecajs/seneca-amqp-transport/issues/58)).
- [x] ~~_Internal_: remove classes in favor of factory functions~~ (https://github.com/senecajs/seneca-amqp-transport/pull/73).

## Contributing
This module follows the general [Senecajs.org][1] contribution guidelines and encourages open participation. If you feel you can help in any way, or discover any issues, feel free to [create an Issue][9] or [a Pull Request][10]. For more information on contribution please see our [Contributing guidelines][11].

## License
Licensed under the [MIT][12] license.

[1]: http://senecajs.org/
[2]: https://www.amqp.org/
[3]: https://github.com/squaremo/amqp.node
[4]: http://www.squaremobius.net/amqp.node/channel_api.html#connect
[5]: https://github.com/squaremo/amqp.node/blob/master/examples/ssl.js
[6]: https://www.rabbitmq.com/semantics.html
[7]: https://www.rabbitmq.com/tutorials/tutorial-six-javascript.html
[8]: https://github.com/otaviosoares/seneca-servicebus-transport
[9]: https://github.com/senecajs/seneca-amqp-transport/issues/new
[10]: https://github.com/senecajs/seneca-amqp-transport/pulls
[11]: http://senecajs.org/contribute/
[12]: ./LICENSE.md
[13]: https://github.com/senecajs/seneca-amqp-transport/wiki/2.1.0-migration-guide
