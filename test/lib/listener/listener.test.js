'use strict';

const Promise = require('bluebird');
const chai = require('chai');
const DirtyChai = require('dirty-chai');
const sinon = require('sinon');
const SinonChai = require('sinon-chai');
chai.should();
chai.use(SinonChai);
chai.use(DirtyChai);

const DEFAULT_OPTIONS = require('../../../defaults').amqp;
const amqputil = require('../../../lib/listener/listener-util');
const seneca = require('seneca')();
const listener = require('../../../lib/listener');

describe('On listener module', function() {
  let channel = {
    assertQueue: queue =>
      Promise.resolve({
        queue
      }),
    assertExchange: exchange =>
      Promise.resolve({
        exchange
      }),
    consume: () => Promise.resolve(),
    publish: () => Promise.resolve(),
    bindQueue: () => Promise.resolve(),
    sendToQueue: () => Promise.resolve(),
    ack: Function.prototype,
    nack: Function.prototype,
    prefetch: Function.prototype,
    on: Function.prototype
  };

  let options = {
    ch: channel,
    options: DEFAULT_OPTIONS
  };

  before(function() {
    // Add some `pin` to the options to be used in queue name creation
    DEFAULT_OPTIONS.pin = 'role:entity,cmd:create';

    // Create spies for channel methods
    sinon.spy(channel, 'assertQueue');
    sinon.spy(channel, 'assertExchange');
    sinon.spy(channel, 'prefetch');
    sinon.spy(channel, 'bindQueue');
  });

  before(function(done) {
    seneca.ready(() => done());
  });

  after(function() {
    seneca.close();
  });

  describe('the setup() function', function() {
    afterEach(function() {
      // Reset the state of the stub functions
      channel.assertQueue.reset();
      channel.assertExchange.reset();
      channel.prefetch.reset();
      channel.bindQueue.reset();
    });

    it('should return a Promise', function() {
      listener
        .setup(seneca, options, Function.prototype)
        .should.be.instanceof(Promise);
    });

    it('should resolve to a new Listener instance', function(done) {
      listener
        .setup(seneca, options, Function.prototype)
        .then(li => {
          li.should.be.an('object');
          li.should.have.property('listen');
        })
        .asCallback(done);
    });

    it('should have started the new listener', function(done) {
      listener
        .setup(seneca, options, Function.prototype)
        .then(li => {
          li.started.should.be.true();
        })
        .asCallback(done);
    });

    it('should set the prefetch value on the channel', function(done) {
      listener
        .setup(seneca, options, Function.prototype)
        .then(() => {
          channel.prefetch.should.have.been.calledOnce();
          channel.prefetch.should.have.been.calledWith(
            DEFAULT_OPTIONS.listener.channel.prefetch
          );
        })
        .asCallback(done);
    });

    it('should declare the exchange on the channel', function(done) {
      listener
        .setup(seneca, options, Function.prototype)
        .then(() => {
          var ex = DEFAULT_OPTIONS.exchange;
          channel.assertExchange.should.have.been.calledOnce();
          channel.assertExchange.should.have.been.calledWith(
            ex.name,
            ex.type,
            ex.options
          );
        })
        .asCallback(done);
    });

    it('should declare the queue on the channel', function(done) {
      listener
        .setup(seneca, options, Function.prototype)
        .then(() => {
          var queueOptions = DEFAULT_OPTIONS.listener.queues;
          var queueName = amqputil.resolveListenQueue(
            {
              role: 'entity',
              cmd: 'create'
            },
            queueOptions
          );
          channel.assertQueue.should.have.been.calledOnce();
          channel.assertQueue.should.have.been.calledWith(
            queueName,
            queueOptions.options
          );
        })
        .asCallback(done);
    });

    it('should bind the queue to the exchange', function(done) {
      listener
        .setup(seneca, options, Function.prototype)
        .then(() => {
          var queueOptions = DEFAULT_OPTIONS.listener.queues;
          var queueName = amqputil.resolveListenQueue(
            {
              role: 'entity',
              cmd: 'create'
            },
            queueOptions
          );
          channel.bindQueue.should.have.been.calledOnce();
          channel.bindQueue.should.have.been.calledWith(
            queueName,
            DEFAULT_OPTIONS.exchange.name
          );
        })
        .asCallback(done);
    });
  });
});
