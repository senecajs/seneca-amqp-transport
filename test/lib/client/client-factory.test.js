'use strict';

const chai = require('chai');
const sinon = require('sinon');
const sinonTest = require('sinon-test');
const DirtyChai = require('dirty-chai');
const SinonChai = require('sinon-chai');

chai.should();
chai.use(SinonChai);
chai.use(DirtyChai);
sinon.test = sinonTest.configureTest(sinon);

// use the default options
const DEFAULT_OPTIONS = require('../../../defaults').amqp;
const seneca = require('seneca')();
const Client = require('../../../lib/client/client-factory');

describe('On client-factory module', function() {
  const channel = {
    on: Function.prototype,
    publish: () => Promise.resolve(),
    consume: () => Promise.resolve()
  };

  const options = {
    exchange: 'seneca.topic',
    queue: 'seneca.role:create',
    ch: channel,
    options: DEFAULT_OPTIONS
  };

  const transportUtils = {
    make_client: Function.prototype,
    handle_response: Function.prototype,
    prepare_request: () => '',
    stringifyJSON: (seneca, type, msg) => JSON.stringify(msg),
    parseJSON: (seneca, type, msg) => JSON.parse(msg)
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
      var client = Client(seneca, options);
      client.should.be.an('object');
      client.should.have.property('start').that.is.a('function');
    });
  });

  describe('the Client#start() function', function() {
    it('should make a new Seneca client', sinon.test(function(done) {
      // Create seneca.export('transport/utils') stub
      // and spy on utils#make_client function
      var makeClient = this.spy(transportUtils, 'make_client');
      this.stub(seneca, 'export')
        .withArgs('transport/utils').returns(transportUtils);

      var callback = Function.prototype;
      var client = Client(seneca, options);
      client.start(callback)
        .then(() => {
          makeClient.should.have.been.calledOnce();
          makeClient.should.have.been.calledWith(seneca, sinon.match.func,
            options.options, callback);
        })
        .asCallback(done);
    }));
  });

  describe('the Client object', function() {
    before(function() {
      DEFAULT_OPTIONS.meta$ = {
        pattern: 'role:create'
      };
    });

    after(function() {
      delete DEFAULT_OPTIONS.meta$;
    });

    it('should publish a new message to a queue on a Seneca act',
      sinon.test(function(done) {
        // Create seneca.export('transport/utils') stub
        // to make it call the provided callback, which -in turn- ends up
        // calling the `act` function on the client factory
        this.stub(transportUtils, 'make_client', (seneca, cb) => cb(null, null,
          function(err, done) {
            if (err) {
              throw err;
            }
            return done(options.options, Function.prototype);
          }));

        this.stub(seneca, 'export')
          .withArgs('transport/utils').returns(transportUtils);

        // Spy on `channel#publish()` method
        var publish = this.spy(options.ch, 'publish');

        var client = Client(seneca, options);
        client.start(Function.prototype)
          .then(() => publish.should.have.been.calledOnce())
          .asCallback(done);
      }));

    it('should handle a reply message upon arrival to the queue',
      sinon.test(function(done) {
        const reply = {
          content: JSON.stringify({ foo: 'bar' }),
          properties: {
            correlationId: 'bf6c362d-ca8b-4fa6-b052-2bb462e1b7b5',
            replyTo: 'reply.queue'
          }
        };

        // Create seneca.export('transport/utils') stub
        // to make it call the provided callback
        this.stub(transportUtils, 'make_client', (seneca, cb) => cb(null, null,
          Function.prototype));

        // Make `channel#consume` call its handler function
        this.stub(channel, 'consume', (queue, handler) => Promise.resolve()
          .then(() => handler(reply)));

        this.stub(seneca, 'export')
          .withArgs('transport/utils').returns(transportUtils);

        // Spy on `utils#handle_response`, which is what is used by
        // Seneca to handle client responses. It should be called on each reply
        let handleResponse = this.spy(transportUtils, 'handle_response');

        // Add `correlationId` to the passed options
        let opts = Object.assign({}, options);
        opts.options.correlationId = reply.properties.correlationId;

        var client = Client(seneca, opts);
        client.start(Function.prototype)
          .then(() => handleResponse.should.have.been.calledOnce())
          .asCallback(done);
      }));
  });
});
