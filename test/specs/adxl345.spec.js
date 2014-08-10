'use strict';

var Cylon = require('cylon');

var Adxl345 = source('adxl345');

describe('Cylon.Drivers.I2C.Adxl345', function() {
  var driver = new Adxl345({
    name: 'Adxl345',
    device: {
      connection: {},
      pin: 13,
      emit: spy()
    }
  });

  describe("#constructor", function() {
    it("sets default @address to 0x53", function() {
      expect(driver.address).to.be.eql(0x53);
    });
  });

  describe("#commands", function() {
    it("returns an array of ADXL345 commands", function() {
      var commands = driver.commands;

      expect(commands).to.be.an('array');

      for (var i = 0; i < commands.length; i++) {
        expect(commands[i]).to.be.a('string');
      }
    });
  });

  describe("#start", function() {
    var callback, i2cWrite;

    beforeEach(function() {
      callback = spy();
      i2cWrite = driver.connection.i2cWrite = stub();
      driver.start(callback);
    });

    afterEach(function() {
      driver.connection.i2cWrite = undefined;
    });

    it("sets up 25 Hz", function() {
      expect(i2cWrite).to.be.calledWith(0x53, 0x2C, [0x08]);
    });

    it("sets up auto sleep", function() {
      expect(i2cWrite).to.be.calledWith(0x53, 0x2D, [0x08]);
    });

    it("disable interrupts", function() {
      expect(i2cWrite).to.be.calledWith(0x53, 0x2E, [0x00]);
    });

    it("triggers the callback", function() {
      expect(callback).to.be.called;
    });
  });

  describe("#readGs", function() {
    var callback;

    beforeEach(function() {
      callback = spy();
      stub(driver, 'readGs');
      driver.readGs(callback);
    });

    afterEach(function() {
      driver.readGs.restore();
    });

    it("passes the provided callback to #readGs", function() {
      expect(driver.readGs).to.be.calledWith(callback);
    });
  });
});
