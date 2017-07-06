'use strict';
/**
 * @module lib/listener/consumer
 */
const isObject = require('lodash/isObject');
const isFunction = require('lodash/isFunction');
const curry = require('lodash/curry');

// Module API
module.exports = createConsumer;

function createConsumer(ch, { queue, messageHandler } = {}) {
  if (!isObject(ch)) {
    throw new TypeError('Channel parameter `ch` must be provided (got: [' +
      typeof ch + '])');
  }

  const handleMessage = isFunction(messageHandler) ? messageHandler
    : Function.prototype;

  function createReplyWith(message, response) {
    return ch.sendToQueue(message.properties.replyTo, Buffer.from(response), {
      correlationId: message.properties.correlationId
    });
  }

  function onMessage(message) {
    if (message) {
      var content = message.content ? message.content.toString() : undefined;
      var props = message.properties || {};
      if (!content || !props.replyTo) {
        // Do not requeue message if there is no payload
        // or we don't know where to reply
        return ch.nack(message, false, false);
      }

      try {
        handleMessage(content, curry(createReplyWith)(message));
        ch.ack(message);
      } catch (err) {
        // Failure to handle the message will result in it
        // being rejected (possibly sent to dead letter)
        ch.nack(message, false, false);
      }
    }
  }

  const Consumer = {
    consume: (q, options) => ch.consume(q || queue, onMessage, options)
  };

  return Object.create(Consumer);
}
