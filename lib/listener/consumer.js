'use strict';
/**
 * @module lib/listener/consumer
 */
const _ = require('lodash');

// Module API
module.exports = createConsumer;

function createConsumer(ch, { queue, messageHandler } = {}) {
  if (!_.isObject(ch)) {
    throw new TypeError('Channel parameter `ch` must be provided (got: [' +
      typeof ch + '])');
  }

  const handleMessage = _.isFunction(messageHandler) ? messageHandler
    : Function.prototype;

  function createReplyWith(message) {
    return function(response) {
      ch.sendToQueue(message.properties.replyTo, Buffer.from(response), {
        correlationId: message.properties.correlationId
      });
      ch.ack(message);
    };
  }

  function onMessage(message) {
    var content = message.content ? message.content.toString() : undefined;
    var props = message.properties || {};
    if (!content || !props.replyTo) {
      // Do not requeue message if there is no payload
      // or we don't know where to reply
      return ch.nack(message, false, false);
    }

    try {
      return handleMessage(content, createReplyWith(message));
    } catch (err) {
      // Failure to handle the message will result in it
      // being rejected (possibly sent to dead letter)
      ch.nack(message, false, false);
    }
  }

  const Consumer = {
    consume: (q) => ch.consume(q || queue, onMessage)
  };

  return Object.create(Consumer);
}
