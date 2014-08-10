/*
 * ADXL345 Accelerometer driver
 * http://cylonjs.com
 *
 * Licensed under the Apache 2.0 license.
*/

'use strict';

var Cylon = require('cylon');

var ADXL345_REG_BWRATE = 0x2C,
    ADXL345_REG_PWCTL = 0x2D,
    ADXL345_REG_INTEN = 0x2E,
    ADXL345_RANGE_PM2G = 0,
    ADXL345_RANGE_PM4G = 1,
    ADXL345_RANGE_PM8G = 2,
    ADXL345_RANGE_PM16G = 3,
    ADXL345_REG_DATAFORMAT = 0x31,
    ADXL345_REG_DATAX0 = 0x32;

var Adxl345 = module.exports = function Adxl345() {
  Adxl345.__super__.constructor.apply(this, arguments);

  // fixme: make this an option
  // ON - 0x53
  // OFF - 0x1D
  this.address = 0x53;
  this.sensitivity = ADXL345_RANGE_PM2G;
};

Cylon.Utils.subclass(Adxl345, Cylon.Driver);

Adxl345.prototype.commands = ['setSensitivity', 'readGs'];

// Public: Starts the driver.
//
// Returns null.
Adxl345.prototype.start = function(callback) {
  var self = this;
  

  // Set 25 Hz output data rate and 25 Hz bandwidth and disable low power mode 
  this.connection.i2cWrite(this.address, ADXL345_REG_BWRATE, [0x08]);

  // Disable auto sleep 
  this.connection.i2cWrite(this.address, ADXL345_REG_PWCTL, [0x08]);

  // Disable interrupts (the pins are not brought out anyway) 
  this.connection.i2cWrite(this.address, ADXL345_REG_INTEN, [0x00]);

  this.setSensitivity(ADXL345_RANGE_PM2G);

  Adxl345.__super__.start.apply(this, arguments);
};

// Public: Sets the sensitivity of the sensor
// 0 -> Range: +-2G
// 1 -> Range: +-4G
// 2 -> Range: +-8G
// 3 -> Range: +-16G

//
// callback - params
//
// Returns null.
Adxl345.prototype.setSensitivity = function(sensitivity, cb) {
  var self = this;
  var tmp = sensitivity;

  if(sensitivity > 3) {
    return;
  }

  tmp = sensitivity & 0x03;

  this.sensitivity = sensitivity;

  this.connection.i2cWrite(this.address, ADXL345_REG_DATAFORMAT, [tmp], cb);
};

// Public: Returns the heading data for the compass
//
// callback - params
//
// Returns null.
Adxl345.prototype.readGs = function(callback) {
  var that = this;
  this.connection.i2cRead(this.address, ADXL345_REG_DATAX0, 6, function(error, data) {
    var ax = makeSignedInteger(data[0], data[1]),
        ay = makeSignedInteger(data[2], data[3]),
        az = makeSignedInteger(data[4], data[5]);

    var divisor;

    switch(that.sensitivity)
    {
        case ADXL345_RANGE_PM2G:
            divisor = 256.0;
            break;
        case ADXL345_RANGE_PM4G:
            divisor = 128.0;
            break;
        case ADXL345_RANGE_PM8G:
            divisor = 64.0;
            break;
        case ADXL345_RANGE_PM16G:
            divisor = 32.0;
            break;

        default:
            // assume 4g?
            divisor = 128.0;
            break;
    }

    ax /= divisor;
    ay /= divisor;
    az /= divisor;

    callback({
      'x': ax,
      'y': ay,
      'z': az
    });
  });
};

// we have high and low bits for a signed 16bit integer
// so it has to be converted into signed 32bit integer
function makeSignedInteger(highBits, lowBits) {
  var minusBits = 128;
  var leadingOnes = 4294901760;

  var value = (highBits << 8) | lowBits;

  if ((highBits & minusBits) == minusBits) {
    // first bit is 1, so the value has to be minus

    return value | leadingOnes;
  }

  return value;
}
