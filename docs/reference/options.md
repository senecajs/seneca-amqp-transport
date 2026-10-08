# Options

Two levels of settings: plugin options, given to `use()` under the `amqp`
key and shared by every client and listener of the instance, and
connection settings, given to each `listen()` or `client()` call.
Connection settings are deep merged over the plugin options for that
connection. Defaults come from [defaults.json](../../defaults.json).

## Plugin options

```js
Seneca().use('seneca-amqp-transport', { amqp: { /* ... */ } })
```

| Option | Type | Default | Effect |
| ------ | ---- | ------- | ------ |
| `amqp.type` | string | `'amqp'` | Transport type name stored in the options. The registered type is always `amqp`. |
| `amqp.url` | string | `'amqp://localhost'` | Fallback URL. In practice the connection URL is built from the connection settings (see `url` below). |
| `amqp.exchange.type` | string | `'topic'` | Exchange type passed to `assertExchange`. |
| `amqp.exchange.name` | string | `'seneca.topic'` | Exchange clients publish to and listener queues are bound to. |
| `amqp.exchange.options` | object | `{ durable: true, autoDelete: false }` | amqplib `assertExchange` options. |
| `amqp.deadLetter.queue.name` | string | `'seneca.dlq'` | Dead letter queue. Set `deadLetter.queue` or `deadLetter.exchange` to a falsy value to skip dead letter declarations. |
| `amqp.deadLetter.queue.options` | object | none | amqplib `assertQueue` options for the dead letter queue (amqplib defaults: durable). |
| `amqp.deadLetter.exchange.type` | string | `'topic'` | Dead letter exchange type. |
| `amqp.deadLetter.exchange.name` | string | `'seneca.dlx'` | Dead letter exchange, bound to the dead letter queue with routing key `#`. |
| `amqp.deadLetter.exchange.options` | object | `{ durable: true, autoDelete: false }` | amqplib `assertExchange` options. |
| `amqp.listener.channel.prefetch` | number | `1` | `channel.prefetch()` for listener channels: unacknowledged messages per consumer. |
| `amqp.listener.queues.prefix` | string | `'seneca.add'` | Prefix of generated listener queue names. |
| `amqp.listener.queues.separator` | string | `'.'` | Separator between prefix and pin parts in listener queue names. |
| `amqp.listener.queues.options` | object | `{ durable: true, arguments: { 'x-dead-letter-exchange': 'seneca.dlx', 'x-message-ttl': 60000 } }` | amqplib `assertQueue` options for listener queues. |
| `amqp.listen` | object | none | Old name of `amqp.listener`, used when `listener` is absent. |
| `amqp.client.channel.prefetch` | number | `1` | `channel.prefetch()` for client channels. |
| `amqp.client.queues.prefix` | string | `'seneca.act'` | Prefix of reply queue names. |
| `amqp.client.queues.separator` | string | `'.'` | Separator in reply queue names. |
| `amqp.client.queues.id` | string | random (first part of a v4 UUID) | Fixed suffix for the reply queue name. |
| `amqp.client.queues.options` | object | `{ autoDelete: true, exclusive: true, arguments: { 'x-dead-letter-exchange': 'seneca.dlx', 'x-message-ttl': 10000 } }` | amqplib `assertQueue` options for reply queues. |

Options outside `amqp` are ignored. On Seneca 3 the instance
`transport` options block is merged too; Seneca 4 does not do that.
RabbitMQ 4 refuses `durable: false` queues unless they are `exclusive`.

## Connection settings

```js
seneca.listen({ type: 'amqp', /* ... */ })
seneca.client({ type: 'amqp', /* ... */ })
```

| Setting | Applies to | Effect |
| ------- | ---------- | ------ |
| `type` | both | Must be `'amqp'`. |
| `url` | both | AMQP URI, for example `amqp://user:pass@host:5672/vhost?heartbeat=30`. When present it is used as given, ignoring `host` and `port`. |
| `hostname` | both | Broker host, used to build the URI when `url` is absent. Takes precedence over `host`. |
| `host` | both | Broker host when neither `url` nor `hostname` is given. Seneca core sets it to `127.0.0.1` by default, so with no connection settings the URI is `amqp://127.0.0.1`. |
| `port` | both | Only applied when it is part of `url`; a separate `port` field has no effect. |
| `vhost` | both | Virtual host, added as the URI path when not in the URI. |
| `username`, `password` | both | Credentials, added to the URI when it has none. Both must be set. |
| `frameMax`, `channelMax`, `heartbeat`, `locale` | both | Added to the URI query string. |
| `socketOptions` | both | Second argument to amqplib `connect()`, for example TLS `cert`, `key`, `ca`, `passphrase`. |
| `pin` or `pins` | both | Patterns served by the listener or sent by the client. Without a pin a client sends every message without a local action. |
| `name` | listener | Explicit queue name instead of the generated one. |
| `consume` | listener | amqplib `channel.consume()` options. |
| `publish` | client | amqplib `channel.publish()` options, for example `{ persistent: true }`. `replyTo`, `contentType` and `correlationId` are always set by the plugin. |
| `correlationId` | client | Fixed correlation id for this client's messages; default a random v4 UUID per client. |

Any plugin option (for example `exchange` or `listener`) can also be given
per connection; it is deep merged over the plugin options.
