#!/usr/bin/env node
'use strict';

const Path = require('path');

require('seneca')()
  .use('..')
  .add('cmd:salute', function(message, done) {
    return done(null, {
      id: Math.floor(Math.random() * (message.max - message.min + 1)) + message.min,
      message: `Hello ${message.name}!`,
      from: {
        pid: process.pid,
        file: Path.relative(process.cwd(), __filename)
      },
      now: Date.now()
    });
  })
  .add('cmd:log,level:*', function(req, done) {
    console[req.level](req.message);
    return done(null, { ok: true });
  })
  .listen({
    type: 'amqp',
    pin: ['cmd:salute', 'cmd:log,level:*'],
    url: process.env.AMQP_URL
  });
