'use strict';

const chai = require('chai')
const should = chai.should();
const sinon = require('sinon');
const SinonChai = require("sinon-chai");
chai.should();
chai.use(SinonChai);

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
    ack: function() {}
  }
};

describe('Unit tests for AMQPSenecaListener module', function() {

  before(function(done) {

    seneca.ready(function() {

      done();
    });

  });

  before(function() {

    seneca.close();
  });

  it('should handle messages from the transport channel', sinon.test(function() {

    var listener = new AMQPSenecaListener(seneca, transport, options);

    var message = {
      properties: {
        replyTo: 'seneca.res.r1FYNSEN'
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

    // stubs
    var stub_handle_request = sinon.stub(listener.utils, 'handle_request', function(seneca, data, options, cb) {
      cb(data);
    });

    // spies
    var spy_stringifyJSON = sinon.spy(listener.utils, 'stringifyJSON');
    var spy_sendToQueue = sinon.spy(transport.channel, 'sendToQueue');
    var spy_ack = sinon.spy(transport.channel, 'ack');

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
