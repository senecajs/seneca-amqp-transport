#!/usr/bin/env node
'use strict';

require('seneca')()
  .use('..')
  .add('cmd:log,level:*', function(req, done) {
    console[req.level](req.message);
    return done(null, { ok: true, when: Date.now() });
  })
  .listen({
    type: 'amqp',
    pin: 'cmd:log,level:*',
    url: process.env.AMQP_URL
  });
