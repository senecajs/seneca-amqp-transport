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
  let channel = {
    on: Function.prototype,
    consume: () => Promise.resolve()
  };

  let options = {
    exchange: 'seneca.topic',
    queue: 'seneca.role:create',
    ch: channel,
    options: DEFAULT_OPTIONS
  };

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

    before(function(done) {
      seneca.ready(() => done());
    });

    after(function() {
      seneca.close();
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
});

