'use strict';
/**
 * @module lib/listener
 */
module.exports =
  class AMQPSenecaListener {
    constructor(seneca, transport, options) {
      this.seneca = seneca;
      this.transport = transport;
      this.options = options;
      this.utils = seneca.export('transport/utils');
    }

    handleMessage(message, data) {
      return this.utils.handle_request(this.seneca, data, this.options, (out) => {
        if (!out) {
          return;
        }
        var outstr = this.utils.stringifyJSON(this.seneca, `listen-${this.options.type}`, out);
        this.transport.channel.sendToQueue(message.properties.replyTo, new Buffer(outstr));
        this.transport.channel.ack(message);
      });
    }

    consume() {
      return (message) => {
        var content = message.content ? message.content.toString() : undefined;
        var props = message.properties || {};
        if (!content || !props.replyTo) {
          return this.transport.channel.nack(message);
        }
        var data = this.utils.parseJSON(this.seneca, `listen-${this.options.type}`, content);
        return this.handleMessage(message, data);
      };
    }

    listen() {
      return this.transport.channel.consume(this.transport.queue, this.consume());
    }
  };
