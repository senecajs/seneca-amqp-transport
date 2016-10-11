'use strict';
/**
 * @module lib/client
 */
const Amqputil = require('./amqp-util');
const Uuid = require('uuid');

const JSON_CONTENT_TYPE = 'application/json';

module.exports =
  class AMQPSenecaClient {
    constructor(seneca, transport, options) {
      this.seneca = seneca;
      this.transport = transport;
      this.options = options;
      this.utils = seneca.export('transport/utils');
      this.correlationId = Uuid.v4();
    }

    callback() {
      return (spec, topic, sendDone) => this.awaitReply()
        .done(() => sendDone(null, this.publish()), sendDone);
    }

    publish() {
      return (args, done) => {
        var outmsg = this.utils.prepare_request(this.seneca, args, done);
        var outstr = this.utils.stringifyJSON(this.seneca, 'client-' + this.options.type, outmsg);
        var opts = {
          replyTo: this.transport.queue,
          contentType: JSON_CONTENT_TYPE,
          correlationId: this.correlationId
        };
        var topic = Amqputil.resolveClientTopic(args);
        return this.transport.channel.publish(this.transport.exchange, topic, new Buffer(outstr), opts);
      };
    }

    consumeReply() {
      return (message) => {
        // Only handle the message if it belongs to this client.
        // Consumer must supply the `correlationId` sent with the
        // original message
        if (message.properties.correlationId === this.correlationId) {
          var content = message.content ? message.content.toString() : undefined;
          var input = this.utils.parseJSON(this.seneca, 'client-' + this.options.type, content);
          this.utils.handle_response(this.seneca, input, this.options);
        }
      };
    }

    awaitReply() {
      return this.transport.channel.consume(this.transport.queue,
        this.consumeReply(), {
          noAck: true
        });
    }
  };
