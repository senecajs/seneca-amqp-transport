'use strict';
/**
 * @module lib/common/hook
 */
const Promise = require('bluebird');
const amqp = require('amqplib');
const amqpuri = require('amqpuri');
const deadletter = require('./dead-letter');

// Module API
module.exports = {
  hook
};

function closer(ch) {
  return function(done) {
    return Promise.mapSeries([
      ch.close(),
      ch.connection.close()
    ]).asCallback(done);
  };
}

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
        tu.close(this.seneca, closer(ch));
        return Promise.join(
          this.setup(this.seneca, { ch, options: args }, done),
          deadletter.declareDeadLetter(args.deadLetter, ch)
        );
      }).catch(done);
  };
}
