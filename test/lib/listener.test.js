'use strict';

const Chai = require('chai');
const DirtyChai = require('dirty-chai');
const Sinon = require('sinon');
const SinonChai = require('sinon-chai');
Chai.should();
Chai.use(SinonChai);
Chai.use(DirtyChai);

const Defaults = require('../../defaults');
const seneca = require('seneca')();
const AMQPSenecaListener = require('../../lib/listener');

// Use default options
var options = Defaults.amqp;

var transport = {
  exchange: 'seneca.topic',
  queue: 'seneca.role:create',
  channel: {
    consume: function() {},
    sendToQueue: function() {},
    ack: function() {},
    nack: function() {}
  }
};

var data = {
  kind: 'act',
  act: {
    max: 100,
    min: 25,
    role: 'create'
  },
  sync: true
};

var message = {
  properties: {
    replyTo: 'seneca.res.r1FYNSEN'
  },
  content: new Buffer(JSON.stringify(data), 'utf-8')
};


var listener = null;

describe('Unit tests for AMQPSenecaListener module', function() {
  before(function(done) {
    seneca.ready(function() {
      // create a new AMQPSenecaListener instance
      listener = new AMQPSenecaListener(seneca, transport, options);

      done();
    });
  });

  before(function() {
    seneca.close();
  });

  describe('handleMessage()', function() {
    it('should not handle empty messages', Sinon.test(function() {
      // stubs
      var stubHandleRequest = this.stub(listener.utils, 'handle_request', function(seneca, data, options, cb) {
        return cb();
      });

      // spies
      var spyStringifyJSON = this.spy(listener.utils, 'stringifyJSON');
      var spySendToQueue = this.spy(transport.channel, 'sendToQueue');
      var spyAck = this.spy(transport.channel, 'ack');

      // handle the message
      listener.handleMessage(message, data);

      /*
       * assertions
       */
      stubHandleRequest.should.have.been.calledOnce();
      spyStringifyJSON.should.have.not.been.called();
      spySendToQueue.should.have.not.been.called();
      spyAck.should.have.not.been.called();
    }));

    it('should push messages to reply queue and acknowledge them', Sinon.test(function() {
      // stubs
      var stubHandleRequest = this.stub(listener.utils, 'handle_request', function(seneca, data, options, cb) {
        return cb(data);
      });

      // spies
      var spyStringifyJSON = this.spy(listener.utils, 'stringifyJSON');
      var spySendToQueue = this.spy(transport.channel, 'sendToQueue');
      var spyAck = this.spy(transport.channel, 'ack');

      // handle the message
      listener.handleMessage(message, data);

      /*
       * assertions
       */
      stubHandleRequest.should.have.been.calledOnce();
      spyStringifyJSON.should.have.been.calledOnce();
      spyStringifyJSON.should.have.been.calledWithExactly(seneca, 'listen-amqp', data);
      spySendToQueue.should.have.been.calledOnce();
      spySendToQueue.should.have.been.calledWithExactly(message.properties.replyTo, new Buffer(JSON.stringify(data)), {
        correlationId: message.properties.correlationId
      });
      spyAck.should.have.been.calledOnce();
      spyAck.should.have.been.calledWithExactly(message);
    }));
  });

  describe('listen()', function() {
    it('should listen and consume messages from the channel', Sinon.test(function() {
      // stubs
      var spyConsume = this.stub(transport.channel, 'consume', function(queue, cb) {
        // return the message
        return cb(message);
      });

      listener.listen(transport.queue, message);

      spyConsume.should.have.been.calledOnce();
    }));
  });

  describe('consume()', function() {
    it('should not acknowledge messages without content', Sinon.test(function() {
      var msg = {
        properties: {
          replyTo: 'seneca.res.r1FYNSEN'
        }
      };

      var spyNack = this.spy(transport.channel, 'nack');
      var spyHandleMessage = this.spy(listener, 'handleMessage');

      // consume the message
      listener.consume()(msg);

      spyNack.should.have.been.calledOnce();
      spyHandleMessage.should.not.have.been.called();
    }));

    it('should not acknowledge messages without a replyTo property', Sinon.test(function() {
      var msg = {
        properties: {}
      };

      var spyNack = this.spy(transport.channel, 'nack');
      var spyHandleMessage = this.spy(listener, 'handleMessage');

      // consume the message
      listener.consume()(msg);

      spyNack.should.have.been.calledOnce();
      spyHandleMessage.should.not.have.been.called();
    }));

    it('should handle a valid message', Sinon.test(function() {
      var spyNack = this.spy(transport.channel, 'nack');
      var spyHandleMessage = this.spy(listener, 'handleMessage');
      var spyParseJSON = this.spy(listener.utils, 'parseJSON');

      // consume the message
      listener.consume()(message);

      spyNack.should.not.have.been.called();
      spyParseJSON.should.have.been.calledOnce();
      spyHandleMessage.should.have.been.calledOnce();
    }));
  });
});
