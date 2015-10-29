'use strict';

const coapConnectionOpts = require('../lib');
const Server = require('hapi').Server;
const getPort = require('get-port');

describe(`with real server`, () => {
  it('should return a Hapi connection configuration object', function() {
    return getPort()
      .then(port => {
        const server = new Server({
          app: {
            coap: {
              host: 'localhost',
              port: port
            }
          }
        });

        return expect(coapConnectionOpts(server)).to.eventually.be.an('object')
        .then(opts => {
          expect(opts.listener).to.be.an('object');
          expect(opts.host).to.equal('localhost');
          expect(opts.labels).to.equal('coap');
          expect(opts.port).to.be.a('string');
          expect(opts.tls).to.be.false;
          expect(opts.uri).to.equal(`coap://${opts.host}:${port}`);
        });
      });
  });
});
