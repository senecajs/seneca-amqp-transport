'use strict';

const chai = require('chai');
const DirtyChai = require('dirty-chai');
chai.should();
chai.use(DirtyChai);

const amqp = require('amqplib');
const seneca = require('seneca')();

const CONSUMER_TAG = 'seneca-client-e2e';
const QUEUE_NAME = 'seneca.add.cmd:test.role:client';
const EXCHANGE_NAME = 'seneca.topic';
const RK = 'cmd.test.role.client';

describe("A Seneca client with type:'amqp'", function() {
  var ch = null;
  var client = seneca
    .use('..', {
      exchange: {
        name: EXCHANGE_NAME,
        options: {
          durable: false,
          autoDelete: true
        }
      }
    })
    .client({
      url: process.env.AMQP_URL,
      type: 'amqp',
      pin: 'cmd:test,role:client'
    });

  before(function(done) {
    seneca.ready(err => done(err));
  });

  before(function() {
    // Connect to the broker, (re-)declare exchange and queue used in test
    // and remove any pre-existing messages from it
    return amqp
      .connect(process.env.AMQP_UR)
      .then(conn => conn.createChannel())
      .then(channel => {
        return channel
          .deleteQueue(QUEUE_NAME)
          .then(() =>
            channel.assertQueue(QUEUE_NAME, {
              durable: false,
              exclusive: true
            })
          )
          .then(() => channel.assertExchange(EXCHANGE_NAME, 'topic'))
          .then(() => channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, RK))
          .thenReturn(channel);
      })
      .then(function(channel) {
        ch = channel;
      });
  });

  afterEach(function() {
    // Stop consuming from the test queue after each run
    return ch.cancel(CONSUMER_TAG);
  });

  after(function() {
    // Close both the channel and the connection to the AMQP broker
    return ch.close().then(() => ch.connection.close());
  });

  after(function() {
    seneca.close();
  });

  it('should publish a valid message to an AMQP queue after a call to `act()`', function(done) {
    var payload = {
      foo: 'bar',
      life: 42
    };

    ch.consume(
      QUEUE_NAME,
      function(message) {
        message.properties.should.be.an('object');
        message.properties.should.have.property('correlationId').that.is.ok();
        message.properties.should.have.property('replyTo').that.is.ok();

        var content = JSON.parse(message.content.toString());
        content.should.have.property('act').that.is.an('object');
        content.act.should.eql(
          Object.assign(
            {
              cmd: 'test',
              role: 'client'
            },
            payload
          )
        );
        return done();
      },
      { consumerTag: CONSUMER_TAG }
    );

    client.act('cmd:test,role:client', payload);
  });

  it('should call the `act()` callback when replying', function(done) {
    var utils = seneca.export('transport/utils');
    var payload = {
      foo: 'bar',
      life: 42
    };
    var respose = {
      bar: 'baz'
    };

    ch.consume(
      QUEUE_NAME,
      function(message) {
        var data = JSON.parse(message.content.toString());
        var reply = utils.prepareResponse(seneca, data);
        reply.res = respose;
        // Send a response to the `replyTo` queue
        // This should trigger the act callback function
        ch.sendToQueue(
          message.properties.replyTo,
          Buffer.from(JSON.stringify(reply)),
          {
            correlationId: message.properties.correlationId
          }
        );
      },
      { consumerTag: CONSUMER_TAG }
    );

    client.act('cmd:test,role:client', payload, function(err, res) {
      if (err) {
        return done(err);
      }

      res.should.eql(respose);
      return done();
    });
  });
});
