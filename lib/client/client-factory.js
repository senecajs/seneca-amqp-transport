'use strict';
/**
 * AMQP RPC client/publisher factory. This is the underlying representantion
 * of a Seneca client using an AMQP transport.
 *
 * @module lib/client/client-factory
 */
const amqputil = require('./client-util');
const uuid = require('uuid');

/**
 * IANA JSON Media Type string.
 * See https://tools.ietf.org/html/rfc4627
 *
 * @type {String}
 */
const JSON_CONTENT_TYPE = 'application/json';

// Module API
module.exports = createClient;

/**
 * Closure factory function that creates AMQP RPC Client (publisher) objects.
 * A "Client" publishes AMQP messages to a fixed `exchange` with a routing key
 * built from a Seneca action pattern, like 'command:say,message:hi'.
 * It then starts consuming from a randomly named callback queue where it
 * expects a response from the remote service.
 *
 * See https://www.rabbitmq.com/tutorials/tutorial-six-javascript.html
 *
 * @param  {Seneca} seneca           This plugin's Seneca instance.
 * @param  {Channel} options.ch       Channel used for AMQP operations.
 * @param  {String} options.queue    Name of the callback queue.
 * @param  {String} options.exchange Name of the exchange to publish to.
 * @param  {Object]} options.options  General plugin's options.
 * @return {Client}                  A ready AMQP RPC client.
 */
function createClient(seneca, { ch, queue, exchange, options }) {
  var utils = seneca.export('transport/utils');
  var correlationId = uuid.v4();

  function publish(args, done) {
    var outmsg = utils.prepare_request(seneca, args, done);
    var outstr = utils.stringifyJSON(seneca, `client-${options.type}`, outmsg);
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
      var input = utils.parseJSON(seneca, `client-${options.type}`, content);
      utils.handle_response(seneca, input, options);
    }
  }

  function awaitReply() {
    // Consume from callback queue and await response
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
    /**
     * Constructs a Seneca client and immediately bounds `seneca.act` calls
     * to AMQP RPC calls (assuming the proper 'role:transport,hook:client'
     * pattern was added before).
     *
     * @param  {Function} done Async callback function.
     * @return {undefined}
     */
    start(done) {
      ch.on('error', done);
      return utils.make_client(seneca, callback, options, done);
    }
  };

  return Object.create(Client);
}
