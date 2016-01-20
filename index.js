'use strict';

var defaults = require('./defaults');
var ClientHook = require('./lib/client-hook');
var ListenHook = require('./lib/listen-hook');

const PLUGIN_NAME = 'amqp-transport';

module.exports = function(opts) {
  var seneca = this;
  var so = seneca.options();
  var options = seneca.util.deepextend(defaults, so.transport, opts);
  var listen = new ListenHook(seneca, options);
  var client = new ClientHook(seneca, options);
  seneca.add({
    role: 'transport',
    hook: 'listen',
    type: 'amqp'
  }, listen.hook());
  seneca.add({
    role: 'transport',
    hook: 'client',
    type: 'amqp'
  }, client.hook());

  return {
    name: PLUGIN_NAME
  };
};
