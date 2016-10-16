#!/usr/bin/env node
'use strict';

var client = require('seneca')()
  .use('..')
  .client({
    type: 'amqp',
    pin: 'cmd:log,level:log',
    url: process.env.AMQP_URL
  });

setInterval(function() {
  client.act('cmd:log,level:log', {
    message: 'Hello World'
  }, (err, res) => {
    if (err) {
      throw err;
    }
    console.log(res);
  });
}, 2000);
