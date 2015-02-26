#!/usr/bin/env node

require('seneca')()
    .use(require('..'))
    .add({generate:'id'},
        function(message, done) {
            setTimeout(function() {
                done(null, {pid: process.pid, id: '' + Math.random()});
            }, Math.random()*100);
        })
    .act({generate: 'id'}, console.log)
    .listen({type: 'amqp'});

