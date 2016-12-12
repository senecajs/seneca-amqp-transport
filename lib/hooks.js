'use strict';
/**
 * @module hooks
 */
const _ = require('lodash');
const hooker = require('./common/hooker');
const Client = require('./client');
const Listener = require('./listener');

// Module API
module.exports = {
  clientHook: _.curry(createHook)(Client),
  listenerHook: _.curry(createHook)(Listener)
};

function createHook(factory, seneca) {
  return Object.assign({ seneca: seneca }, hooker, factory);
}
