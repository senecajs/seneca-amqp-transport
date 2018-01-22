#!/usr/bin/env node
'use strict'

const client = require('seneca')()
  .use('..')
  .client({
    type: 'amqp',
    pin: 'cmd:salute',
    url: process.env.AMQP_URL
  })

setInterval(function() {
  client.act(
    'cmd:salute',
    {
      name: 'World',
      max: 100,
      min: 25
    },
    (err, res) => {
      if (err) {
        throw err
      }
      console.log(res)
    }
  )
}, 2000)
