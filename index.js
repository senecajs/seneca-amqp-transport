'use strict';
/**
 * @module seneca-amqp-transport
 */
const Defaults = require('./defaults');
const ClientHook = require('./lib/client-hook');
const ListenHook = require('./lib/listen-hook');

const PLUGIN_NAME = 'amqp-transport';
const TRANSPORT_TYPE = 'amqp';

module.exports = function(opts) {
  var seneca = this;
  var so = seneca.options();
  var options = seneca.util.deepextend(Defaults, so.transport, opts);
  var listen = new ListenHook(seneca);
  var client = new ClientHook(seneca);
  seneca.add({
    role: 'transport',
    hook: 'listen',
    type: TRANSPORT_TYPE
  }, listen.hook(options));
  seneca.add({
    role: 'transport',
    hook: 'client',
    type: TRANSPORT_TYPE
  }, client.hook(options));

  return {
    name: PLUGIN_NAME
  };
};
