'use strict';
// A listener and a client talking over RabbitMQ, in one process.
// Start RabbitMQ first: npm run services:up
const Seneca = require('seneca');

const AMQP_URL = process.env.AMQP_URL || 'amqp://guest:guest@127.0.0.1:15673';

// In your own project, use 'seneca-amqp-transport' instead of '../..'.
const PLUGIN = process.env.AMQP_PLUGIN || require.resolve('../..');

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
