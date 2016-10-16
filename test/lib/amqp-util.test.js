'use strict';

const Chai = require('chai');
Chai.should();

const AmqpUtil = require('../../lib/amqp-util');

/**
 * amqp-utils unit tests
 */
describe('Unit tests for amqp-util module', function() {
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


  /**
   * Function: resolveListenQueue()
   */
  describe('resolveListenQueue()', function() {
    it('should resolve single pin', function() {
      var pin = {
        role: 'entity',
        cmd: 'save'
      };

      var queue = AmqpUtil.resolveListenQueue(pin);
      queue.should.equal('seneca.role:entity.cmd:save');
    });

    it('should resolve pins with arrays of commands', function() {
      var pin = {
        role: 'entity',
        cmd: ['save', 'read', 'delete']
      };

      var queue = AmqpUtil.resolveListenQueue(pin);
      queue.should.equal('seneca.role:entity.cmd:save_read_delete');
    });

    it('should resolve multiple pins', function() {
      var pins = [{
        role: 'entity',
        cmd: ['save', 'read', 'delete']
      }, {
        role: 'entity',
        cmd: 'list'
      }, {
        foo: '*'
      }];

      var queue = AmqpUtil.resolveListenQueue(pins);
      queue.should.equal('seneca.role:entity.cmd:save_read_delete_list.foo:any');
    });

    it('should resolve multiple pins by honoring custom prefix and separator', function() {
      var pins = [{
        role: 'entity',
        cmd: 'save'
      }, {
        role: 'entity',
        cmd: 'list'
      }, {
        foo: '*'
      }];

      var options = {
        prefix: 'myprefix',
        separator: '_'
      };

      var queue = AmqpUtil.resolveListenQueue(pins, options);
      queue.should.equal('myprefix_role:entity_cmd:save_list_foo:any');
    });


    it('should resolve numeric and boolean pins', function() {
      var pins = [{
        remote: 1
      }, {
        cmd: 'act',
        fatal: true
      }];

      var queue = AmqpUtil.resolveListenQueue(pins);
      queue.should.equal('seneca.remote:1.cmd:act.fatal:true');
    });
  });


  /**
   * Function: resolveListenTopics()
   */
  describe('resolveListenTopics()', function() {
    it('should return an array of topics based on the array of pins', function() {
      var pins = [{
        role: 'entity',
        cmd: 'save'
      }, {
        role: 'entity',
        cmd: 'list'
      }, {
        foo: '*'
      }, {
        remote: 1
      }, {
        cmd: 'log',
        info: true,
        prefix: '1'
      }];

      var topics = AmqpUtil.resolveListenTopics(pins);
      topics.should.include.members([
        'cmd.save.role.entity',
        'cmd.list.role.entity',
        'foo.*',
        'remote.1',
        'cmd.log.info.true.prefix.1'
      ]);
    });
  });
});
