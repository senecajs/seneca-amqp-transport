'use strict';

const chai = require('chai');
const sinon = require('sinon');
const DirtyChai = require('dirty-chai');
const SinonChai = require('sinon-chai');

chai.should();
chai.use(SinonChai);
chai.use(DirtyChai);

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
    sinon
      .stub(seneca, 'export')
      .withArgs('transport/utils')
      .returns(transportUtils);
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
      const client = Client(seneca, options);
      client.should.be.an('object');
      client.should.have.property('start').that.is.a('function');
    });
  });

  describe('the Client#start() function', function() {
    it('should make a new Seneca client', function(done) {
      // Create seneca.export('transport/utils') stub
      // and spy on utils#make_client function
      const makeClient = sinon.spy(transportUtils, 'make_client');

      const callback = Function.prototype;
      const client = Client(seneca, options);
      client
        .start(callback)
        .then(() => {
          makeClient.should.have.been.calledOnce();
          makeClient.should.have.been.calledWith(
            seneca,
            sinon.match.func,
            options.options,
            callback
          );
        })
        .asCallback(done);
    });
  });

  describe('the Client object', function() {
    before(function() {
      DEFAULT_OPTIONS.meta$ = {
        pattern: 'role:create'
      };
    });

    beforeEach(function() {
      transportUtils['make_client'].restore();
    });

    after(function() {
      delete DEFAULT_OPTIONS.meta$;
    });

    it('should publish a new message to a queue on a Seneca act', function(done) {
      // Create seneca.export('transport/utils') stub
      // to make it call the provided callback, which -in turn- ends up
      // calling the `act` function on the client factory
      sinon.stub(transportUtils, 'make_client').callsFake((seneca, cb) =>
        cb(null, null, function(err, done) {
          if (err) {
            throw err;
          }
          return done(options.options, Function.prototype);
        })
      );

      // Spy on `channel#publish()` method
      const publish = sinon.spy(options.ch, 'publish');

      const client = Client(seneca, options);
      client
        .start(Function.prototype)
        .then(() => publish.should.have.been.calledOnce())
        .asCallback(done);
    });

    it('should handle a reply message upon arrival to the queue', function(done) {
      const reply = {
        content: JSON.stringify({ foo: 'bar' }),
        properties: {
          correlationId: 'bf6c362d-ca8b-4fa6-b052-2bb462e1b7b5',
          replyTo: 'reply.queue'
        }
      };

      // Create seneca.export('transport/utils') stub
      // to make it call the provided callback
      sinon
        .stub(transportUtils, 'make_client')
        .callsFake((seneca, cb) => cb(null, null, Function.prototype));

      // Make `channel#consume` call its handler function
      sinon
        .stub(channel, 'consume')
        .callsFake((queue, handler) =>
          Promise.resolve().then(() => handler(reply))
        );

      // Spy on `utils#handle_response`, which is what is used by
      // Seneca to handle client responses. It should be called on each reply
      let handleResponse = sinon.spy(transportUtils, 'handle_response');

      // Add `correlationId` to the passed options
      let opts = Object.assign({}, options);
      opts.options.correlationId = reply.properties.correlationId;

      const client = Client(seneca, opts);
      client
        .start(Function.prototype)
        .then(() => handleResponse.should.have.been.calledOnce())
        .asCallback(done);
    });
  });
});
