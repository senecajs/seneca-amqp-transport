#!/usr/bin/env node

'use strict';

require('seneca')()
  .use('..')
  .add('role:create', function(message, done) {
    return done(null, {
      pid: process.pid,
      id: Math.floor(Math.random() * (message.max - message.min + 1)) + message.min
    });
  })
  .listen({
    type: 'amqp',
    pin: 'role:create',
    url: process.env.AMQP_URL,
    socketOptions: {
      foo: 'bar'
    }
  });
