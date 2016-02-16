#!/usr/bin/env node

'use strict';

var client = require('seneca')()
  .use('..')
  .client({
    type: 'amqp',
    pin: ['action:get_time', 'level:*', 'proc:status'],
    url: process.env.AMQP_URL
  });

setInterval(function() {
  client.act('action:get_time', {
    id: Math.floor(Math.random() * 91) + 10
  }, console.log);

  client.act('level:log', {
    id: Math.floor(Math.random() * 91) + 10,
    text: '[level:log] Print out this random number: ' + 100 * Math.random()
  }, console.log);

  client.act('proc:status', {
    id: Math.floor(Math.random() * 91) + 10
  }, console.log);
}, 500);
