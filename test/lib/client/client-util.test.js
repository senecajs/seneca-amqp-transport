'use strict';

const chai = require('chai');
chai.should();

const amqputil = require('../../../lib/client/client-util');

/**
 * client-util unit tests
 */
describe('On client-util module', function () {
  /**
   * Function: resolveClientQueue()
   */
  describe('the resolveClientQueue() function', function () {
    it('should use a custom id if provided', function () {
      var options = {
        id: 'secret_id'
      };

      var queue = amqputil.resolveClientQueue(options);
      queue.should.equal('secret_id');
    });

    it('should use no prefix or separator if no options are provided', function () {
      var queue = amqputil.resolveClientQueue();
      // queue name should contain no prefix or separator
      queue.should.match(/^[A-F0-9]+$/i);
    });

    it('should use custom prefix and default separator', function () {
      var options = {
        prefix: 'seneca'
      };

      var queue = amqputil.resolveClientQueue(options);
      queue.should.contain('seneca.');
    });

    it('should not use custom separator if no prefix is provided', function () {
      var options = {
        separator: '|'
      };

      var queue = amqputil.resolveClientQueue(options);
      queue.should.not.contain('|');
    });

    it('should use custom prefix and custom separator', function () {
      var options = {
        prefix: 'seneca',
        separator: '|'
      };

      var queue = amqputil.resolveClientQueue(options);
      queue.should.contain('seneca|');
    });
  });

  /**
   * Function: resolveClientTopic()
   */
  describe('the resolveClientTopic() function', function () {
    it('should use a topic name starting with the action prefix', function () {
      var options = {
        meta$: {
          pattern: 'role:create'
        }
      };

      var topic = amqputil.resolveClientTopic(options);
      topic.should.contain('role.');
    });
  });
});
