# seneca-amqp-transport documentation

The documentation follows the [Diátaxis](https://diataxis.fr/) structure.
Start with the tutorial, use the how-to guides for tasks, look details up
in the reference, and read the explanation to understand the design.

## Tutorials

| Tutorial | What you build |
| -------- | -------------- |
| [Getting started](tutorials/getting-started.md) | A listener and a client exchanging a message through RabbitMQ. |

## How-to guides

| Guide | Covers |
| ----- | ------ |
| [Configure the transport](how-to/configure-the-transport.md) | Plugin options, connection URL or fields, several pins, queue names, publish and consume options, TLS. |
| [Run the tests locally](how-to/run-the-tests-locally.md) | Docker Compose service, environment variables, test scripts, CI. |
| [Migrate from Seneca 3](how-to/migrate-from-seneca-3.md) | What changes for users of this plugin on Seneca 4 and RabbitMQ 4. |

## Reference

| Page | Contents |
| ---- | -------- |
| [Options](reference/options.md) | Every plugin option and connection setting, with defaults. |
| [Messages](reference/messages.md) | The transport hook actions, queue and routing key naming, wire format. |

## Explanation

| Page | Topic |
| ---- | ----- |
| [How the transport works](explanation/how-it-works.md) | Lifecycle, RPC over AMQP, dead lettering, Seneca 3 versus 4, limits. |

## Examples

Runnable programs in [examples](examples/). Start RabbitMQ with
`npm run services:up` first.

| Program | Shows |
| ------- | ----- |
| [getting-started.js](examples/getting-started.js) | One listener, one client, one message. |
| [configure.js](examples/configure.js) | Plugin options, `pins`, `name`, `publish`. |

## Feature index

Every option, action pattern and setting of the plugin, and where it is
documented. The plugin defines no error codes, exports or CLI.

| Feature | Kind | Page |
| ------- | ---- | ---- |
| `amqp.type` | option | [Options](reference/options.md#plugin-options) |
| `amqp.url` | option | [Options](reference/options.md#plugin-options) |
| `amqp.exchange.type`, `.name`, `.options` | option | [Options](reference/options.md#plugin-options) |
| `amqp.deadLetter.queue.name`, `.options` | option | [Options](reference/options.md#plugin-options) |
| `amqp.deadLetter.exchange.type`, `.name`, `.options` | option | [Options](reference/options.md#plugin-options) |
| `amqp.listener.channel.prefetch` | option | [Options](reference/options.md#plugin-options) |
| `amqp.listener.queues.prefix`, `.separator`, `.options` | option | [Options](reference/options.md#plugin-options) |
| `amqp.client.channel.prefetch` | option | [Options](reference/options.md#plugin-options) |
| `amqp.client.queues.prefix`, `.separator`, `.id`, `.options` | option | [Options](reference/options.md#plugin-options) |
| `amqp.listen` (old name of `amqp.listener`) | option | [Options](reference/options.md#plugin-options) |
| `url` | connection setting | [Options](reference/options.md#connection-settings) |
| `hostname`, `host`, `port`, `vhost`, `username`, `password` | connection setting | [Options](reference/options.md#connection-settings) |
| `frameMax`, `channelMax`, `heartbeat`, `locale` | connection setting | [Options](reference/options.md#connection-settings) |
| `socketOptions` | connection setting | [Options](reference/options.md#connection-settings) |
| `pin`, `pins` | connection setting | [Options](reference/options.md#connection-settings) |
| `name` (listener queue name) | connection setting | [Options](reference/options.md#connection-settings) |
| `publish` | connection setting | [Options](reference/options.md#connection-settings) |
| `consume` | connection setting | [Options](reference/options.md#connection-settings) |
| `correlationId` | connection setting | [Options](reference/options.md#connection-settings) |
| `role:transport,hook:listen,type:amqp` | action | [Messages](reference/messages.md#roletransporthooklistentypeamqp) |
| `role:transport,hook:client,type:amqp` | action | [Messages](reference/messages.md#roletransporthookclienttypeamqp) |
| `sys:seneca,cmd:close` / `role:seneca,cmd:close` | close hook | [Messages](reference/messages.md#close-hook) |
| Plugin name `amqp-transport` | plugin metadata | [Messages](reference/messages.md#plugin-registration) |
