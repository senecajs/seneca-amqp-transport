'use strict';
/**
 * Plugin that allows Seneca listeners
 * and clients to communicate over AMQP 0-9-1.
 *
 * @module seneca-amqp-transport
 */
const defaults = require('./defaults');
const hooks = require('./lib/hooks');

const PLUGIN_NAME = 'amqp-transport';
const PLUGIN_TAG = require('./package.json').version;
const TRANSPORT_TYPE = 'amqp';

module.exports = function(opts) {
  var seneca = this;
  var so = seneca.options();
  var options = seneca.util.deepextend(defaults, so.transport, opts);
  var listener = hooks.listenerHook(seneca);
  var client = hooks.clientHook(seneca);
  seneca.add({
    role: 'transport',
    hook: 'listen',
    type: TRANSPORT_TYPE
  }, listener.hook(options));
  seneca.add({
    role: 'transport',
    hook: 'client',
    type: TRANSPORT_TYPE
  }, client.hook(options));

  return {
    tag: PLUGIN_TAG,
    name: PLUGIN_NAME
  };
};
