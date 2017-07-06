'use strict';

const Promise = require('bluebird');
const chai = require('chai');
const sinon = require('sinon');
const DirtyChai = require('dirty-chai');
const SinonChai = require('sinon-chai');

chai.should();
chai.use(SinonChai);
chai.use(DirtyChai);

const Publisher = require('../../../lib/client/publisher');

const CORRELATION_ID = 'bf6c362d-ca8b-4fa6-b052-2bb462e1b7b5';
const EXCHANGE = 'seneca.topic';

describe('On publisher module', function() {
  describe('the factory function', function() {
    it('should be a function', function() {
      Publisher.should.be.a('function');
    });

    it('should create a new Publisher', function() {
      const pub = Publisher({});
      pub.should.be.an('object');
      pub.should.have.property('publish').that.is.a('function');
      pub.should.have.property('awaitReply').that.is.a('function');
    });

    it('should throw if no channel is provided', function() {
      (Publisher).should.throw(TypeError, /provided/);
    });
  });

  describe('the publish() method', function() {
    const channel = {
      publish: () => Promise.resolve()
    };

    before(function() {
      // Create spies for channel methods
      sinon.spy(channel, 'publish');
    });

    afterEach(function() {
      // Reset the state of the stub functions
      channel.publish.reset();
    });

    const message = JSON.stringify({ foo: 'bar' });
    const rk = 'foo.bar';

    it('should publish a valid message to the channel', function() {
      const pub = Publisher(channel);
      pub.publish(message, EXCHANGE, rk);

      channel.publish.should.have.been.calledOnce();
      channel.publish.should.have.been.calledWith(sinon.match.string,
        sinon.match.string, Buffer.from(message));
    });

    it('should publish to the given exchange and routing key', function() {
      const pub = Publisher(channel);
      pub.publish(message, EXCHANGE, rk);

      channel.publish.should.have.been.calledOnce();
      channel.publish.should.have.been.calledWith(EXCHANGE, rk);
    });

    it('should set the `replyTo` option', function(done) {
      const pub = Publisher(channel, { replyQueue: 'reply.queue' });
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
      const pub = Publisher(channel, { correlationId: CORRELATION_ID });
      pub.publish(message, EXCHANGE, rk)
        .then(function() {
          channel.publish.should.have.been.calledOnce();
          channel.publish.should.have.been.calledWith(sinon.match.string,
            sinon.match.string, sinon.match.defined,
            sinon.match.has('correlationId', CORRELATION_ID));
        })
        .asCallback(done);
    });

    it('should set channel#publish options', function(done) {
      const pub = Publisher(channel, { correlationId: CORRELATION_ID });
      pub.publish(message, EXCHANGE, rk, { persistent: true })
        .then(function() {
          channel.publish.should.have.been.calledOnce();
          channel.publish.should.have.been.calledWith(sinon.match.string,
            sinon.match.string, sinon.match.defined,
            sinon.match.has('persistent', true));
        })
        .asCallback(done);
    });
  });

  describe('the awaitReply() method', function() {
    const channel = {
      consume: () => Promise.resolve()
    };

    before(function() {
      // Create spies for channel methods
      sinon.spy(channel, 'consume');
    });

    afterEach(function() {
      // Reset the state of the stub functions
      channel.consume.reset();
    });

    it('should return a Promise', function() {
      const pub = Publisher(channel);
      pub.awaitReply().should.be.instanceof(Promise);
    });

    it('should await for reply messages from the channel', function(done) {
      const pub = Publisher(channel, { replyQueue: 'reply.queue' });
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

    const channel = {
      consume: (queue, cb) => cb(reply)
    };

    before(function() {
      // Stub `channel#consume` method and make it call the `consumeReply`
      // callback with a mock `reply` object
      sinon.stub(channel, 'consume').callsFake((queue, cb) => cb(reply));
    });

    afterEach(function() {
      channel.consume.reset();
    });

    it('should call the `repyHandler` callback with a message', function() {
      const replyHandler = sinon.spy();
      const pub = Publisher(channel, {
        replyQueue: 'reply.queue',
        replyHandler,
        correlationId: CORRELATION_ID
      });

      pub.awaitReply();
      replyHandler.should.have.been.calledOnce();
      replyHandler.should.have.been.calledWith(reply.content.toString());
    });

    it('should ignore messages if `correlationId` does not match', function() {
      const replyHandler = sinon.spy();
      const pub = Publisher(channel, {
        replyQueue: 'reply.queue',
        replyHandler,
        correlationId: 'foo_' + CORRELATION_ID
      });

      pub.awaitReply();
      replyHandler.should.not.have.been.called();
    });

    it('should handle reply messages with no content', function() {
      const noContentChannel = {
        consume: (queue, cb) => cb({ properties: reply.properties })
      };

      // Stub `channel#consume` method and make it call the `consumeReply`
      // callback with a mock `reply` object with no `content` property.
      sinon.stub(noContentChannel, 'consume').callsFake((queue, cb) => cb({
        properties: reply.properties
      }));

      const replyHandler = sinon.spy();
      const pub = Publisher(noContentChannel, {
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
