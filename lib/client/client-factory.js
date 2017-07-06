'use strict';
/**
 * AMQP RPC client/publisher factory. This is the underlying representantion
 * of a Seneca client using an AMQP transport.
 *
 * @module lib/client/client-factory
 */
const Promise = require('bluebird');
const Publisher = require('./publisher');
const amqputil = require('./client-util');

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
 * @param  {Object} options.options  General plugin's options.
 * @return {Client}                  A ready AMQP RPC client.
 */
function createClient(seneca, { ch, queue, exchange, options = {} }) {
  const utils = seneca.export('transport/utils');

  function handleResponse(res) {
    const input = utils.parseJSON(seneca, `client-${options.type}`, res);
    return utils.handle_response(seneca, input, options);
  }

  const pub = Publisher(ch, {
    replyQueue: queue,
    replyHandler: handleResponse,
    correlationId: options.correlationId
  });

  function act(args, done) {
    const outmsg = utils.prepare_request(seneca, args, done);
    const outstr = utils.stringifyJSON(seneca, `client-${options.type}`, outmsg);
    const topic = amqputil.resolveClientTopic(args);
    return pub.publish(outstr, exchange, topic, options.publish);
  }

  function callback(spec, topic, sendDone) {
    return pub.awaitReply()
      .then(() => sendDone(null, act))
      .catch(sendDone);
  }

  const Client = {
    started: false,
    /**
     * Constructs a Seneca client and immediately bounds `seneca.act` calls
     * to AMQP RPC calls (assuming the proper 'role:transport,hook:client'
     * pattern was added before).
     *
     * @param  {Function} done Async callback function.
     * @return {Promise}
     */
    start(done) {
      ch.on('error', done);
      return Promise.resolve(utils.make_client(seneca, callback, options, done))
        .then(() => {
          this.started = true;
          return this;
        });
    }
  };

  return Object.create(Client);
}
