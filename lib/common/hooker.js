'use strict';
/**
 * Composable module that allows clients and listeners to wrapped their
 * initialization process in a Seneca action function that will run on
 * 'role:transport,hook:*,type:amqp' patterns.
 *
 * A "hook" object serves as the bridge between the AMQP transport and the
 * Seneca world.
 *
 * @module lib/common/hooker
 */
const curry = require('lodash/curry');
const Promise = require('bluebird');
const amqp = require('amqplib');
const amqpuri = require('amqpuri');
const deadletter = require('./dead-letter');

// Module API
module.exports = {
  hook
};

/**
 * Closes the channel and its connection.
 *
 * @param  {Channel} ch  amqplib Channel object
 * @param  {Function} done Callback to be called upon taking action
 * @return {Promise}       Fulfills when both the channel and the
 *                         connection has been closed.
 */
function closer(ch, done) {
  return ch.close()
    .then(() => ch.connection.close())
    .asCallback(done);
}

/**
 * Creates a valid options object to be used during this plugin's setup.
 * The resulting object is created by extending the settings defined under
 * `amqp` on the global `.use()` (see http://senecajs.org/api/#method-use)
 * call and the local options given to `.client()` or `.listen()`.
 * It also adds an `url` property containing a proper amqp(s):// connection URI.
 *
 * @param  {Seneca} seneca  The seneca instance.
 * @param  {Object} args    Seneca's global settings (provided to `.use()`)
 * @param  {Object} options The client or listener options objecft.
 * @return {Object}         The final plugin's options object.
 */
function buildPluginOptions(seneca, args, options) {
  const { clean, deepextend } = seneca.util;
  const amqpUrl = amqpuri.format(args);
  return Object.assign(
    clean(deepextend(options[args.type], args)),
    { url: amqpUrl }
  );
}

/**
 * Main API function that builds and returns a Seneca action function that
 * should run on 'role:transport,hook:*,type:amqp' patterns.
 *
 * The returned function initializes an actor (AMQP consumer or publisher),
 * declaring all needed queues, exchanges and bindings on the broker.
 *
 * @param  {Object} options Plugin configuration object
 * @return {Function}       A Seneca action function with
 *                          a nodejs style callback
 */
function hook(options) {
  const transportUtils = this.seneca.export('transport/utils');
  const terminateConnection = curry(closer);
  return (args, done) => {
    const pluginOptions = buildPluginOptions(this.seneca, args, options);
    return amqp.connect(pluginOptions.url, pluginOptions.socketOptions)
      .then((conn) => conn.createChannel())
      .then((ch) => {
        ch.on('error', done);
        transportUtils.close(this.seneca, terminateConnection(ch));
        return Promise.join(
          this.setup(this.seneca, { ch, options: pluginOptions }, done),
          deadletter.declareDeadLetter(ch, pluginOptions.deadLetter)
        );
      }).catch(done);
  };
}
