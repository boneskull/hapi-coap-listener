'use strict';

let coap = require('coap');
let net = require('net');
let tmp = require('tmp');
let _ = require('./utils');

const DEFAULTS = {
  labels: 'coap',
  host: 'localhost',
  port: 5683,
  sock: null
};

_.each(['Connection', 'Date'], coap.ignoreOption);

function listener(server, opts) {
  if (_.isUndefined(server)) {
    throw new Error('Hapi.Server instance required');
  }

  opts = opts || {};

  let label = opts.labels;
  let coapServer = coap.createServer({
    port: opts.port,

    // is this OK?
    address: opts.host
  });
  let coapProxyServer = new net.Server();

  coapServer.on('close', function onClose() {
    server.log(label, 'CoAP server closed');
    coapProxyServer.close();
  })
    .on('request', function onRequest(req, res) {
      server.log(label, `CoAP server received request for ${req.url}`);

      server.select(label).inject({
        method: req.method,
        headers: req.headers,
        url: req.url,
        payload: req.payload
      }, function injectDone(response) {
        res.code = response.statusCode;
        _.each(response.headers, function setOptions(value, key) {
          res.setOption(key, value);
        });
        res.end(response.rawPayload);
      });
    })
    .listen(function onListen() {
      server.log(label, 'CoAP server listening');
    });

  coapProxyServer.on('close', function onClose() {
    server.log(label, 'CoAP proxy server closed');
    coapServer.close();
  });

  return coapProxyServer;
}

function coapConnectionOpts(server, options) {
  if (_.isUndefined(server)) {
    throw new Error('Hapi.Server parameter required');
  }

  let opts = _.defaults({},
    options || {},
    server.settings.connections.app.coap || {},
    DEFAULTS);

  return {
    uri: `coap://${opts.host}:${opts.port}`,
    autoListen: true,
    tls: false,
    listener: coapConnectionOpts.listener(server, opts),
    port: opts.sock || tmp.tmpNameSync(),
    host: opts.host,
    address: opts.address,
    labels: opts.labels
  };
}

coapConnectionOpts.listener = listener;

module.exports = coapConnectionOpts;
