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
const DEFAULT_OPTIONS = require('../../../defaults').amqp;
const seneca = require('seneca')();
const Listener = require('../../../lib/listener/listener-factory');

describe('On listener-factory module', function() {
  const channel = {
    on: Function.prototype,
    consume: () => Promise.resolve()
  };

  const options = {
    exchange: 'seneca.topic',
    queue: 'seneca.role:create',
    ch: channel,
    options: DEFAULT_OPTIONS
  };

  before(function(done) {
    seneca.ready(() => done());
  });

  after(function() {
    seneca.close();
  });

  describe('the factory function', function() {
    it('should be a function', function() {
      Listener.should.be.a('function');
    });

    it('should create a Listener object with a `listen` method', function() {
      var listener = Listener(seneca, options);
      listener.should.be.an('object');
      listener.should.have.property('listen');
    });
  });

  describe('the Listener#listen() function', function() {
    before(function() {
      sinon.stub(channel, 'consume', channel.consume);
    });

    afterEach(function() {
      // Reset the state of the stub functions
      channel.consume.reset();
    });

    it('should return a Promise', function() {
      var listener = Listener(seneca, options);
      listener.listen().should.be.instanceof(Promise);
    });

    it('should start consuming messages from a queue', function(done) {
      var listener = Listener(seneca, options);
      listener.listen()
        .then(() => {
          channel.consume.should.have.been.calledOnce();
          channel.consume.should.have.been.calledWith(options.queue,
            sinon.match.func);
        })
        .asCallback(done);
    });
  });

  describe('the handleMessage() function', function() {
    const transportUtils = {
      handle_request: Function.prototype,
      parseJSON: (seneca, type, msg) => JSON.parse(msg),
      stringifyJSON: (seneca, type, msg) => JSON.stringify(msg)
    };

    const message = {
      content: JSON.stringify({ foo: 'bar' }),
      properties: {
        correlationId: 'bf6c362d-ca8b-4fa6-b052-2bb462e1b7b5',
        replyTo: 'reply.queue'
      }
    };

    const channel = {
      consume: (queue, handler) => Promise.resolve()
        .then(() => handler(message)),
      sendToQueue: () => Promise.resolve(),
      ack: Function.prototype
    };

    const options = {
      exchange: 'seneca.topic',
      queue: 'seneca.role:create',
      ch: channel,
      options: DEFAULT_OPTIONS
    };

    before(function() {
      // Stub the `channel#consume()` method to make it call the message
      // handler function as if a new message had just arrived to the queue
      sinon.stub(channel, 'consume', channel.consume);
      sinon.stub(channel, 'sendToQueue', channel.sendToQueue);
      sinon.stub(channel, 'ack', channel.ack);
    });

    afterEach(function() {
      channel.consume.reset();
      channel.sendToQueue.reset();
      channel.ack.reset();
    });

    it('should handle the request when a message is consumed',
      sinon.test(function(done) {
        var handleRequest = this.spy(transportUtils, 'handle_request');
        this.stub(seneca, 'export')
            .withArgs('transport/utils').returns(transportUtils);

        var listener = Listener(seneca, options);
        listener.listen()
          .then(() => {
            handleRequest.should.have.been.calledOnce();
            handleRequest.should.have.been.calledWith(seneca, { foo: 'bar' },
              DEFAULT_OPTIONS, sinon.match.func);
          })
          .asCallback(done);
      }));

    it('should reply to the `replyTo` queue with the response from a Seneca act',
      sinon.test(function(done) {
        var reply = { foo: 'bar' };

        this.stub(transportUtils, 'handle_request',
          (seneca, data, options, cb) => cb(reply));

        this.stub(seneca, 'export')
            .withArgs('transport/utils').returns(transportUtils);

        var listener = Listener(seneca, options);
        listener.listen()
          .then(() => {
            // Should send response to `replyTo` queue
            channel.sendToQueue.should.have.been.calledOnce();
            channel.sendToQueue.should
              .have.been.calledWith(message.properties.replyTo,
                Buffer.from(JSON.stringify(reply)), {
                  correlationId: message.properties.correlationId
                });

            // Should acknowledge the message on the channel
            channel.ack.should.have.been.calledOnce();
            channel.ack.should.have.been.calledWith(message);
          })
          .asCallback(done);
      }));

    it('should not reply to the `replyTo` queue if response is falsy',
      sinon.test(function(done) {
        // Could be any "falsy" value
        var reply = false;

        this.stub(transportUtils, 'handle_request',
          (seneca, data, options, cb) => cb(reply));

        this.stub(seneca, 'export')
            .withArgs('transport/utils').returns(transportUtils);

        var listener = Listener(seneca, options);
        listener.listen()
          .then(() => {
            // Should not send response to `replyTo` queue
            channel.sendToQueue.should.not.have.been.calledOnce();

            // Should not acknowledge the message on the channel
            channel.ack.should.not.have.been.calledOnce();
          })
          .asCallback(done);
      }));
  });
});

