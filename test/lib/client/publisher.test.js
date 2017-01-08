'use strict';

const Promise = require('bluebird');
const chai = require('chai');
const sinon = require('sinon');
const DirtyChai = require('dirty-chai');
const SinonChai = require('sinon-chai');
require('sinon-bluebird');
chai.should();
chai.use(SinonChai);
chai.use(DirtyChai);

// use the default options
const Publisher = require('../../../lib/client/publisher');

const CORRELATION_ID = 'bf6c362d-ca8b-4fa6-b052-2bb462e1b7b5';
const EXCHANGE = 'seneca.topic';

describe('On publisher module', function() {
  let channel = {
    consume: () => Promise.resolve(),
    publish: () => Promise.resolve()
  };

  before(function() {
    // Create spies for channel methods
    sinon.stub(channel, 'consume', channel.consume);
    sinon.stub(channel, 'publish', channel.publish);
  });

  afterEach(function() {
    // Reset the state of the stub functions
    channel.consume.reset();
    channel.publish.reset();
  });

  describe('the factory function', function() {
    it('should be a function', function() {
      Publisher.should.be.a('function');
    });

    it('should create a new Publisher', function() {
      var pub = Publisher(channel);
      pub.should.be.an('object');
      pub.should.have.property('publish').that.is.a('function');
      pub.should.have.property('awaitReply').that.is.a('function');
    });

    it('should throw if no channel is provided', function() {
      (Publisher).should.throw(TypeError, /provided/);
    });
  });

  describe('the publish() method', function() {
    const message = JSON.stringify({ foo: 'bar' });
    const rk = 'foo.bar';

    it('should publish a valid message to the channel', function() {
      var pub = Publisher(channel);
      pub.publish(message, EXCHANGE, rk);

      channel.publish.should.have.been.calledOnce();
      channel.publish.should.have.been.calledWith(sinon.match.string,
        sinon.match.string, Buffer.from(message));
    });

    it('should publish to the given exchange and routing key', function() {
      var pub = Publisher(channel);
      pub.publish(message, EXCHANGE, rk);

      channel.publish.should.have.been.calledOnce();
      channel.publish.should.have.been.calledWith(EXCHANGE, rk);
    });

    it('should set the `replyTo` option', function(done) {
      var pub = Publisher(channel, { replyQueue: 'reply.queue' });
      pub.publish(message, EXCHANGE, rk)
        .then(function() {
          channel.publish.should.have.been.calledOnce();
          channel.publish.should.have.been.calledWith(sinon.match.string,
            sinon.match.string, sinon.match.defined,
            sinon.match.has('replyTo', 'reply.queue'));
        })
        .asCallback(done);
    });

    it('should set the `correlationId` option', function(done) {
      var pub = Publisher(channel, { correlationId: CORRELATION_ID });
      pub.publish(message, EXCHANGE, rk)
        .then(function() {
          channel.publish.should.have.been.calledOnce();
          channel.publish.should.have.been.calledWith(sinon.match.string,
            sinon.match.string, sinon.match.defined,
            sinon.match.has('correlationId', CORRELATION_ID));
        })
        .asCallback(done);
    });
  });

  describe('the awaitReply() method', function() {
    it('should return a Promise', function() {
      var pub = Publisher(channel);
      pub.awaitReply().should.be.instanceof(Promise);
    });

    it('should await for reply messages from the channel', function(done) {
      var pub = Publisher(channel, { replyQueue: 'reply.queue' });
      pub.awaitReply()
        .then(function() {
          channel.consume.should.have.been.calledOnce();
          channel.consume.should.have.been.calledWith('reply.queue',
            sinon.match.func, { noAck: true });
        })
        .asCallback(done);
    });
  });

  describe('the consumeReply() method', function() {
    const reply = {
      content: { foo: 'bar' },
      properties: {
        correlationId: CORRELATION_ID
      }
    };

    const ch = {
      consume: (queue, cb) => cb(reply)
    };

    before(function() {
      // Stub `channel#consume` method and make it call the `consumeReply`
      // callback with a mock `reply` object
      sinon.stub(ch, 'consume', (queue, cb) => cb(reply));
    });

    afterEach(function() {
      ch.consume.reset();
    });

    it('should call the `repyHandler` callback with a message', function() {
      var replyHandler = sinon.spy();
      var pub = Publisher(ch, {
        replyQueue: 'reply.queue',
        replyHandler,
        correlationId: CORRELATION_ID
      });

      pub.awaitReply();
      replyHandler.should.have.been.calledOnce();
      replyHandler.should.have.been.calledWith(reply.content.toString());
    });

    it('should ignore messages if `correlationId` does not match', function() {
      var replyHandler = sinon.spy();
      var pub = Publisher(ch, {
        replyQueue: 'reply.queue',
        replyHandler,
        correlationId: 'foo_' + CORRELATION_ID
      });

      pub.awaitReply();
      replyHandler.should.not.have.been.called();
    });

    it('should handle reply messages with no content', function() {
      var noContentChannel = {
        consume: (queue, cb) => cb({ properties: reply.properties })
      };

      // Stub `channel#consume` method and make it call the `consumeReply`
      // callback with a mock `reply` object with no `content` property.
      sinon.stub(noContentChannel, 'consume', (queue, cb) => cb({
        properties: reply.properties
      }));

      var replyHandler = sinon.spy();
      var pub = Publisher(noContentChannel, {
        replyQueue: 'reply.queue',
        replyHandler,
        correlationId: CORRELATION_ID
      });

      pub.awaitReply();
      replyHandler.should.have.been.calledOnce();
      replyHandler.should.have.been.calledWith(undefined);
    });
  });
});
