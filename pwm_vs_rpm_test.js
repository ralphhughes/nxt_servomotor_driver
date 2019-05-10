const pigpio = require('pigpio');
const Gpio = require('pigpio').Gpio;

const motorA = new Gpio(20, {mode: Gpio.OUTPUT});
const motorB = new Gpio(21, {mode: Gpio.OUTPUT});

const encoderA = new Gpio(23, {mode: Gpio.INPUT, alert: true});
const encoderB = new Gpio(24, {mode: Gpio.INPUT, alert: true});

// Start at full speed
motorA.digitalWrite(0);
let motorPWM = 255;
motorB.pwmWrite(motorPWM);
let motorRPMA = 0;
let motorRPMB = 0;

const watchEncoder = () => {
  let lastTickA = -1;
  let lastTickB = -1;

  encoderA.on('alert', (level, tick) => {
    if (lastTickA != -1) {
      let timeSinceLastTick = pigpio.tickDiff(lastTickA, tick);
      motorRPMA = (motorRPMA + convertTickDeltaToRPM(timeSinceLastTick)) / 2;
      if (convertTickDeltaToRPM(timeSinceLastTick) > 180) {
	console.log('A: ' + convertTickDeltaToRPM(timeSinceLastTick) + '\t' + timeSinceLastTick);
      }

    }
    lastTickA = tick;
  });
  encoderB.on('alert', (level, tick) => {
    if (lastTickB != -1) {
      let timeSinceLastTick = pigpio.tickDiff(lastTickB, tick);
      motorRPMB = (motorRPMB + convertTickDeltaToRPM(timeSinceLastTick)) / 2;
    }
    lastTickB = tick;
  });



};

function convertTickDeltaToRPM(tickDelta) {
  tickDeltaInSeconds = tickDelta / 1000000; // tickDelta is in microseconds
  ticksPerSecond = 1 / tickDeltaInSeconds; // Convert to Hz
  rotationsPerSecond = ticksPerSecond / 360;
  return Math.round(rotationsPerSecond * 60); // RPM
}

watchEncoder();


// When exiting, turn the motor off
process.on('exit', function(code) {
    console.log('Turning motors off before quit...');
    motorA.digitalWrite(0);
    motorB.digitalWrite(0);
});


// Exit after a few seconds
setInterval((function() {
    console.log(motorPWM + '\t' + motorRPMA + '\t' + motorRPMB);
    motorPWM = motorPWM - 8;
    if (motorPWM < 0) {
	return process.exit(0);
    } else {
        motorB.pwmWrite(motorPWM);
    }
}), 1000);
