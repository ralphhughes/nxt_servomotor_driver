const pigpio = require('pigpio');
const Gpio = require('pigpio').Gpio;

const motorA = new Gpio(20, {mode: Gpio.OUTPUT});
const motorB = new Gpio(21, {mode: Gpio.OUTPUT});

const encoderA = new Gpio(23, {mode: Gpio.INPUT, alert: true});
const encoderB = new Gpio(24, {mode: Gpio.INPUT, alert: true});

// Common functions now split out to this file
var fs = require('fs');
eval(fs.readFileSync('common.js')+'');


motorA.digitalWrite(0);
motorB.digitalWrite(0);

const Controller = require('node-pid-controller');
let ctr = new Controller({
  k_p: 0.25,
  k_i: 0.05,
  k_d: 0.1
});

let setPoint = 0;
let numTicks = 0;
let lastTick = pigpio.getTick();
let startTick = lastTick;
let elapsedSeconds = 0;

const watchEncoder = () => {
  encoderA.on('alert', (level, tick) => {
    numTicks++;
  });
  encoderB.on('alert', (level, tick) => {
    numTicks++;
  });
};
watchEncoder();


// Set motor test routine
setInterval((function() {
  elapsedSeconds++;
  switch (elapsedSeconds) {
    case 1: setPoint = 85; break;
    case 5: setPoint = 0; break;
    case 9: setPoint = 150; break;
    case 13: setPoint = 0; break;
    case 17: process.exit(0); break;
    default: break;
  }
  console.error("New desired speed: " + setPoint + " RPM");
  ctr.setTarget(setPoint);
}), 1000);


function getMotorRPM() {
  tickDelta = pigpio.tickDiff(lastTick, pigpio.getTick());
  tickDeltaInSeconds = tickDelta / 1000000;
  ticksPerSecond = numTicks / tickDeltaInSeconds;
  rotationsPerSecond = ticksPerSecond / 720;
  motorRPM = rotationsPerSecond * 60;
//  console.log("td: " + tickDelta + "\tnumTicks: " + numTicks + "\tRPM: " + Math.round(motorRPM * 10)/10);
  numTicks = 0;
  lastTick = pigpio.getTick();
  return motorRPM;
}

motorPWM = 0;
console.log("Time\tSetpoint\tmotorRPM\tmotorPWM\tFeedback");
setInterval((function() {
  motorRPM = getMotorRPM(); // Only call this once per loop!
  feedback = ctr.update(motorRPM);
  motorPWM = Math.round(motorPWM + feedback);
  // motorPWM = interpolateFromLookupTable(controlValue);
  if (motorPWM > 255) {
    motorPWM = 255;
  }
  if (motorPWM < 0) {
    motorPWM = 0;
  }
  motorB.pwmWrite(motorPWM >> 0); // convert to unsigned 32 bit number

  console.log(((pigpio.getTick()-startTick) / 1e6) + "\t" + setPoint + "\t" + Math.round(motorRPM*10)/10 + "\t" + motorPWM + "\t" + Math.round(feedback));
}), 50);
