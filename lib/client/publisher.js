'use strict';
/**
 *
 * @module client/publisher
 */
const isObject = require('lodash/isObject');
const isFunction = require('lodash/isFunction');
const uuid = require('uuid');

// Module API
module.exports = createPublisher;

/**
 * IANA JSON Media Type string.
 * See https://tools.ietf.org/html/rfc4627
 *
 * @type {String}
 */
const JSON_CONTENT_TYPE = 'application/json';

function createPublisher(ch, {
  replyQueue, replyHandler, correlationId = uuid.v4()
} = {}) {
  if (!isObject(ch)) {
    throw new TypeError('Channel parameter `ch` must be provided (got: [' +
      typeof ch + '])');
  }
  const handleReply = isFunction(replyHandler) ? replyHandler
    : Function.prototype;

  function publish(message, exchange, rk, options) {
    const opts = Object.assign({}, options, {
      replyTo: replyQueue,
      contentType: JSON_CONTENT_TYPE,
      correlationId: correlationId
    });
    return ch.publish(exchange, rk, Buffer.from(message), opts);
  }

  function consumeReply(message) {
    // Only handle the message if it belongs to this client.
    // Consumer must supply the `correlationId` sent with the
    // original message
    if (message.properties.correlationId === correlationId) {
      const content = message.content ? message.content.toString() : undefined;
      handleReply(content);
    }
  }

  function awaitReply() {
    // Consume from callback queue and await response
    return ch.consume(replyQueue, consumeReply, {
      noAck: true
    });
  }

  const Publisher = {
    publish,
    awaitReply
  };

  return Object.create(Publisher);
}
