#!/usr/bin/env node

'use strict';

var client = require('seneca')()
  .use('..')
  .client({
    type: 'amqp',
    pin: 'role:create',
    url: process.env.AMQP_URL
  });

setInterval(function() {
  client.act('role:create', {
    max: 100,
    min: 25
  }, console.log);
}, 2000);
