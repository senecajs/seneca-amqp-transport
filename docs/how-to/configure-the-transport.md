# Configure the transport

Goal: point the transport at your broker and shape the exchange, queues
and messages it uses. Every setting is listed in
[Options](../reference/options.md). A runnable version of most of this
page is [docs/examples/configure.js](../examples/configure.js).

## Set plugin options

Plugin options apply to every client and listener of the instance. Put
them under the `amqp` key:

```js
Seneca().use('seneca-amqp-transport', {
  amqp: {
    exchange: { name: 'docs.topic', options: { durable: false, autoDelete: true } },
    listener: { queues: { options: { durable: false, exclusive: true } } }
  }
})
```

Options outside `amqp` (for example a top level `exchange`) are ignored.
On Seneca 4, top level instance options such as `Seneca({ transport: {...} })`
are not merged into the plugin; on Seneca 3 the `transport` block still is.

RabbitMQ 4 refuses non-durable queues that are not exclusive (the
`transient_nonexcl_queues` feature is disabled), so pair `durable: false`
with `exclusive: true`.

## Connect to your broker

Pass a [RabbitMQ URI](https://www.rabbitmq.com/docs/uri-spec) as `url` to
`listen()` or `client()`:

```js
seneca.client({
  type: 'amqp',
  pin: 'cmd:salute',
  url: 'amqp://guest:guest@rabbitmq.host:5672/seneca?heartbeat=30'
})
```

Or give the parts as fields. This produces
`amqp://guest:guest@rabbitmq.host/seneca?locale=es_AR`:

```js
seneca.client({
  type: 'amqp',
  pin: 'cmd:salute',
  hostname: 'rabbitmq.host',
  vhost: 'seneca',
  username: 'guest',
  password: 'guest',
  locale: 'es_AR'
})
```

With the field form the `port` field is not applied (the broker default
5672 is used); use `url` for a non-default port.

## Listen on several patterns

Give `pins` an array. One queue is declared and bound once per pin:

```js
seneca.listen({
  type: 'amqp',
  url: AMQP_URL,
  pins: ['role:math,cmd:sum', 'role:math,cmd:product'],
  name: 'docs.math'   // optional queue name; default seneca.add.role:math.cmd:sum_product
})
```

A client can use a wildcard pin such as `role:math,cmd:*`; each message is
published with a routing key built from the matched message, for example
`cmd.sum.role.math`.

## Pass amqplib publish and consume options

`publish` is passed to amqplib `channel.publish()` by clients, and
`consume` to `channel.consume()` by listeners:

```js
seneca.client({ type: 'amqp', url: AMQP_URL, pin: 'cmd:*', publish: { persistent: true } })
seneca.listen({ type: 'amqp', url: AMQP_URL, pin: 'cmd:*', consume: { priority: 5 } })
```

See the amqplib [channel API](https://amqp-node.github.io/amqplib/channel_api.html).

## Use TLS

Use an `amqps://` URL and pass socket options to amqplib `connect()`:

```js
const fs = require('fs')

seneca.client({
  type: 'amqp',
  pin: 'cmd:salute',
  url: 'amqps://guest:guest@rabbitmq.host:5671/seneca',
  socketOptions: {
    cert: fs.readFileSync('client/cert.pem'),
    key: fs.readFileSync('client/key.pem'),
    passphrase: 'MySecretPassword',
    ca: [fs.readFileSync('testca/cacert.pem')]
  }
})
```

The broker must be configured for TLS; see
[RabbitMQ TLS support](https://www.rabbitmq.com/docs/ssl).
