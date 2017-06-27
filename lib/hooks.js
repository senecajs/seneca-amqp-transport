'use strict';
/**
 * Main API.
 *
 * Simple factory for creating "hook" objects composing: an object containing
 * a Seneca reference, an object defining a `hook` method, an object declaring
 * a `setup` method.
 *
 * These compositions resolve the 'this' references on './common/hooker.js'.
 *
 * Sample usage (hooking a listener):
 *
 * var listener = hooks.listenerHook(seneca);
 * seneca.add({ role: 'transport', hook: 'listen', type: 'amqp' },
 *   listener.hook(options));
 *
 * @module hooks
 */
const curry = require('lodash/curry');
const hooker = require('./common/hooker');
const Client = require('./client');
const Listener = require('./listener');

// Module API
module.exports = {
  /**
   * Creates a "hook" object, declaring a `hook` method that should be used to
   * bind an AMQP publisher's initialization with a Seneca's client
   * 'role:transport,hook:client,type:amqp' act pattern.
   *
   * See https://github.com/senecajs/seneca-transport#writing-your-own-transport
   *
   * @type {Function}
   */
  clientHook: curry(createHook)(Client),

  /**
   * Creates a "hook" object, declaring a `hook` method that should be used to
   * bind an AMQP consumers's initialization with a Seneca's listener
   * 'role:transport,hook:listen,type:amqp' act pattern.
   *
   * See https://github.com/senecajs/seneca-transport#writing-your-own-transport
   *
   * @type {Function}
   */
  listenerHook: curry(createHook)(Listener)
};

/**
 * Auxiliary private function to compose objects and create a new "hook" object
 * from a `factory` containing a `setup` method and a Seneca instance reference.
 *
 * @param  {Object} factory Any object with a `setup` function defined on it.
 * @param  {Seneca} seneca  This plugin's Seneca instance reference.
 * @return {Object}         A new composed object.
 */
function createHook(factory, seneca) {
  return Object.assign({ seneca: seneca }, hooker, factory);
}
