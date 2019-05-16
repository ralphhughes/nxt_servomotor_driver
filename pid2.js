const pigpio = require('pigpio');
const Gpio = require('pigpio').Gpio;

const motorA = new Gpio(20, {mode: Gpio.OUTPUT});
const motorB = new Gpio(21, {mode: Gpio.OUTPUT});

const encoderA = new Gpio(23, {mode: Gpio.INPUT, alert: true});
const encoderB = new Gpio(24, {mode: Gpio.INPUT, alert: true});
// encoderA.glitchFilter(100);
// encoderB.glitchFilter(100);

// Common functions now split out to this file
var fs = require('fs');
eval(fs.readFileSync('common.js')+'');


motorA.digitalWrite(0);
motorB.digitalWrite(0);

const Controller = require('node-pid-controller');
let ctr = new Controller({
  k_p: 0.5,
  k_i: 0,
  k_d: 0.1
});

let setPoint = 0;
let numTicks = 0;
let lastNumTicks = 0;
let timeLastTick = pigpio.getTick();
let startTick = timeLastTick;
let elapsedSeconds = 0;
let motorRPM = 0;

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
    case 1: setPoint = 60; break;
    case 4: setPoint = 0; break;
    case 7: setPoint = 160; break;
    case 10: setPoint = 0; break;
    case 13: setPoint = 100; break;
    case 16: setPoint = 0; break;
    case 18: process.exit(0); break;
    default: break;
  }
  // console.error("t=" + elapsedSeconds + ", setPoint=" + setPoint + " RPM");
  ctr.setTarget(setPoint);
}), 1000);


function getMotorRPM() {
  timeNow = pigpio.getTick();
  timeDelta = pigpio.tickDiff(timeLastTick, timeNow);
  timeDeltaInSeconds = timeDelta / 1000000;
  ticksPerSecond = (numTicks - lastNumTicks) / timeDeltaInSeconds;
  rotationsPerSecond = ticksPerSecond / 720;
  newMotorRPM = rotationsPerSecond * 60;
  if (motorRPM > 50) {
    // For some reason I keep getting readings that are half or double the correct count thrown in
    // consecutively (ok,ok,half of actual, double of actual, ok, ok etc). This filters them
    if ((newMotorRPM < (2*motorRPM)) && (newMotorRPM > (0.5*motorRPM))) {
      if (newMotorRPM < 200) {
        motorRPM = newMotorRPM;
      }
    }
  } else {
    motorRPM = newMotorRPM;
  }
  console.error("timeLastTick: " + timeLastTick + "\ttimeDelta: " + timeDelta + "\ttickDelta: " + (numTicks - lastNumTicks));
  lastNumTicks = numTicks;
  timeLastTick = timeNow;
  return motorRPM;
}

motorPWM = 0;
console.log("Time\tSetpoint\tmotorRPM\tFeedback\tnextPWM");
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
  if(motorPWM > 30) {
    motorB.pwmWrite(motorPWM >> 0); // convert to unsigned 32 bit number
  } else {
    motorB.pwmWrite(0);
  }

  console.log(((pigpio.getTick()-startTick) / 1e6) + "\t" + setPoint + "\t" + Math.round(motorRPM*10)/10 + "\t" + Math.round(feedback) + "\t" + motorPWM);
}), 20);
