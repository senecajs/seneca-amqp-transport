'use strict';
/**
 * @module lib/client
 */
const amqputil = require('./client-util');
const uuid = require('uuid');

const JSON_CONTENT_TYPE = 'application/json';

// Module API
module.exports = createClient;

function createClient(seneca, { ch, queue, exchange, options }) {
  var utils = seneca.export('transport/utils');
  var correlationId = uuid.v4();

  function publish(args, done) {
    var outmsg = utils.prepare_request(seneca, args, done);
    var outstr = utils.stringifyJSON(seneca, 'client-' + options.type, outmsg);
    var opts = {
      replyTo: queue,
      contentType: JSON_CONTENT_TYPE,
      correlationId: correlationId
    };
    var topic = amqputil.resolveClientTopic(args);
    return ch.publish(exchange, topic, Buffer.from(outstr), opts);
  }

  function consumeReply(message) {
    // Only handle the message if it belongs to this client.
    // Consumer must supply the `correlationId` sent with the
    // original message
    if (message.properties.correlationId === correlationId) {
      var content = message.content ? message.content.toString() : undefined;
      var input = utils.parseJSON(seneca, 'client-' + options.type, content);
      utils.handle_response(seneca, input, options);
    }
  }

  function awaitReply() {
    return ch.consume(queue, consumeReply, {
      noAck: true
    });
  }

  function callback(spec, topic, sendDone) {
    return awaitReply()
      .then(() => sendDone(null, publish))
      .catch(sendDone);
  }

  const Client = {
    start(done) {
      ch.on('error', done);
      return utils.make_client(seneca, callback, options, done);
    }
  };

  return Object.create(Client);
}
