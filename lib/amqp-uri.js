'use strict';

/**
 * Parses an object such as
 * {
 *   hostname: 'dev.rabbitmq.com',
 *   port: 5672,
 *   vhost: 'seneca',
 *   username: 'guest',
 *   password: 'guest',
 *   frameMax: 1024
 * }
 *
 * and builds an AMQP URI like:
 *
 * `amqp://guest:guest@dev.rabbitmq.com:5672/seneca?frameMax=1024`
 *
 */
const _ = require('lodash');
const Url = require('url');

module.exports = {
  format: format
};

const DEFAULTS = {
  protocol: 'amqp:',
  parameters: ['frameMax', 'channelMax', 'heartbeat', 'locale']
};

function addQueryString(uri, query) {
  query = _.pick(query, DEFAULTS.parameters);
  uri.query = _.merge({}, uri.query, query);
  return uri;
}

function addProtocol(uri) {
  var parts;
  uri = uri.trimLeft();
  if (!uri.startsWith(DEFAULTS.protocol)) {
    parts = uri.split('://');
    uri = [DEFAULTS.protocol, _.last(parts)].join('//');
  }
  return uri;
}

function addAuth(uri, auth) {
  if (!uri.auth && auth.username && auth.password) {
    uri.auth = [auth.username, auth.password].join(':');
  }
  return uri;
}

function addPort(uri, opts) {
  if (!uri.port && opts.port) {
    uri.port = opts.port;
  }
  return uri;
}

function addVHost(uri, opts) {
  var vhost = opts.vhost || opts.path;
  if (!uri.pathname && vhost) {
    uri.pathname = vhost;
  }
  return uri;
}

function format(opts) {
  var uri = opts.hostname || opts.host || opts.url;
  if (opts && uri) {
    uri = addProtocol(uri);
    uri = Url.parse(uri);
    addPort(uri, opts);
    addAuth(uri, opts);
    addVHost(uri, opts);
    addQueryString(uri, opts);
    uri = uri.format();
  }
  return uri;
}
