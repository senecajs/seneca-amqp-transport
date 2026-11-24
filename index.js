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

  // The `transport/utils` helpers this plugin relies on (such as
  // make_client) come from @seneca/transport, not from Seneca 4 core, so
  // load it unless the application already has.
  var tu = seneca.export('transport/utils');
  if (!tu || 'function' !== typeof tu.make_client) {
    seneca.use(require('@seneca/transport'));
  }

  // Seneca 4 does not merge the core `transport` options block into
  // plugins; `so.transport` is still honoured when present.
  var options = seneca.util.deep(defaults, so.transport, opts);
  var listener = hooks.listenerHook(seneca);
  var client = hooks.clientHook(seneca);
  seneca.add(
    {
      role: 'transport',
      hook: 'listen',
      type: TRANSPORT_TYPE
    },
    listener.hook(options)
  );
  seneca.add(
    {
      role: 'transport',
      hook: 'client',
      type: TRANSPORT_TYPE
    },
    client.hook(options)
  );

  return {
    tag: PLUGIN_TAG,
    name: PLUGIN_NAME
  };
};
