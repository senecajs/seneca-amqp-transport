![Seneca](http://senecajs.org/files/assets/seneca-logo.png)

> A [Seneca.js][1] transport plugin

# seneca-amqp-transport
[![js-semistandard-style](https://cdn.rawgit.com/flet/semistandard/master/badge.svg)](https://github.com/Flet/semistandard)

This plugin allows seneca listeners and clients to communicate over [AMQP][2].

## Install

```sh
npm install seneca-amqp-transport
```

## Usage
The following snippets showcase the most basic usage examples.

### Listener

```javascript
require('seneca')()
  .use('seneca-amqp-transport')
  .add('role:create', function(message, done) {
    return done(null, {
      pid: process.pid,
      id: Math.floor(Math.random() * (message.max - message.min + 1)) + message.min
    });
  })
  .listen({
    type: 'amqp',
    pin: 'role:create'
  });
```

### Client

```javascript
var client = require('seneca')()
  .use('seneca-amqp-transport')
  .client({
    type: 'amqp',
    pin: 'role:create'
  });

setInterval(function() {
  client.act('role:create', {
    max: 100,
    min: 50
  }, console.log);
}, 500);
```

## Options
The following object describes the available options for this transport. These are applicable to both clients and listeners.

```json
{
  "amqp": {
    "type": "amqp",
    "url": "amqp://localhost",
    "exchange": {
      "type": "topic",
      "name": "seneca.topic",
      "options": {
        "durable": true,
        "autoDelete": false
      }
    },
    "queues": {
      "action": {
        "durable": true
      },
      "response": {
        "autoDelete": true,
        "exclusive": true
      }
    }
  }
}
```

To override this settings, pass them to the plugin's `.use` declaration:

```javascript
require('seneca')()
  .use('seneca-amqp-transport', {
    queues: {
      action: {
        durable: false
      }
    }
  });
```

### Transport options
AMQP related options may be indicated either by [the connection URI](https://www.rabbitmq.com/uri-spec.html) or by passing additional parameters to the `seneca#client()` or `seneca#listen()` functions.

This,

```javascript
require('seneca')()
  .use('seneca-amqp-transport')
  .client({
    type: 'amqp',
    url: 'amqp://guest@guest:rabbitmq.host:5672/seneca?locale=es_AR'
  });
```

will result in the same connection URI as:

```javascript
require('seneca')()
  .use('seneca-amqp-transport')
  .client({
    type: 'amqp',
    hostname: 'rabbitmq.host',
    port: 5672,
    vhost: 'seneca',
    locale: 'es_AR',
    username: 'guest',
    password: 'guest'
  });
```

### Socket options
Additionally, you may pass in options to the `amqp.connect` method of [amqplib][3] as documented in [its API reference][4], using the `socketOptions` parameter.

```javascript
// Example of using a TLS/SSL connection. Note that the server must be
// configured to accept SSL connections; see http://www.rabbitmq.com/ssl.html.

var fs = require('fs');

var opts = {
  cert: fs.readFileSync('../etc/client/cert.pem'),
  key: fs.readFileSync('../etc/client/key.pem'),
  // cert and key or
  // pfx: fs.readFileSync('../etc/client/keycert.p12'),
  passphrase: 'MySecretPassword',
  ca: [fs.readFileSync('../etc/testca/cacert.pem')]
};

require('seneca')()
  .use('seneca-amqp-transport')
  .client({
    type: 'amqp',
    url: 'amqp://guest@guest:rabbitmq.host:5672/seneca?locale=es_AR',
    socketOptions: opts
  });
```

> Snippet above is based on [amqplib/examples/ssl.js][5]

## Run the examples

There are simple examples under the `/examples` directory. To run them, just execute:

```sh
# Start listener.js
cd examples
AMQP_URL='amqp://guest:guest@dev.rabbitmq.com:5672' node listener.js
2016-01-19T19:43:41.883Z xsgjohldv9st/1453232621872/26290/- INFO	hello	Seneca/1.0.0/xsgjohldv9st/1453232621872/26290/-
2016-01-19T19:43:42.272Z xsgjohldv9st/1453232621872/26290/- INFO	listen	{type:amqp,pin:role:create}
2016-01-19T19:43:45.114Z xsgjohldv9st/1453232621872/26290/- INFO	plugin	amqp-transport	listen	open	{type:amqp,url:amqp://guest:guest@dev.rabbitmq.com:5672,exchange:{name:seneca.direct,options:{durable:true,auto	{did:(4eq8t),fixedargs:{},context:{module:{id:/home/nfantone/dev/js/seneca-amqp-transport/node_modules/seneca/l...

# Start client.js
cd examples
AMQP_URL='amqp://guest:guest@dev.rabbitmq.com:5672' node client.js
2016-01-19T19:45:27.797Z kozrmji8xksw/1453232727786/26313/- INFO	hello	Seneca/1.0.0/kozrmji8xksw/1453232727786/26313/-
2016-01-19T19:45:28.162Z kozrmji8xksw/1453232727786/26313/- INFO	client	{type:amqp,pin:role:create}
null { pid: 26290, id: 46 }
null { pid: 26290, id: 36 }
null { pid: 26290, id: 73 }
# ...
```

> If you don't export the env variable `AMQP_URL` the default value of `amqp://localhost` will be used.

## TODO
- Tests

Any help/contribution is appreciated!

[1]: https://senecajs.org/
[2]: https://www.amqp.org/
[3]: https://github.com/squaremo/amqp.node
[4]: http://www.squaremobius.net/amqp.node/channel_api.html#connect
[5]: https://github.com/squaremo/amqp.node/blob/b74a7ca6acbfcd0fb10127d4770b4f825da57745/examples/ssl.js
