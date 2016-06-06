module.exports = function(options) {

    /**
     * Context: push_notifications
     * Story: campaigns
     *
     * @param {[type]} 'push_notifications:campaigns' [description]
     * @param {[type]} function(msg,                         done          [description]
     */
    this.add('role:create', function(message, done) {

      return done(null, {
        pid: process.pid,
        id: Math.floor(Math.random() * (message.max - message.min + 1)) + message.min
      });

    });

}
