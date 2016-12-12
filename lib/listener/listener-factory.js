'use strict';
/**
 * @module lib/listener/listener
 */

module.exports = createListener;

function createListener(seneca, { ch, queue, options }) {
  var utils = seneca.export('transport/utils');

  function handleMessage(message, data) {
    return utils.handle_request(seneca, data, options, function(out) {
      if (!out) {
        return;
      }
      var outstr = utils.stringifyJSON(seneca, `listen-${options.type}`, out);
      ch.sendToQueue(message.properties.replyTo, Buffer.from(outstr), {
        correlationId: message.properties.correlationId
      });
      ch.ack(message);
    });
  }

  function consume(message) {
    var content = message.content ? message.content.toString() : undefined;
    var props = message.properties || {};
    if (!content || !props.replyTo) {
      // Do not requeue message if there is no payload
      // or we don't know where to reply
      return ch.nack(message, false, false);
    }
    var data = utils.parseJSON(seneca, `listen-${options.type}`, content);
    return handleMessage(message, data);
  }

  const Listener = {
    listen() {
      return ch.consume(queue, consume);
    }
  };

  return Object.create(Listener);
}
