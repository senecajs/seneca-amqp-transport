#!/usr/bin/env node

'use strict';

require('seneca')()
  .use('..')
  .add('action:get_time', function(message, done) {
    console.log(`[action:get_time] Action ${message.id} received`);
    return done(null, {
      pid: process.pid,
      time: 'Current time is ' + Date.now() + 'ms'
    });
  })
  .add('level:log', function(message, done) {
    console[message.level](`[level:log] Action ${message.id} wants to log: ${message.text}`);
    return done(null, {
      pid: process.pid,
      status: `Message ${message.id} logged successfully`
    });
  })
  .add('proc:status', function(message, done) {
    console.log(`[action:status] Action ${message.id} received`);
    return done(null, {
      pid: process.pid,
      status: `Process ${process.pid} status: OK`
    });
  })
  .listen({
    type: 'amqp',
    pin: ['action:get_time', 'level:*', 'proc:status'],
    name: 'seneca.multi-task.queue',
    url: process.env.AMQP_URL
  });
