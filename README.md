# hapi-coap-listener [![Build Status](https://travis-ci.org/boneskull/hapi-coap-listener.svg?branch=master)](https://travis-ci.org/boneskull/hapi-coap-listener)

> CoAP listener for Hapi

## Install

```shell
$ npm install hapi-coap-listener
```

## Requirements

- [io.js](https://iojs.org) >= v2.0.1
- [Hapi](http://hapijs.com)

## Usage

```js
let Hapi = require('hapi');
let server = new Hapi.Server();

// This listener is tagged with 'coap' for retrieval by server.select()
let options = require('hapi-coap-listener')(server, {
  address: 'localhost',
  port: 5693
});

// Note that you are not limited to a single connection! Serve HTTP too!  
server.connection(options);

server.start(function(err) {
  if (err) {
    throw new Error(err);
  }
  console.log(`Hapi listening on ${server.info.uri}`); 
});
```

## License

© 2015 [Christopher Hiller](https://boneskull.com).  Licensed MIT.
