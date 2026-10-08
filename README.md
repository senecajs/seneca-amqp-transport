![Seneca](http://senecajs.org/files/assets/seneca-logo.png)
> A [Seneca.js][1] plugin

# @seneca/amqp-transport

An [AMQP 0-9-1][2] transport for Seneca: `seneca.listen({ type: 'amqp' })`
consumes messages from a RabbitMQ queue and `seneca.client({ type: 'amqp' })`
publishes them, with replies routed back over a callback queue. Works with
Seneca 3 and the Seneca 4 prerelease (`seneca@4.0.0-rc5`), on Node 22 and 24,
against RabbitMQ 4. Published on npm as `seneca-amqp-transport`.

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](LICENSE)

| ![Voxgig](https://www.voxgig.com/res/img/vgt01r.png) | This open source module is sponsored and supported by [Voxgig](https://www.voxgig.com). |
|---|---|

## Install

```sh
npm install seneca seneca-amqp-transport
```

For the Seneca 4 prerelease, install it explicitly. The published
`seneca-transport` (a dependency) declares `seneca >=3` as a peer, which
excludes prereleases, so npm needs `--legacy-peer-deps` until a
`seneca-transport` release widens that range:

```sh
npm install --legacy-peer-deps seneca@4.0.0-rc5 seneca-amqp-transport
```

`package.json` names the package `@seneca/amqp-transport`, but that scoped
name is not published yet; releases up to 2.2.0 are `seneca-amqp-transport`.

You need a RabbitMQ broker. For local work, `npm run services:up` in a clone
of this repository starts one on port 15673 (see
[Run the tests locally](docs/how-to/run-the-tests-locally.md)).

> This transport supports AMQP 0-9-1, which is what [amqplib][3] supports.
> For an AMQP 1.0 transport, see [seneca-servicebus-transport][8].

## Quick Example

```js
// service.js
require('seneca')()
  .use('seneca-amqp-transport')
  .add('cmd:salute', (msg, reply) => reply({ message: `Hello ${msg.name}!` }))
  .listen({ type: 'amqp', pin: 'cmd:salute', url: 'amqp://guest:guest@localhost:5672' })

// caller.js
require('seneca')()
  .use('seneca-amqp-transport')
  .client({ type: 'amqp', pin: 'cmd:salute', url: 'amqp://guest:guest@localhost:5672' })
  .act('cmd:salute,name:World', console.log)
```

## More Examples

* [Getting started](docs/tutorials/getting-started.md): a listener and a
  client in one runnable program.
* [Configure the transport](docs/how-to/configure-the-transport.md):
  exchanges, queues, several pins, publish options, TLS.
* [Run the tests locally](docs/how-to/run-the-tests-locally.md).
* [Migrate from Seneca 3](docs/how-to/migrate-from-seneca-3.md).
* Runnable programs: [docs/examples](docs/examples/) and the older
  interval demos in [examples](examples/).

The full documentation index is [docs/README.md](docs/README.md).

## Motivation

A broker decouples services: callers do not need to know where a listener
runs, messages wait in durable queues, and several listeners can share the
load of one queue. This plugin lets Seneca use RabbitMQ that way without
changing action code. See [How the transport works](docs/explanation/how-it-works.md).

## Support

* Open a [GitHub issue][9] for bugs and questions.
* Seneca documentation: [senecajs.org][1].
* This module is sponsored and supported by [Voxgig](https://www.voxgig.com).

## API

| Item | Summary | Reference |
| ---- | ------- | --------- |
| `seneca.use('seneca-amqp-transport', options)` | Registers the `amqp` transport type. Options go under `amqp`. | [Options](docs/reference/options.md) |
| `seneca.listen({ type: 'amqp', ... })` | Declares exchange, queue and bindings and consumes messages. | [Connection settings](docs/reference/options.md#connection-settings) |
| `seneca.client({ type: 'amqp', ... })` | Publishes messages and waits for replies on a callback queue. | [Connection settings](docs/reference/options.md#connection-settings) |
| `role:transport,hook:listen,type:amqp` | Action behind `listen`. | [Messages](docs/reference/messages.md) |
| `role:transport,hook:client,type:amqp` | Action behind `client`. | [Messages](docs/reference/messages.md) |

## Contributing

The [Senecajs org][11] encourages open participation. To run the tests you
need Docker, and Node 24 or 22:

```sh
npm install
npm run services:up     # RabbitMQ on 127.0.0.1:15673
npm test                # unit tests, then e2e tests against RabbitMQ
npm run services:down
```

The tests run against the Seneca 4 prerelease devDependency. Set
`AMQP_URL` to use another broker. The GitHub Actions workflow is delivered
as a patch in [.patches](.patches/README.md); apply it with
`git am .patches/*.patch`.

## Background

Written by Nicolás Fantone and contributors; uses the [amqplib][3] driver.

| Version | Seneca | Node | RabbitMQ | amqplib |
| ------- | ------ | ---- | -------- | ------- |
| 2.3.x | 3.x, 4.0.0-rc5 and later | 22, 24 (>= 18) | 4.x (tested with 4.3) | 2.x |
| 2.2.x | 3.x | 6 to 10 | 3.x | 0.5 |

See [CHANGELOG.md](CHANGELOG.md). Licensed under [MIT](LICENSE).

[1]: http://senecajs.org/
[2]: https://www.amqp.org/
[3]: https://github.com/amqp-node/amqplib
[8]: https://github.com/otaviosoares/seneca-servicebus-transport
[9]: https://github.com/senecajs/seneca-amqp-transport/issues
[11]: http://senecajs.org/contribute/
