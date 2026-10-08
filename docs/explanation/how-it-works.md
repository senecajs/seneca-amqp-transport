# How the transport works

## RPC over a topic exchange

The transport follows the RabbitMQ
[RPC pattern](https://www.rabbitmq.com/tutorials/tutorial-six-javascript).
Listeners own durable, named queues bound to a shared topic exchange with
routing keys derived from their pins. Clients publish to that exchange and
own a private, exclusive reply queue. The exchange does the routing, so a
client does not need to know where a listener runs, and several listener
processes with the same pin share one queue and the work in it.

Because routing keys are built from pattern keys and values, a message is
only delivered when a listener queue is bound with the same key. Pins on
both sides should therefore match.

## Lifecycle

`listen()` and `client()` dispatch `role:transport,cmd:listen|client`,
which Seneca turns into `role:transport,hook:listen|client,type:amqp`,
the actions this plugin adds. Each call opens its own connection and
channel. The plugin registers a close hook for each, so `seneca.close()`
closes them and the process can exit.

## Dead lettering

Queues are declared with `x-dead-letter-exchange: seneca.dlx` and a
message TTL (60 s for listener queues, 10 s for reply queues). Messages
that expire, or that a listener rejects because they have no body or no
`replyTo`, go to `seneca.dlx` and end up in `seneca.dlq`, where you can
inspect them.

## Relationship with seneca-transport

The message format, request tracking and reply handling are not
implemented here. The plugin uses the helpers (`make_client`,
`handle_request`, `prepare_request`, `resolve_pins` and others) exported by
seneca-transport as `transport/utils`. Seneca 3 bundled seneca-transport;
Seneca 4 does not, so the plugin depends on seneca-transport and loads it
when the helpers are missing.

## Seneca 3 versus Seneca 4

| Topic | Seneca 3 | Seneca 4 |
| ----- | -------- | -------- |
| seneca-transport | bundled | loaded by this plugin |
| Close pattern | `role:seneca,cmd:close` | `sys:seneca,cmd:close` |
| Message metadata in the client | `args.meta$` | separate `meta` argument |
| Instance `transport` options | merged into plugin options | not merged |
| Remote error message | `seneca: Action <pattern> failed: <message>.` | original `<message>` |

The plugin handles the first three itself.

## Limits

* AMQP 0-9-1 only (RabbitMQ). amqplib 2 is required for RabbitMQ 4.1 and
  later, which reject the small `frame_max` older amqplib versions offer.
* A message is acknowledged as soon as it is handed to Seneca, not when the
  action finishes; a crash during the action loses the message.
* A separate `port` connection field is not applied; put the port in `url`.
* RabbitMQ 4 refuses non-exclusive, non-durable queues.
