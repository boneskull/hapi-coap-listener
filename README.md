# hapi-coap-listener [![Build Status](https://travis-ci.org/boneskull/hapi-coap-listener.svg?branch=master)](https://travis-ci.org/boneskull/hapi-coap-listener)

> CoAP listener for Hapi

## Install

```shell
$ npm install hapi-coap-listener
```

## Requirements

- [io.js](https://iojs.org) >= v2.0.1
- [Hapi](http://hapijs.com) >= v8.x

## Usage

```js
// app.js

let Hapi = require('hapi');

// add your own defaults here
let server = new Hapi.Server({
  connections: {
    coap: {
      host: 'localhost'
    }
  }
});

// connection props generated for you include: uri, listener, autoListen (true),
// and tls (false).  
let options = require('hapi-coap-listener')(server, {
  port: 5693, // this is the port of the CoAP server
  labels: ['coap', 'on-a-rope'] // default label is 'coap'
  sock: null // define a socket path here if you wish; otherwise one is created
});

server.connection(options);

server.route({
  method: 'GET',
  path: '/',
  handler: function(req, reply) {
    reply('Hello world!');
  })
});

server.start(function(err) {
  if (err) {
    throw new Error(err);
  }
  console.log(`Hapi listening on ${server.info.uri}`); 
});
```

Try it with [coap-cli](https://www.npmjs.com/package/coap-cli):

```sh
$ node /path/to/app.js # start CoAP server
```

In another shell:

```sh
$ npm install -g coap-cli
$ coap get coap://localhost/
```

## The How's and Why's

[CoAP](https://en.wikipedia.org/wiki/Constrained_Application_Protocol), at first glance, is fairly similar to HTTP, with its notion of "options" ("headers"), URL paths and modes.  Seems like a great fit for "web server" frameworks, doesn't it?

Well, yes and no.
 
The main problem arises from the fact that CoAP is bound to UDP instead of TCP.  This means it has no notion of a *connection*.  Hapi, and just about any other web server framework you will find, assumes you are listening with an HTTP server for HTTP traffic (if they didn't, they'd suck).  So, a web server will listen for the `connection` event to determine how to handle requests and responses from a client.  

Without a connection, you can't run a web server.  CoAP has no connections.  This looks grim.

But a cool thing about Hapi (and other frameworks as well, but I like Hapi) is that it gives you some wiggle room.  You can hand it a generic TCP server (think `net.Server()`) for a listener (see [`server.connection()`](http://hapijs.com/api#serverconnectionoptions)).  Even better, it doesn't need to bind to a port of a network interface, and can bind to a UNIX socket (or Windows pipe).  Hapi will listen on that TCP server for HTTP requests and reply with HTTP responses--even if it's listening on some file in `/tmp/`.  Furthermore, it streamlines "faking" connections with [`server.inject()`](http://hapijs.com/api#serverinjectoptions-callback).

This module gives Hapi a dummy TCP server acting as a proxy to a CoAP server.  Rough flow:

1. A client requests `coap://host:port/some/route`
2. CoAP server injects the request into the TCP server
3. Hapi dispatches the request and any routes, handlers, etc. are invoked
4. Upon reply, the callback function CoAPifies* the response object, then issues a proper response to the client

What happened to the UNIX socket?  Nothing.  We don't use it.  Then why not just forget about the TCP server, and inject into a HTTP listener?  Loose coupling, mainly--a separate connection allows you to make CoAP- or HTTP-only routes, configuration, or runtime data.  Indeed, as-of-yet unimplemented features ([see below](#roadmap)) may further necessitate the schism.  Also, this assumes you're running a HTTP server.

*CoAPification: translating an HTTP request or response into a CoAP request or response, respectively

## Roadmap

Currently, this module **does not** support anything beyond basic requests and responses.  So:

1.  [Observe mode](https://github.com/boneskull/hapi-coap-listener/issues/2) (multiple responses per request)
2.  [Multicast](https://github.com/boneskull/hapi-coap-listener/issues/3) (possible?  no idea)
3.  [DTLS](https://github.com/boneskull/hapi-coap-listener/issues/4) (probably impossible without monkeypatching Hapi)
4.  [Blockwise transfers](https://github.com/boneskull/hapi-coap-listener/issues/5) (I have no idea what this even is)

## License

© 2015 [Christopher Hiller](https://boneskull.com).  Licensed MIT.
