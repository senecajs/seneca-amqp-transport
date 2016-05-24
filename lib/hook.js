'use strict';
/**
 * @module lib/hook
 */
const Amqpuri = require('amqpuri');

module.exports =
  class SenecaHook {
    constructor(seneca) {
      this.seneca = seneca;
      this.utils = seneca.export('transport/utils');
    }

    addCloseCmd(transport) {
      var seneca = this.seneca;
      return this.seneca.add('role:seneca,cmd:close', function(args, done) {
        try {
          transport.channel.close();
          transport.channel.connection.close();
        } catch (e) {
          // Channel already closed or closing
          seneca.log.warn('Channel failed to close', e);
        } finally {
          this.prior(args, done);
        }
      });
    }

    hook(options) {
      return (args, done) => {
        args = this.seneca.util.clean(this.seneca.util.deepextend(options[args.type], args));
        args.url = Amqpuri.format(args);
        return this.createTransport(args)
          .then((transport) => {
            transport.channel.on('error', done);
            return Promise.all([
              this.addCloseCmd(transport),
              this.createActor(args, transport, done)
            ]);
          }).catch(done);
      };
    }
  };
