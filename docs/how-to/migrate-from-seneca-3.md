# Migrate from Seneca 3

Goal: move a service that uses this transport from Seneca 3 and
RabbitMQ 3 to Seneca 4 and RabbitMQ 4.

## Steps

1. Upgrade the plugin to 2.3.0 or later. Older versions use amqplib 0.5,
   which offers a 4096 byte `frame_max`; RabbitMQ 4.1 and later reject it
   (`negotiated frame_max = 4096 is lower than the minimum allowed value
   (8192)`) and close the connection.

2. Keep loading the plugin as before:

   ```js
   Seneca().use('seneca-amqp-transport')
   ```

   Seneca 4 no longer bundles seneca-transport, which provides the
   transport helpers this plugin uses. The plugin loads it itself when it
   is missing; loading `seneca-transport` yourself first also works.

3. Move plugin options under `amqp` in the `use()` call (or
   `options.plugin`). Seneca 4 does not merge the instance level
   `transport` options block into the plugin.

4. Check queue options. RabbitMQ 4 refuses non-durable queues that are
   not exclusive. The defaults are fine; if you set `durable: false`,
   also set `exclusive: true`.

5. Update error handling in callers. On Seneca 4 an error from a remote
   action arrives as `err.message` equal to the original message (for
   example `boom`), not `seneca: Action cmd:fail failed: boom.`.

6. Wait for `ready` with a callback when you run on 4.0.0-rc5:
   `await new Promise((resolve) => seneca.ready(resolve))`.

## What stays the same

Queue names, exchange names, routing keys and every option keep their
Seneca 3 meaning. The messages on the wire are built by seneca-transport
helpers in both versions.
