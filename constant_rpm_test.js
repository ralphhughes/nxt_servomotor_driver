const pigpio = require('pigpio');
const Gpio = require('pigpio').Gpio;

const motorA = new Gpio(20, {mode: Gpio.OUTPUT});
const motorB = new Gpio(21, {mode: Gpio.OUTPUT});

const encoderA = new Gpio(23, {mode: Gpio.INPUT, alert: true});
const encoderB = new Gpio(24, {mode: Gpio.INPUT, alert: true});

// Start at full speed
motorA.digitalWrite(0);
let motorPWM = 90;
motorB.pwmWrite(motorPWM);
let motorRPMA = 0;
let motorRPMB = 0;

let firstTick = pigpio.getTick();

const watchEncoder = () => {
  let lastTickA = -1;
  let lastTickB = -1;

  encoderA.on('alert', (level, tick) => {
    if (lastTickA != -1) {
      let timeSinceLastTick = pigpio.tickDiff(lastTickA, tick);
      motorRPMA =  convertTickDeltaToRPM(timeSinceLastTick);
      if (pigpio.tickDiff(firstTick, tick) > 5e5) {
	console.log(tick + '\t' + motorRPMA + '\t' + timeSinceLastTick + '\tA\t' + level);
      }

    }
    lastTickA = tick;
  });
  encoderB.on('alert', (level, tick) => {
    if (lastTickB != -1) {
      let timeSinceLastTick = pigpio.tickDiff(lastTickB, tick);
      motorRPMB =  convertTickDeltaToRPM(timeSinceLastTick);
      if (pigpio.tickDiff(firstTick, tick) > 5e5) {
        console.log(tick + '\t' + motorRPMB + '\t' + timeSinceLastTick + '\tB\t' + level);
      }
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
setTimeout((function() {
    	return process.exit(0);
}), 4000);
