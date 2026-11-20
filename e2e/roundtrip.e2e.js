'use strict';

const { describe, it, before, after } = require('../test/shared');

const chai = require('chai');
const DirtyChai = require('dirty-chai');
chai.should();
chai.use(DirtyChai);

const Seneca = require('seneca');

// Matches docker-compose.yml (npm run services:up).
const AMQP_URL = process.env.AMQP_URL || 'amqp://guest:guest@127.0.0.1:15673';
const PIN = 'role:e2e,cmd:*';

function ready(instance) {
  return new Promise((resolve, reject) =>
    instance.ready(err => (err ? reject(err) : resolve()))
  );
}

describe("A Seneca client and listener with type:'amqp'", function() {
  const listener = Seneca({ log: 'silent' })
    .use('..')
    .add('role:e2e,cmd:echo', function(msg, reply) {
      // Reply in reverse order of arrival, so that replies overtake requests.
      setTimeout(() => reply(null, { x: msg.x }), 50 - msg.x * 5);
    })
    .add('role:e2e,cmd:fail', function(msg, reply) {
      const err = new Error('e2e failure ' + msg.x);
      err.code = 'e2e_failed';
      reply(err);
    })
    .listen({ type: 'amqp', url: AMQP_URL, pin: PIN });

  const client = Seneca({ log: 'silent' })
    .use('..')
    .client({ type: 'amqp', url: AMQP_URL, pin: PIN });

  before(function() {
    return ready(listener).then(() => ready(client));
  });

  after(function() {
    return client.close().then(() => listener.close());
  });

  it('should give each of several concurrent acts its own reply', function() {
    const xs = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    return Promise.all(
      xs.map(x => client.post('role:e2e,cmd:echo', { x }))
    ).then(outs => {
      outs.map(out => out.x).should.eql(xs);
    });
  });

  it('should pass a remote action error to the caller', function() {
    return client.post('role:e2e,cmd:fail', { x: 1 }).then(
      () => {
        throw new Error('the act should have failed');
      },
      err => {
        err.code.should.equal('e2e_failed');
        err.message.should.contain('e2e failure 1');
      }
    );
  });

  it('should keep listening after a remote action error', function() {
    return client
      .post('role:e2e,cmd:echo', { x: 2 })
      .then(out => out.x.should.equal(2));
  });
});
