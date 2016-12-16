'use strict';

const chai = require('chai');
const sinon = require('sinon');
const DirtyChai = require('dirty-chai');
const SinonChai = require('sinon-chai');
const Promise = require('bluebird');
require('sinon-bluebird');
chai.should();
chai.use(SinonChai);
chai.use(DirtyChai);

const deadLetter = require('../../lib/common/dead-letter');
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
    sinon.stub(channel, 'assertQueue', channel.assertQueue);
    sinon.stub(channel, 'assertExchange', channel.assertExchange);
    sinon.stub(channel, 'bindQueue', channel.bindQueue);
  });

  afterEach(function() {
    // Reset the state of the stub functions
    channel.assertQueue.reset();
    channel.assertExchange.reset();
    channel.bindQueue.reset();
  });

  describe('declareDeadLetter()', function() {
    it('should return a Promise', function() {
      deadLetter.declareDeadLetter().should.be.instanceof(Promise);
    });

    it('should avoid any declarations if `options.queue` is not present', function(done) {
      var options = {
        exchange: {}
      };
      deadLetter.declareDeadLetter(options, channel)
        .then(() => {
          sinon.assert.notCalled(channel.assertQueue);
          sinon.assert.notCalled(channel.assertExchange);
        })
        .asCallback(done);
    });

    it('should avoid any declarations if `options.exchange` is not present', function(done) {
      var options = {
        queue: {}
      };
      deadLetter.declareDeadLetter(options, channel)
        .then(() => {
          sinon.assert.notCalled(channel.assertQueue);
          sinon.assert.notCalled(channel.assertExchange);
        })
        .asCallback(done);
    });

    it('should avoid any declaration if `channel` is null', function(done) {
      deadLetter.declareDeadLetter(DEFAULT_OPTIONS, null)
        .then(() => {
          sinon.assert.notCalled(channel.assertQueue);
          sinon.assert.notCalled(channel.assertExchange);
        })
        .asCallback(done);
    });

    it('should declare a dead letter exchange', function(done) {
      deadLetter.declareDeadLetter(DEFAULT_OPTIONS, channel)
        .then(() => {
          var opt = DEFAULT_OPTIONS.exchange;
          sinon.assert.calledOnce(channel.assertExchange);
          sinon.assert.calledWithExactly(channel.assertExchange, opt.name, opt.type, opt.options);
        })
        .asCallback(done);
    });

    it('should declare a dead letter queue', function(done) {
      deadLetter.declareDeadLetter(DEFAULT_OPTIONS, channel)
        .then(() => {
          var opt = DEFAULT_OPTIONS.queue;
          sinon.assert.calledOnce(channel.assertQueue);
          sinon.assert.calledWithExactly(channel.assertQueue, opt.name, opt.options);
        })
        .asCallback(done);
    });

    it('should bind dead letter queue and exchange with "#" as routing key', function(done) {
      deadLetter.declareDeadLetter(DEFAULT_OPTIONS, channel)
        .then(() => {
          sinon.assert.calledOnce(channel.bindQueue);
          sinon.assert.calledWithExactly(channel.bindQueue, DEFAULT_OPTIONS.queue.name, DEFAULT_OPTIONS.exchange.name, '#');
        })
        .asCallback(done);
    });

    it('should resolve to an object containing `dlq`, `dlx` and `rk` props', function(done) {
      deadLetter.declareDeadLetter(DEFAULT_OPTIONS, channel)
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
