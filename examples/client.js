#!/usr/bin/env node

var client = require('seneca')()
    .use(require('..'))
    .client({type: 'amqp'});

setInterval(function() {
    client.act({generate:'id'}, function(err, result) {
        console.log(JSON.stringify(result));
    });
}, 500);
