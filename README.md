![Seneca](http://senecajs.org/files/assets/seneca-logo.png)
> A [Seneca.js][] plugin

# @seneca/amqp-transport

| ![Voxgig](https://www.voxgig.com/res/img/vgt01r.png) | This open source module is sponsored and supported by [Voxgig](https://www.voxgig.com). |
|---|---|

## Install

```sh
npm install --save seneca-amqp-transport
```

> This transport supports AMQP 0-9-1, which is what [amqplib][3] currently supports. For an AMQP 1.0 compliant transport, take a look at [seneca-servicebus-transport][8]

## Quick Example

```js
require('seneca')()
  .use('seneca-amqp-transport')
  .listen({ type: 'amqp', pin: 'role:create' })
```

## More Examples

See [test/](test/) for usage examples.

## Motivation

This plugin provides AMQP transport for Seneca microservice messages using RabbitMQ.

## Support

If you're using this module and need help, you can:

- Post a [github issue][]
- Tweet to [@senecajs][]

## API

### Options

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

const fs = require('fs');

const opts = {
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

## Contributing

The [Senecajs org][] encourages open participation. If you feel you can help in any way, be it with documentation, examples, extra testing, or new features please get in touch.

### Running tests

```sh
npm run test
```

## Background

Uses the [amqplib](https://github.com/squaremo/amqp.node) driver.

[![Greenkeeper badge](https://badges.greenkeeper.io/senecajs/seneca-amqp-transport.svg)](https://greenkeeper.io/)
[![Build Status](https://travis-ci.org/senecajs/seneca-amqp-transport.svg?branch=develop)](https://travis-ci.org/senecajs/seneca-amqp-transport) [![codecov.io](https://codecov.io/github/senecajs/seneca-amqp-transport/coverage.svg?branch=develop)](https://codecov.io/github/senecajs/seneca-amqp-transport?branch=develop) [![Known Vulnerabilities](https://snyk.io/test/github/senecajs/seneca-amqp-transport/badge.svg)](https://snyk.io/test/github/senecajs/seneca-amqp-transport) [![MIT License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](https://github.com/senecajs/seneca-amqp-transport/blob/master/LICENSE)
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
