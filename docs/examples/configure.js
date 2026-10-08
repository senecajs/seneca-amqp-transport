'use strict';
// Plugin options (under `amqp`) and per-connection options.
// Start RabbitMQ first: npm run services:up
const Seneca = require('seneca');

const AMQP_URL = process.env.AMQP_URL || 'amqp://guest:guest@127.0.0.1:15673';
const PLUGIN = process.env.AMQP_PLUGIN || require.resolve('../..');

// Plugin options apply to every client and listener of this instance.
const options = {
  amqp: {
    exchange: {
      name: 'docs.topic',
      options: { durable: false, autoDelete: true }
    },
    // RabbitMQ 4 only allows non-durable queues when they are exclusive.
    listener: {
      queues: { options: { durable: false, exclusive: true } }
    }
  }
};

function ready(seneca) {
  return new Promise((resolve, reject) =>
    seneca.ready(err => (err ? reject(err) : resolve()))
  );
}

async function main() {
  const listener = Seneca({ log: 'silent' })
    .use(PLUGIN, options)
    .add('role:math,cmd:sum', (msg, reply) => reply({ sum: msg.a + msg.b }))
    .add('role:math,cmd:product', (msg, reply) =>
      reply({ product: msg.a * msg.b })
    )
    // Per-connection options: two pins, an explicit queue name.
    .listen({
      type: 'amqp',
      url: AMQP_URL,
      pins: ['role:math,cmd:sum', 'role:math,cmd:product'],
      name: 'docs.math'
    });
  await ready(listener);

  const client = Seneca({ log: 'silent' })
    .use(PLUGIN, options)
    .client({
      type: 'amqp',
      url: AMQP_URL,
      pin: 'role:math,cmd:*',
      // Passed to amqplib channel.publish()
      publish: { persistent: true }
    });
  await ready(client);

  console.log(await client.post('role:math,cmd:sum,a:2,b:3'));
  console.log(await client.post('role:math,cmd:product,a:2,b:3'));

  await client.close();
  await listener.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
