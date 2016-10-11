'use strict';

const Chai = require('chai');
const DirtyChai = require('dirty-chai');
const Sinon = require('sinon');
const SinonChai = require('sinon-chai');
require('sinon-bluebird');
Chai.should();
Chai.use(SinonChai);
Chai.use(DirtyChai);

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
  kind: 'res',
  sync: true,
  res: {
    pid: 14825,
    id: 74
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
      message.properties.correlationId = client.correlationId;
      done();
    });
  });

  before(function() {
    seneca.close();
  });

  describe('publish()', function() {
    it('should publish a valid message to the channel', Sinon.test(function() {
      // Setup spies
      var spyPrepareRequest = this.spy(client.utils, 'prepare_request');
      var spyStringifyJSON = this.spy(client.utils, 'stringifyJSON');
      var spyResolveClientTopic = this.spy(AmqpUtil, 'resolveClientTopic');
      var spyPublish = this.spy(transport.channel, 'publish');
      var spyDone = this.spy();

      var args = {
        max: 100,
        min: 25,
        role: 'create',
        meta$: {
          pattern: 'role:create',
          sync: true
        }
      };

      // publish the message
      client.publish()(args, spyDone);

      /*
       * assertions
       */
      spyPrepareRequest.should.have.been.calledOnce();
      spyStringifyJSON.should.have.been.calledOnce();
      spyResolveClientTopic.should.have.been.calledOnce();
      spyPublish.should.have.been.called();
    }));
  });

  describe('awaitReply()', function() {
    it('should await for reply messages from the channel', Sinon.test(function() {
      // stubs
      var spyConsume = this.stub(client.transport.channel, 'consume', function(queue, cb) {
        cb(message);
      });

      var stubHandleResponse = this.stub(client.utils, 'handle_response', function() {});

      // wait for reply messages
      client.awaitReply();

      /*
       * assertions
       */
      spyConsume.should.have.been.calledOnce();
      stubHandleResponse.should.have.been.calledOnce();
    }));
  });

  describe('consumeReply()', function() {
    it('should ignore messages if correlationId does not match', Sinon.test(function() {
      // Spies
      var spyParseJSON = this.spy(client.utils, 'parseJSON');
      var stubHandleResponse = this.stub(client.utils, 'handle_response', Function.prototype);

      // Consume the response message
      client.consumeReply()({
        properties: {
          correlationId: 'foo_d8a42bc0-9022-4db5-ab57-121cd21ac295'
        }
      });

      spyParseJSON.should.not.have.been.called();
      stubHandleResponse.should.not.have.been.called();
    }));

    it('should consume reply messages from the channel', Sinon.test(function() {
      // spies
      var spyParseJSON = this.spy(client.utils, 'parseJSON');

      var stubHandleResponse = this.stub(client.utils, 'handle_response', function() {});

      // consume the response message
      client.consumeReply()(message);

      /*
       * assertions
       */
      spyParseJSON.should.have.been.calledOnce();
      stubHandleResponse.should.have.been.calledOnce();
    }));

    it('should handle reply messages with no content', Sinon.test(function() {
      // spies
      var spyParseJSON = this.spy(client.utils, 'parseJSON');

      var stubHandleResponse = this.stub(client.utils, 'handle_response', function() {});

      // consume the response message
      client.consumeReply()(message);

      /*
       * assertions
       */
      spyParseJSON.should.have.been.calledOnce();
      stubHandleResponse.should.have.been.calledOnce();
    }));
  });

  describe('callback()', function() {
    it('should forward channel messages to consumeReply()', Sinon.test(function() {
      // stubs
      var spyConsume = this.stub(client.transport.channel, 'consume').resolves(message);
      var stubSendDone = this.stub();

      // consume the response message
      client.callback()(null, null, stubSendDone);

      /*
       * assertions
       */
      spyConsume.should.have.been.calledOnce();
    }));
  });
});
