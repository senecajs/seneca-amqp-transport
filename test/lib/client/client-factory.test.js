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
      publish: () => Promise.resolve(),
      consume: () => Promise.resolve()
    },
    options
  };

  const TRANSPORT_UTILS = {
    make_client: Function.prototype,
    prepare_request: () => '',
    stringifyJSON: (seneca, type, msg) => JSON.stringify(msg)
  };

  before(function(done) {
    seneca.ready(() => done());
  });

  after(function() {
    seneca.close();
  });

  describe('the factory function', function() {
    it('should be a function', function() {
      Client.should.be.a('function');
    });

    it('should create a Client object with a `start` method', function() {
      var client = Client(seneca, OPTIONS);
      client.should.be.an('object');
      client.should.have.property('start').that.is.a('function');
    });
  });

  describe('the Client#start() function', function() {
    it('should make a new Seneca client', sinon.test(function(done) {
      // Create seneca.export('transport/utils') stub
      // and spy on utils#make_client function
      var makeClient = this.spy(TRANSPORT_UTILS, 'make_client');
      this.stub(seneca, 'export')
        .withArgs('transport/utils').returns(TRANSPORT_UTILS);

      var callback = Function.prototype;
      var client = Client(seneca, OPTIONS);
      client.start(callback)
        .then(() => {
          makeClient.should.have.been.calledOnce();
          makeClient.should.have.been.calledWith(seneca, sinon.match.func,
            OPTIONS.options, callback);
        })
        .asCallback(done);
    }));
  });

  describe('the Client object', function() {
    before(function() {
      options.meta$ = {
        pattern: 'role:create'
      };
    });

    after(function() {
      delete options.meta$;
    });

    it('should publish a new message to a queue on a Seneca act',
      sinon.test(function(done) {
        // Create seneca.export('transport/utils') stub
        // to make it call the provided callback, which -in turn- ends up
        // calling the `act` function on the client factory
        this.stub(TRANSPORT_UTILS, 'make_client', (seneca, cb) => cb(null, null,
          function(err, done) {
            if (err) {
              throw err;
            }
            return done(OPTIONS.options, Function.prototype);
          }));

        this.stub(seneca, 'export')
          .withArgs('transport/utils').returns(TRANSPORT_UTILS);

        // Spy on `channel#publish()` method
        var publish = this.spy(OPTIONS.ch, 'publish');

        var client = Client(seneca, OPTIONS);
        client.start(Function.prototype)
          .then(() => publish.should.have.been.calledOnce())
          .asCallback(done);
      }));
  });
});
