'use strict';

const Chai = require('chai');
const DirtyChai = require('dirty-chai');
const Sinon = require('sinon');
const SinonChai = require('sinon-chai');
const Promise = require('bluebird');
require('sinon-bluebird');
Chai.should();
Chai.use(SinonChai);
Chai.use(DirtyChai);

const DeadLetter = require('../../lib/dead-letter');
const DEFAULT_OPTIONS = {
  queue: {
    name: 'seneca.dlq'
  },
  exchange: {
    type: 'topic',
    name: 'seneca.dlx',
    options: {
      durable: true,
      autoDelete: false
    }
  }
};

describe('Unit tests for dead-letter module', function() {
  let channel = {
    assertQueue: (queue) => Promise.resolve({
      queue
    }),
    assertExchange: (exchange) => Promise.resolve({
      exchange
    }),
    bindQueue: () => Promise.resolve()
  };

  before(function() {
    // Create spies for channel methods
    Sinon.stub(channel, 'assertQueue', channel.assertQueue);
    Sinon.stub(channel, 'assertExchange', channel.assertExchange);
    Sinon.stub(channel, 'bindQueue', channel.bindQueue);
  });

  afterEach(function() {
    // Reset the state of the stub functions
    channel.assertQueue.reset();
    channel.assertExchange.reset();
    channel.bindQueue.reset();
  });

  describe('declareDeadLetter()', function() {
    it('should return a Promise', function() {
      DeadLetter.declareDeadLetter().should.be.instanceof(Promise);
    });

    it('should avoid any declaration if `options.queue` is not present', function(done) {
      var options = {
        exchange: {}
      };
      DeadLetter.declareDeadLetter(options, channel)
        .then(() => {
          Sinon.assert.notCalled(channel.assertQueue);
          Sinon.assert.notCalled(channel.assertExchange);
        })
        .asCallback(done);
    });

    it('should avoid any declaration if `options.exchange` is not present', function(done) {
      var options = {
        queue: {}
      };
      DeadLetter.declareDeadLetter(options, channel)
        .then(() => {
          Sinon.assert.notCalled(channel.assertQueue);
          Sinon.assert.notCalled(channel.assertExchange);
        })
        .asCallback(done);
    });

    it('should avoid any declaration if `channel` is null', function(done) {
      DeadLetter.declareDeadLetter(DEFAULT_OPTIONS, null)
        .then(() => {
          Sinon.assert.notCalled(channel.assertQueue);
          Sinon.assert.notCalled(channel.assertExchange);
        })
        .asCallback(done);
    });

    it('should declare a dead letter exchange', function(done) {
      DeadLetter.declareDeadLetter(DEFAULT_OPTIONS, channel)
        .then(() => {
          var opt = DEFAULT_OPTIONS.exchange;
          Sinon.assert.calledOnce(channel.assertExchange);
          Sinon.assert.calledWithExactly(channel.assertExchange, opt.name, opt.type, opt.options);
        })
        .asCallback(done);
    });

    it('should declare a dead letter queue', function(done) {
      DeadLetter.declareDeadLetter(DEFAULT_OPTIONS, channel)
        .then(() => {
          var opt = DEFAULT_OPTIONS.queue;
          Sinon.assert.calledOnce(channel.assertQueue);
          Sinon.assert.calledWithExactly(channel.assertQueue, opt.name, opt.options);
        })
        .asCallback(done);
    });

    it('should bind dead letter queue and exchange with "#" as routing key', function(done) {
      DeadLetter.declareDeadLetter(DEFAULT_OPTIONS, channel)
        .then(() => {
          Sinon.assert.calledOnce(channel.bindQueue);
          Sinon.assert.calledWithExactly(channel.bindQueue, DEFAULT_OPTIONS.queue.name, DEFAULT_OPTIONS.exchange.name, '#');
        })
        .asCallback(done);
    });

    it('should resolve to an object containing `dlq`, `dlx` and `rk` props', function(done) {
      DeadLetter.declareDeadLetter(DEFAULT_OPTIONS, channel)
        .then((dl) => {
          // Match `dlq` property to `options.queue.name`
          dl.should.have.property('dlq')
            .and.equal(DEFAULT_OPTIONS.queue.name);
          // Match `dlx` property to `options.exchange.name`
          dl.should.have.property('dlx')
            .and.equal(DEFAULT_OPTIONS.exchange.name);
          // Match 'rk' property to '#'
          dl.should.have.property('rk').and.equal('#');
        })
        .asCallback(done);
    });
  });
});
