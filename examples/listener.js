#!/usr/bin/env node

'use strict';

require('seneca')()
  .use('..')
  .add('role:create,type:random', createRandom)
  .add('role:create,type:sequential', createSequential)
  .listen({
    type: 'amqp',
    pins: ['role:create,type:random', 'role:create,type:sequential'],
    url: process.env.AMQP_URL,
    socketOptions: {
      foo: 'bar'
    }
  });

function createRandom(message, done) {
  return done(null, {
    pid: process.pid,
    id: Math.floor(Math.random() * (message.max - message.min + 1)) + message.min,
    type: 'random'
  });
}

var seq = null;
function createSequential(message, done) {
  if(seq === null) {
    seq = message.min;
  }
  return done(null, {
    pid: process.pid,
    id: seq++,
    type: 'sequential'
  });
}
