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
const _ = require('lodash');
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
  return Promise.mapSeries([
    ch.close(),
    ch.connection.close()
  ]).asCallback(done);
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
  var u = this.seneca.util;
  var tu = this.seneca.export('transport/utils');
  return (args, done) => {
    args = u.clean(u.deepextend(options[args.type], args));
    args.url = amqpuri.format(args);
    return amqp.connect(args.url, args.socketOptions)
      .then((conn) => conn.createChannel())
      .then((ch) => {
        ch.on('error', done);
        tu.close(this.seneca, _.curry(closer, ch));
        return Promise.join(
          this.setup(this.seneca, { ch, options: args }, done),
          deadletter.declareDeadLetter(args.deadLetter, ch)
        );
      }).catch(done);
  };
}
