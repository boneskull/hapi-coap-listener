'use strict';

describe('hapi-coap-listener', function() {
  let coapConnectionOpts = require('../lib');
  let net = require('net');
  let sandbox;
  let server;

  beforeEach(function() {
    sandbox = sinon.sandbox.create('hapi-coap-listener');
    server = {
      log: sandbox.stub(),
      select: sandbox.spy(function() {
        return this;
      }),
      inject: sandbox.stub().callsArgWith(1, {}),
      settings: {
        connections: {}
      }
    };
  });

  afterEach(function() {
    sandbox.restore();
  });

  describe('listener', function() {
    let nodeCoap = require('coap');
    let listener = coapConnectionOpts.listener;
    let req;
    let res;

    function getCoAPServer() {
      return nodeCoap.createServer.firstCall.returnValue;
    }

    beforeEach(function() {
      sandbox.stub(nodeCoap.createServer.prototype, 'listen').callsArg(0);
      req = {
        url: '/some/path'
      };
      res = {
        setOption: sandbox.stub(),
        end: sandbox.stub()
      };
    });

    it('should create a CoAPServer', function() {
      sandbox.spy(nodeCoap, 'createServer');
      listener(server);
      expect(nodeCoap.createServer).to.have.been.calledOnce;
    });

    it('should create a TCP server', function() {
      expect(listener(server)).to.be.instanceof(net.Server);
    });

    it('should throw if no server instance passed', function() {
      expect(listener).to.throw(Error);
    });

    describe('CoAPServer "close" event', function() {
      it('should also close the TCP server', function(done) {
        sandbox.spy(nodeCoap, 'createServer');
        let tcpServer = listener(server);
        let coapServer = getCoAPServer();
        sandbox.restore(nodeCoap, 'createServer');
        expect(coapServer).to.be.instanceof(nodeCoap.createServer);
        let stub = sinon.stub();
        tcpServer.on('close', stub);
        coapServer._sock = require('dgram').createSocket('udp4');
        coapServer.close();
        process.nextTick(function() {
          expect(stub).to.have.been.calledOnce;
          done();
        });
      });
    });

    describe('TCP server "close" event', function() {
      it('should also close the CoAPServer', function(done) {
        sandbox.spy(nodeCoap, 'createServer');
        let tcpServer = listener(server);
        let coapServer = getCoAPServer();
        sandbox.restore(nodeCoap, 'createServer');
        expect(coapServer).to.be.instanceof(nodeCoap.createServer);
        let stub = sandbox.stub();
        coapServer.on('close', stub);
        coapServer._sock = require('dgram').createSocket('udp4');
        tcpServer.close();
        process.nextTick(function() {
          expect(stub).to.have.been.calledOnce;
          done();
        });
      });
    });

    describe('CoAPServer "request" event', function() {
      let coapServer;

      beforeEach(function() {
        sandbox.stub(net.Server.prototype, 'emit');
        sandbox.spy(nodeCoap, 'createServer');
        listener(server);
        coapServer = getCoAPServer();
      });

      it('should inject a request to the proxy', function() {
        coapServer.emit('request', req, res);
        expect(server.inject).to.have.been.calledOnce;
      });

      it('should log something', function() {
        coapServer.emit('request', req, res);
        expect(server.log).to.have.been.called;
      });
    });

    describe('listen() callback', function() {
      beforeEach(function() {
        sandbox.spy(nodeCoap, 'createServer');
      });

      it('should call CoAPServer.prototype.listen()', function() {
        listener(server);
        let coapServer = getCoAPServer();
        expect(coapServer.listen).to.have.been.calledOnce;
      });

      it('should log something', function() {
        listener(server);
        let coapServer = getCoAPServer();
        coapServer.emit('request', req, res);
        expect(server.log).to.have.been.called;
      });
    });
  });

  describe('createListener()', function() {
    beforeEach(function() {
      sandbox.stub(require('tmp'), 'tmpNameSync').returns('/some/path');
      sandbox.stub(coapConnectionOpts, 'listener').returns({});
    });

    it('should call listener()', function() {
      coapConnectionOpts(server);
      expect(coapConnectionOpts.listener).to.have.been.calledOnce;
    });

    it('should throw if no server instance passed', function() {
      expect(coapConnectionOpts).to.throw(Error);
    });

    it('should return a Hapi connection configuration object', function() {
      expect(coapConnectionOpts(server, {
        port: 1234
      })).to.eql({
        listener: {},
        port: '/some/path',
        labels: 'coap',
        uri: 'coap://localhost:1234',
        tls: false,
        autoListen: true,
        address: undefined,
        host: 'localhost'
      });
    });
  });
});
