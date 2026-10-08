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
  // amqplib >= 0.10 returns native promises; wrap them for `.asCallback`.
  return Promise.resolve(ch.close())
    .then(() => ch.connection.close())
    .asCallback(done);
}

/**
 * Registers `closer` to run when the Seneca instance closes.
 * Seneca 3 closes via role:seneca,cmd:close; Seneca 4 via sys:seneca,cmd:close.
 *
 * @param {Seneca} seneca The seneca instance.
 * @param {Function} closer Called with a node style callback.
 */
function addCloseHook(seneca, closer) {
  const closePattern = seneca.version.startsWith('3.')
    ? 'role:seneca,cmd:close'
    : 'sys:seneca,cmd:close';
  seneca.add(closePattern, function(msg, reply) {
    const self = this;
    closer(function(err) {
      if (err) {
        self.log.error(err);
      }
      self.prior(msg, reply);
    });
  });
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
  // An explicit `url` wins over the `host`/`port` defaults that Seneca core
  // adds to every client/listen config (otherwise the url is ignored).
  const uriArgs = args.url
    ? Object.assign({}, args, {
        hostname: undefined,
        host: undefined,
        port: undefined
      })
    : args;
  const amqpUrl = amqpuri.format(uriArgs);
  return Object.assign(clean(deepextend(options[args.type], args)), {
    url: amqpUrl
  });
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
  const terminateConnection = curry(closer);
  return (args, done) => {
    const pluginOptions = buildPluginOptions(this.seneca, args, options);
    return amqp
      .connect(pluginOptions.url, pluginOptions.socketOptions)
      .then(conn => conn.createChannel())
      .then(ch => {
        ch.on('error', done);
        addCloseHook(this.seneca, terminateConnection(ch));
        return Promise.join(
          this.setup(this.seneca, { ch, options: pluginOptions }, done),
          deadletter.declareDeadLetter(ch, pluginOptions.deadLetter)
        );
      })
      .catch(done);
  };
}
