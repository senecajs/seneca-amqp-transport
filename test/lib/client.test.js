'use strict';

const Chai = require('chai');
const Sinon = require('sinon');
const SinonChai = require('sinon-chai');
require('sinon-bluebird');
Chai.should();
Chai.use(SinonChai);

const Defaults = require('../../defaults');
const seneca = require('seneca')();
const AmqpUtil = require('../../lib/amqp-util');
const AMQPSenecaClient = require('../../lib/client');

// use the default options
var options = Defaults.amqp;

var transport = {
  exchange: 'seneca.topic',
  queue: 'seneca.role:create',
  channel: {
    publish: function() {},
    consume: function() {}
  }
};

var reply = {
  'kind': 'res',
  'sync': true,
  'res': {
    'pid': 14825,
    'id': 74
  }
};

var message = {
  properties: {
    replyTo: 'seneca.res.r1FYNSEN'
  },
  content: new Buffer(JSON.stringify(reply), 'utf-8')
};


var client = null;

describe('Unit tests for AMQPSenecaListener module', function() {
  before(function(done) {
    seneca.ready(function() {
      // create a new AMQPSenecaClient instance
      client = new AMQPSenecaClient(seneca, transport, options);

      done();
    });
  });

  before(function() {
    seneca.close();
  });

  describe('publish()', function() {
    it('should publish a valid message to the channel', Sinon.test(function() {
      // spies
      var spy_prepare_request = this.spy(client.utils, 'prepare_request');
      var spy_stringifyJSON = this.spy(client.utils, 'stringifyJSON');
      var spy_resolveClientTopic = this.spy(AmqpUtil, 'resolveClientTopic');
      var spy_publish = this.spy(transport.channel, 'publish');
      var spy_done = this.spy();

      var args = {
        max: 100,
        min: 25,
        role: 'create',
        'meta$': {
          pattern: 'role:create',
          sync: true
        }
      };

      // publish the message
      client.publish()(args, spy_done);

      /*
       * assertions
       */
      spy_prepare_request.should.have.been.calledOnce;
      spy_stringifyJSON.should.have.been.calledOnce;
      spy_resolveClientTopic.should.have.been.calledOnce;
      spy_publish.should.have.been.called;
    }));
  });

  describe('awaitReply()', function() {
    it('should await for reply messages from the channel', Sinon.test(function() {
      // stubs
      var stub_consume = this.stub(client.transport.channel, 'consume', function(queue, cb) {
        cb(message);
      });

      var stub_handle_response = this.stub(client.utils, 'handle_response', function() {});

      // wait for reply messages
      client.awaitReply();

      /*
       * assertions
       */
      stub_consume.should.have.been.calledOnce;
      stub_handle_response.should.have.been.calledOnce;
    }));
  });

  describe('consumeReply()', function() {
    it('should consume reply messages from the channel', Sinon.test(function() {
      // spies
      var spy_parseJSON = this.spy(client.utils, 'parseJSON');

      var stub_handle_response = this.stub(client.utils, 'handle_response', function() {});

      // consume the response message
      client.consumeReply()(message);

      /*
       * assertions
       */
      spy_parseJSON.should.have.been.calledOnce;
      stub_handle_response.should.have.been.calledOnce;
    }));
  });

  describe('callback()', function() {
    it('should forward channel messages to consumeReply()', Sinon.test(function() {
      // stubs
      var stub_consume = this.stub(client.transport.channel, 'consume').resolves(message);
      var stub_sendDone = this.stub();

      // consume the response message
      client.callback()(null, null, stub_sendDone);

      /*
       * assertions
       */
      stub_consume.should.have.been.calledOnce;
    }));
  });
});
