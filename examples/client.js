#!/usr/bin/env node

'use strict';

var client = require('seneca')()
  .use('..', {
    amqp: {
      url: process.env.AMQP_URL
    }
  })
  .client({
    type: 'amqp',
    pin: 'role:create'
  });

setInterval(function() {
  client.act('role:create', {
    max: 100,
    min: 25
  }, console.log);
}, 500);
