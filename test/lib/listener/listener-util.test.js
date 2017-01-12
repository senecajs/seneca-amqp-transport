'use strict';

const chai = require('chai');
chai.should();

const amqputil = require('../../../lib/listener/listener-util');

/**
 * listener-utils unit tests
 */
describe('On listener-util module', function() {
  /**
   * Function: resolveListenQueue()
   */
  describe('the resolveListenQueue() function', function() {
    it('should resolve single pin', function() {
      var pin = {
        role: 'entity',
        cmd: 'save'
      };

      var queue = amqputil.resolveListenQueue(pin);
      queue.should.equal('role:entity.cmd:save');
    });

    it('should resolve pins with arrays of commands', function() {
      var pin = {
        role: 'entity',
        cmd: ['save', 'read', 'delete']
      };

      var queue = amqputil.resolveListenQueue(pin);
      queue.should.equal('role:entity.cmd:save_read_delete');
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

      var queue = amqputil.resolveListenQueue(pins);
      queue.should.equal('role:entity.cmd:save_read_delete_list.foo:any');
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
        prefix: 'seneca',
        separator: '_'
      };

      var queue = amqputil.resolveListenQueue(pins, options);
      queue.should.equal('seneca_role:entity_cmd:save_list_foo:any');
    });


    it('should resolve numeric and boolean pins', function() {
      var pins = [{
        remote: 1,
        local: 33.3
      }, {
        cmd: 'act',
        fatal: true
      }];

      var queue = amqputil.resolveListenQueue(pins);
      queue.should.equal('remote:1.local:33.3.cmd:act.fatal:true');
    });
  });


  /**
   * Function: resolveListenTopics()
   */
  describe('the resolveListenTopics()', function() {
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
      }, {
        cmd: 'update',
        role: 'entity',
        version: 'v1.0.0',
        method: 'GET',
        remote: 1
      }];

      var topics = amqputil.resolveListenTopics(pins);
      topics.should.include.members([
        'cmd.save.role.entity',
        'cmd.list.role.entity',
        'foo.*',
        'remote.1',
        'cmd.log.info.true.prefix.1',
        'cmd.update.method.GET.remote.1.role.entity.version.v1[:dot:]0[:dot:]0'
      ]);
    });
  });
});
