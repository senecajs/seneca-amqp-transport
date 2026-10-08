# Messages

The plugin adds two transport hook actions and one close hook. You do not
call them directly: Seneca calls them when you use `listen()` and
`client()` with `type: 'amqp'`.

## Plugin registration

`use('seneca-amqp-transport')` registers a plugin named `amqp-transport`
whose tag is the package version. If the `transport/utils` export does not
provide the seneca-transport helpers (Seneca 4 without seneca-transport),
the plugin loads seneca-transport first. The plugin has no exports and
defines no error codes.

## role:transport,hook:listen,type:amqp

Called by `seneca.listen({ type: 'amqp', ... })`.

* Parameters: the [connection settings](options.md#connection-settings).
* Effect: connects, creates one channel, sets `prefetch`, asserts the
  exchange, asserts the listener queue, binds it once per pin, declares
  the dead letter exchange and queue, and starts consuming.
* Reply: empty, once the consumer is started.
* Errors: connection or declaration errors from amqplib, unchanged (for
  example `ECONNREFUSED`). Seneca treats a failing listen as fatal.

Queue name: `name` if given, else
`<prefix><separator><key:value>...` built from the pins, with values of the
same key joined by `_` and `*` replaced by `any`. For example the pins
`role:math,cmd:sum` and `role:math,cmd:product` give
`seneca.add.role:math.cmd:sum_product`.

Binding keys: one per pin, keys sorted, `key.value` pairs joined by `.`,
with `.` inside values escaped as `[:dot:]`. `cmd:salute` gives
`cmd.salute`; `role:math,cmd:sum` gives `cmd.sum.role.math`.

For each message the listener requires a body and a `replyTo` property;
otherwise the message is rejected without requeue (dead lettered). The
message is passed to the matching Seneca action and the reply is sent to
the `replyTo` queue with the same `correlationId`. The message is
acknowledged after it is handed to Seneca.

## role:transport,hook:client,type:amqp

Called by `seneca.client({ type: 'amqp', ... })`.

* Parameters: the [connection settings](options.md#connection-settings).
* Effect: connects, creates one channel, sets `prefetch`, asserts the
  exchange and a reply queue `<prefix><separator><id>`, declares the dead
  letter exchange and queue, and consumes replies (`noAck`).
* Reply: empty, once the client is ready.
* Errors: as for listen.

Each outbound message is serialized as JSON by the seneca-transport
helpers and published to the exchange with the routing key derived from
the message (keys of the matched pin, sorted, values taken from the
message), and the properties `replyTo`, `contentType: application/json`
and `correlationId`. Replies with another correlation id are ignored.

## Close hook

For each connection the plugin adds a close hook that closes the channel
and its connection, then calls the prior close action. It uses
`sys:seneca,cmd:close` on Seneca 4 and `role:seneca,cmd:close` on
Seneca 3. Errors while closing are logged, not returned.
