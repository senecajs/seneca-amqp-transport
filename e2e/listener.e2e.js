'use strict';

const chai = require('chai');
const DirtyChai = require('dirty-chai');
chai.should();
chai.use(DirtyChai);

const amqp = require('amqplib');
const seneca = require('seneca')();

const QUEUE_NAME = 'seneca.add.cmd:test.role:listener';
const EXCHANGE_NAME = 'seneca.topic';
const RK = 'cmd.test.role.listener';

function deleteQueue(ch, queue) {
  return ch.deleteQueue(queue)
    .thenReturn(ch)
    .catch(() => ch.connection.createChannel());
}

function deleteExchange(ch, queue) {
  return ch.deleteExchange(queue)
    .thenReturn(ch)
    .catch(() => ch.connection.createChannel());
}

describe('A Seneca listener with type:\'amqp\'', function() {
  var ch = null;
  var listener = seneca.use('..', {
    exchange: {
      name: EXCHANGE_NAME,
      options: {
        durable: false,
        autoDelete: true
      }
    },
    listener: {
      queues: {
        options: {
          durable: false,
          exclusive: true
        }
      }
    }
  });

  before(function() {
    // Connect to the broker, delete queue and exchange, and then declare
    // the actual listener. This is to properly test creation of needed AMQP
    // elements during listener initialization.
    return amqp.connect(process.env.AMQP_URL)
      .then((conn) => conn.createChannel())
      .then((channel) => deleteQueue(channel, QUEUE_NAME))
      .then((channel) => deleteExchange(channel, EXCHANGE_NAME))
      .then(function(channel) {
        seneca.listen({
          type: 'amqp',
          url: process.env.AMQP_URL,
          pin: 'cmd:test,role:listener'
        });
        ch = channel;
      });
  });

  before(function(done) {
    seneca.ready(() => done());
  });

  after(function() {
    // Close both the channel and the connection to the AMQP broker
    // Declared queue and exchange should be automatically deleted on
    // disconnection
    return ch.close()
      .then(() => ch.connection.close());
  });

  after(function() {
    seneca.close();
  });

  it('should declare a new properly named queue in the broker', function(done) {
    ch.checkQueue(QUEUE_NAME)
      .then(function(ok) {
        ok.queue.should.eq(QUEUE_NAME);
      }).asCallback(done);
  });

  it('should declare an exchange in the broker', function(done) {
    ch.checkExchange(EXCHANGE_NAME)
      .asCallback(done);
  });

  it('should call the `add()` callback when a new message is published',
    function(done) {
      var message = {
        kind: 'act',
        time: { client_sent: Date.now() },
        act: { cmd: 'test' },
        sync: true
      };

      listener.add('cmd:test', function(payload, cb) {
        var received = seneca.util.clean(payload);
        received.should.eql(message.act);
        cb(null, { ok: true });
        return done();
      });

      ch.publish(EXCHANGE_NAME, RK, Buffer.from(JSON.stringify(message)), {
        replyTo: 'reply.queue'
      });
    });
});
