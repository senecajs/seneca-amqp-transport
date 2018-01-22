'use strict'

const Promise = require('bluebird')
const chai = require('chai')
const sinon = require('sinon')
const DirtyChai = require('dirty-chai')
const SinonChai = require('sinon-chai')

chai.should()
chai.use(SinonChai)
chai.use(DirtyChai)

const Consumer = require('../../../lib/listener/consumer')

const QUEUE = 'seneca.role:create'

describe('On consumer module', function() {
  describe('the factory function', function() {
    it('should be a function', function() {
      Consumer.should.be.a('function')
    })

    it('should create a new Consumer', function() {
      const consumer = Consumer({})
      consumer.should.be.an('object')
      consumer.should.have.property('consume').that.is.a('function')
    })

    it('should throw if no channel is provided', function() {
      Consumer.should.throw(TypeError, /provided/)
    })
  })

  describe('the consume() method', function() {
    const channel = {
      consume: () => Promise.resolve()
    }

    before(function() {
      // Create spies for channel methods
      sinon.spy(channel, 'consume')
    })

    afterEach(function() {
      // Reset the state of the stub functions
      channel.consume.reset()
    })

    it('should return a Promise', function() {
      const consumer = Consumer(channel)
      consumer.consume().should.be.instanceof(Promise)
    })

    it('should start consuming using the given options', function() {
      const consumer = Consumer(channel)
      consumer.consume(QUEUE, { noAck: true })

      channel.consume.should.have.been.calledOnce()
      channel.consume.should.have.been.calledWith(
        QUEUE,
        sinon.match.func,
        sinon.match.has('noAck', true)
      )
    })

    it('should start consuming from given queue on the channel', function() {
      const consumer = Consumer(channel)
      consumer.consume(QUEUE)

      channel.consume.should.have.been.calledOnce()
      channel.consume.should.have.been.calledWith(QUEUE, sinon.match.func)
    })

    it('should consume from the queue given at creation time if not provided', function() {
      const consumer = Consumer(channel, {
        queue: QUEUE
      })
      consumer.consume()

      channel.consume.should.have.been.calledOnce()
      channel.consume.should.have.been.calledWith(QUEUE, sinon.match.func)
    })
  })

  describe('the onMessage() function', function() {
    it('should call a message handler function on receiving a valid message', function(done) {
      const message = {
        content: JSON.stringify({ foo: 'bar' }),
        properties: {
          correlationId: 'bf6c362d-ca8b-4fa6-b052-2bb462e1b7b5',
          replyTo: 'reply.queue'
        }
      }

      const channel = {
        ack: Function.prototype,
        consume: (queue, handler) =>
          Promise.resolve().then(() => handler(message))
      }

      const messageHandler = sinon.spy()
      const consumer = Consumer(channel, { messageHandler })
      consumer
        .consume()
        .then(function() {
          messageHandler.should.have.been.calledOnce()
          messageHandler.should.have.been.calledWith(
            message.content,
            sinon.match.func
          )
        })
        .asCallback(done)
    })

    it('should reject a message if the message handler throws an error', function(done) {
      const message = {
        content: JSON.stringify({ foo: 'bar' }),
        properties: {
          correlationId: 'bf6c362d-ca8b-4fa6-b052-2bb462e1b7b5',
          replyTo: 'reply.queue'
        }
      }

      const channel = {
        nack: Function.prototype,
        consume: (queue, handler) =>
          Promise.resolve().then(() => handler(message))
      }

      const messageHandler = function() {
        throw new Error()
      }

      const nack = sinon.spy(channel, 'nack')
      const consumer = Consumer(channel, { messageHandler })
      consumer
        .consume()
        .then(function() {
          nack.should.have.been.calledOnce()
          nack.should.have.been.calledWith(message, false, false)
        })
        .asCallback(done)
    })

    it('should reject a message if no content is defined', function(done) {
      const message = {
        properties: {
          correlationId: 'bf6c362d-ca8b-4fa6-b052-2bb462e1b7b5',
          replyTo: 'reply.queue'
        }
      }

      const channel = {
        consume: (queue, handler) =>
          Promise.resolve().then(() => handler(message)),
        nack: () => Promise.resolve()
      }

      // Create spies for channel methods
      sinon.spy(channel, 'nack')

      const messageHandler = sinon.spy()
      const consumer = Consumer(channel, { messageHandler })
      consumer
        .consume()
        .then(function() {
          messageHandler.should.not.have.been.called()
          channel.nack.should.have.been.calledOnce()
          channel.nack.should.have.been.calledWith(message, false, false)
        })
        .asCallback(done)
    })

    it('should reject a message if `replyTo` property is defined', function(done) {
      const message = {
        content: JSON.stringify({ foo: 'bar' }),
        properties: {
          correlationId: 'bf6c362d-ca8b-4fa6-b052-2bb462e1b7b5'
        }
      }

      const channel = {
        consume: (queue, handler) =>
          Promise.resolve().then(() => handler(message)),
        nack: () => Promise.resolve()
      }

      // Create spies for channel methods
      sinon.spy(channel, 'nack')

      const messageHandler = sinon.spy()
      const consumer = Consumer(channel, { messageHandler })
      consumer
        .consume()
        .then(function() {
          messageHandler.should.not.have.been.called()
          channel.nack.should.have.been.calledOnce()
          channel.nack.should.have.been.calledWith(message, false, false)
        })
        .asCallback(done)
    })
  })
})
