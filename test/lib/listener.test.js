'use strict';

const Chai = require('chai');
const Sinon = require('sinon');
const SinonChai = require('sinon-chai');
Chai.should();
Chai.use(SinonChai);

const Defaults = require('../../defaults');
const seneca = require('seneca')();
const AMQPSenecaListener = require('../../lib/listener');

// use the default options
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
      var stub_handle_request = this.stub(listener.utils, 'handle_request', function(seneca, data, options, cb) {
        cb();
      });

      // spies
      var spy_stringifyJSON = this.spy(listener.utils, 'stringifyJSON');
      var spy_sendToQueue = this.spy(transport.channel, 'sendToQueue');
      var spy_ack = this.spy(transport.channel, 'ack');

      // handle the message
      listener.handleMessage(message, data);

      /*
       * assertions
       */
      stub_handle_request.should.have.been.calledOnce;
      spy_stringifyJSON.should.have.not.been.called;
      spy_sendToQueue.should.have.not.been.called;
      spy_ack.should.have.not.been.called;
    }));

    it('should push messages to reply queue and acknowledge them', Sinon.test(function() {
      // stubs
      var stub_handle_request = this.stub(listener.utils, 'handle_request', function(seneca, data, options, cb) {
        cb(data);
      });

      // spies
      var spy_stringifyJSON = this.spy(listener.utils, 'stringifyJSON');
      var spy_sendToQueue = this.spy(transport.channel, 'sendToQueue');
      var spy_ack = this.spy(transport.channel, 'ack');

      // handle the message
      listener.handleMessage(message, data);

      /*
       * assertions
       */
      stub_handle_request.should.have.been.calledOnce;
      spy_stringifyJSON.should.have.been.calledOnce;
      spy_stringifyJSON.should.have.been.calledWithExactly(seneca, 'listen-amqp', data);
      spy_sendToQueue.should.have.been.calledOnce;
      spy_sendToQueue.should.have.been.calledWithExactly(message.properties.replyTo, new Buffer(JSON.stringify(data)));
      spy_ack.should.have.been.calledOnce;
      spy_ack.should.have.been.calledWithExactly(message);
    }));
  });

  describe('listen()', function() {
    it('should listen and consume messages from the channel', Sinon.test(function() {
      // stubs
      var stub_consume = this.stub(transport.channel, 'consume', function(queue, cb) {
        // return the message
        cb(message);
      });

      listener.listen(transport.queue, message);

      stub_consume.should.have.been.calledOnce;
    }));
  });

  describe('consume()', function() {
    it('should not acknowledge messages without content', Sinon.test(function() {
      var msg = {
        properties: {
          replyTo: 'seneca.res.r1FYNSEN'
        }
      };

      var spy_nack = this.spy(transport.channel, 'nack');
      var spy_handleMessage = this.spy(listener, 'handleMessage');

      // consume the message
      listener.consume()(msg);

      spy_nack.should.have.been.calledOnce;
      spy_handleMessage.should.not.have.been.called;
    }));

    it('should not acknowledge messages without a replyTo property', Sinon.test(function() {
      var msg = {
        properties: {

        }
      };

      var spy_nack = this.spy(transport.channel, 'nack');
      var spy_handleMessage = this.spy(listener, 'handleMessage');

      // consume the message
      listener.consume()(msg);

      spy_nack.should.have.been.calledOnce;
      spy_handleMessage.should.not.have.been.called;
    }));

    it('should handle a valid message', Sinon.test(function() {
      var spy_nack = this.spy(transport.channel, 'nack');
      var spy_handleMessage = this.spy(listener, 'handleMessage');
      var spy_parseJSON = this.spy(listener.utils, 'parseJSON');

      // consume the message
      listener.consume()(message);

      spy_nack.should.not.have.been.called;
      spy_parseJSON.should.have.been.calledOnce;
      spy_handleMessage.should.have.been.calledOnce;
    }));
  });
});
