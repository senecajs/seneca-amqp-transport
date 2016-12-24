'use strict';

const chai = require('chai');
const sinon = require('sinon');
const DirtyChai = require('dirty-chai');
const SinonChai = require('sinon-chai');
require('sinon-bluebird');
chai.should();
chai.use(SinonChai);
chai.use(DirtyChai);

// use the default options
const options = require('../../../defaults').amqp;
const seneca = require('seneca')();
const Client = require('../../../lib/client/client-factory');

describe('On client-factory module', function() {
  const OPTIONS = {
    exchange: 'seneca.topic',
    queue: 'seneca.role:create',
    ch: {
      on: Function.prototype,
      publish: Function.prototype,
      consume: Function.prototype
    },
    options
  };

  const TRANSPORT_UTILS = {
    make_client: Function.prototype
  };

  describe('the factory function', function() {
    it('should be a function', function() {
      Client.should.be.a('function');
    });

    it('should create a Client object with a start method', function() {
      var client = Client(seneca, OPTIONS);
      client.should.be.an('object');
      client.should.have.property('start');
    });
  });

  describe('the Client#start() function', function() {
    it('should make a new Seneca client', function(done) {
      // Create seneca.export('transport/utils') stub
      // and spy on utils#make_client function
      var makeClient = sinon.spy(TRANSPORT_UTILS, 'make_client');
      sinon.stub(seneca, 'export')
        .withArgs('transport/utils').returns(TRANSPORT_UTILS);

      seneca.ready(function() {
        var callback = Function.prototype;
        var client = Client(seneca, OPTIONS);
        client.start(callback)
          .then(() => {
            makeClient.should.have.been.calledOnce();
            makeClient.should.have.been.calledWith(seneca, sinon.match.func,
              OPTIONS.options, callback);
          })
          .asCallback(done);
      });
    });
  });
});
