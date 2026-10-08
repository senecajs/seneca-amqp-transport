# Getting started

In this tutorial you run a Seneca listener and a Seneca client that talk
to each other through RabbitMQ. It takes about five minutes.

## 1. Install

You need Node 22 or 24 and a RabbitMQ broker. In a clone of this
repository, Docker Compose starts one on `127.0.0.1:15673`:

```sh
npm install
npm run services:up
```

In your own project:

```sh
npm install seneca seneca-amqp-transport
```

## 2. The program

Save this as `getting-started.js` (it is
[docs/examples/getting-started.js](../examples/getting-started.js) in this
repository, where it loads the plugin from the checkout):

```js
'use strict';
const Seneca = require('seneca');

const AMQP_URL = process.env.AMQP_URL || 'amqp://guest:guest@127.0.0.1:15673';
const PLUGIN = 'seneca-amqp-transport';

async function main() {
  const listener = Seneca({ log: 'silent' })
    .use(PLUGIN)
    .add('cmd:salute', function(msg, reply) {
      reply(null, { message: `Hello ${msg.name}!` });
    })
    .listen({ type: 'amqp', pin: 'cmd:salute', url: AMQP_URL });

  await new Promise((resolve, reject) =>
    listener.ready(err => (err ? reject(err) : resolve()))
  );

  const client = Seneca({ log: 'silent' })
    .use(PLUGIN)
    .client({ type: 'amqp', pin: 'cmd:salute', url: AMQP_URL });

  await new Promise((resolve, reject) =>
    client.ready(err => (err ? reject(err) : resolve()))
  );

  const out = await client.post('cmd:salute', { name: 'World' });
  console.log(out);

  await client.close();
  await listener.close();
  console.log('closed');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
```

## 3. Run it

```sh
node docs/examples/getting-started.js
```

Output (Seneca 4.0.0-rc5, RabbitMQ 4.3):

```
{ message: 'Hello World!' }
closed
```

The process exits by itself: closing each Seneca instance also closes its
AMQP channel and connection.

## 4. What happened

1. `listen({ type: 'amqp', pin: 'cmd:salute' })` connected to RabbitMQ,
   declared the topic exchange `seneca.topic`, a durable queue named
   `seneca.add.cmd:salute`, and bound the queue to the exchange with the
   routing key `cmd.salute`. It also declared the dead letter exchange
   `seneca.dlx` and queue `seneca.dlq`.
2. `client({ type: 'amqp', pin: 'cmd:salute' })` declared the same
   exchange and an exclusive, auto deleted reply queue such as
   `seneca.act.1a2b3c4d`, and started consuming from it.
3. `client.post('cmd:salute', ...)` matched the client pin, so the message
   was published to `seneca.topic` with routing key `cmd.salute` and a
   `replyTo` and `correlationId` property.
4. The listener consumed it, ran the local `cmd:salute` action, and sent
   the reply to the `replyTo` queue. The client matched the correlation
   id and resolved the promise.

You waited for `ready` with the callback form because
`await seneca.ready()` can hang on an idle instance in 4.0.0-rc5.

## 5. Next steps

* [Configure the transport](../how-to/configure-the-transport.md) for
  your own exchange, queues and broker address.
* [Options](../reference/options.md) lists every setting.
* [How the transport works](../explanation/how-it-works.md) explains the
  design and its limits.
