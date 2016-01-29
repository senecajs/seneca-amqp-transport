#!/usr/bin/env node

'use strict';

var client = require('seneca')()
  .use('..')
  .client({
    type: 'amqp',
    pins: ['role:create,type:random','role:create,type:sequential'],
    url: process.env.AMQP_URL
  });

var types = ['random', 'sequential'];
for(var i = 0; i < 10; i++) {
  client.act('role:create,type:' + types[i%2], {
    max: 100,
    min: 25
  }, console.log);
}
