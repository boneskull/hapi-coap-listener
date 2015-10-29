'use strict';

const coap = require('coap');
const net = require('net');
const Promise = require('bluebird');
const tmp = Promise.promisifyAll(require('tmp'));
const _ = require('./utils');

const DEFAULTS = {
  labels: 'coap',
  host: 'localhost',
  port: 5683,
  sock: null
};

_.each(['Connection', 'Date'], coap.ignoreOption);

function createListener(server, opts) {
  if (_.isUndefined(server)) {
    throw new Error('Hapi.Server instance required');
  }

  opts = opts || {};

  const label = opts.labels;
  const coapServer = coap.createServer({
    port: opts.port,

    // is this OK?
    address: opts.host
  });
  const coapProxyServer = new net.Server();

  coapServer.on('close', function onClose() {
    server.log(label, 'CoAP server closed');
    coapProxyServer.close();
  })
  .on('request', (req, res) => {
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
  });

  coapProxyServer.on('close', () => {
    server.log(label, 'CoAP proxy server closed');
    coapServer.close();
  });

  coapProxyServer.on('listening', () => {
    coapServer.listen(() => {
      server.log(`CoAP server listening at ${opts.host}:${opts.port}`);
    });
  });

  return coapProxyServer;
}

function coapConnectionOpts(server, options, done) {
  if (!arguments.length) {
    throw new Error('Hapi.Server parameter required');
  }

  const opts = _.defaults({},
    options || {},
    server.settings.app.coap || {},
    DEFAULTS);

  return Promise.try(() => {
    if (opts.sock) {
      return opts.sock;
    }
    return tmp.tmpNameAsync();
  })
  .then(port => {
    const listener = coapConnectionOpts.createListener(server, opts);

    return {
      uri: `coap://${opts.host}:${opts.port}`,
      tls: false,
      port: port,
      listener: listener,
      host: opts.host,
      labels: opts.labels
    };
  })
  .asCallback(done);
}

coapConnectionOpts.createListener = createListener;

module.exports = coapConnectionOpts;
