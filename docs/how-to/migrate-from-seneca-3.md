# Migrate from Seneca 3

Goal: move a service that uses this transport from Seneca 3 and
RabbitMQ 3 to Seneca 4 and RabbitMQ 4.

## Steps

1. Install the Seneca 4 version of the plugin, which has a new package
   name, and remove `seneca-amqp-transport` from your dependencies:

   ```sh
   npm install seneca@^4 @seneca/amqp-transport
   ```

   Version 3.0.0 and later need Seneca 4; Seneca 3 users stay on
   `seneca-amqp-transport@2`. Versions before 3.0.0 use amqplib 0.5,
   which offers a 4096 byte `frame_max`; RabbitMQ 4.1 and later reject it
   (`negotiated frame_max = 4096 is lower than the minimum allowed value
   (8192)`) and close the connection.

2. Load the plugin by its new name:

   ```js
   Seneca().use('@seneca/amqp-transport')
   ```

   Seneca 4 no longer bundles seneca-transport, which provides the
   transport helpers this plugin uses. The plugin depends on
   `@seneca/transport`, its Seneca 4 version, and loads it when it is
   missing; loading `@seneca/transport` yourself first also works.

3. Move plugin options under `amqp` in the `use()` call (or
   `options.plugin`). Seneca 4 does not merge the instance level
   `transport` options block into the plugin.

4. Check queue options. RabbitMQ 4 refuses non-durable queues that are
   not exclusive. The defaults are fine; if you set `durable: false`,
   also set `exclusive: true`.

5. Update error handling in callers. On Seneca 4 an error from a remote
   action arrives as `err.message` equal to the original message (for
   example `boom`), not `seneca: Action cmd:fail failed: boom.`.

6. Run on Node.js 24 or later.

## What stays the same

Queue names, exchange names, routing keys and every option keep their
Seneca 3 meaning. The messages on the wire are built by the
seneca-transport helpers in both versions (`@seneca/transport` on
Seneca 4).
