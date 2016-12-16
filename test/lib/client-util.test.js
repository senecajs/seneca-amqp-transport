'use strict';

const Chai = require('chai');
Chai.should();

const AmqpUtil = require('../../lib/client/client-util');

/**
 * client-utils unit tests
 */
describe('Unit tests for client-util module', function() {
  /**
   * Function: resolveClientQueue()
   */
  describe('resolveClientQueue()', function() {
    it('should use default prefix and separator if no options are provided', function() {
      var queue = AmqpUtil.resolveClientQueue();

      // queue name should contain default prefix 'seneca' and separator '.'
      queue.should.contain('seneca.');
    });

    it('should use custom prefix', function() {
      var options = {
        prefix: 'myprefix'
      };

      var queue = AmqpUtil.resolveClientQueue(options);
      queue.should.contain('myprefix.');
    });

    it('should use custom separator', function() {
      var options = {
        separator: '|'
      };

      var queue = AmqpUtil.resolveClientQueue(options);
      queue.should.contain('seneca|');
    });

    it('should use custom prefix and separator', function() {
      var options = {
        prefix: 'myprefix',
        separator: '|'
      };

      var queue = AmqpUtil.resolveClientQueue(options);
      queue.should.contain('myprefix|');
    });
  });

  /**
   * Function: resolveClientTopic()
   */
  describe('resolveClientTopic()', function() {
    it('should use a topic name starting with the action prefix', function() {
      var options = {
        meta$: {
          pattern: 'role:create'
        }
      };

      var topic = AmqpUtil.resolveClientTopic(options);
      topic.should.contain('role.');
    });
  });
});
