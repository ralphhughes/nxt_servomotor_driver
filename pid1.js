const pigpio = require('pigpio');
const Gpio = require('pigpio').Gpio;

const motorA = new Gpio(20, {mode: Gpio.OUTPUT});
const motorB = new Gpio(21, {mode: Gpio.OUTPUT});
const encoderA = new Gpio(23, {mode: Gpio.INPUT, alert: true});

const Controller = require('node-pid-controller');
let ctr = new Controller({
  k_p: 0.50,
  k_i: 0.01,
  k_d: 0.01
});

let setPoint = 0;
ctr.setTarget(setPoint);

let startTick = pigpio.getTick();

// Forwards 25%
motorA.digitalWrite(0);
let motorPWM = 0;
let motorRPM = 0;
motorB.pwmWrite(motorPWM);

const watchEncoder = () => {
  let lastTickA = -1;

  encoderA.on('alert', (level, tick) => {
    // console.log('A:\t' + tick + '\t' + level);
    if (lastTickA != -1) {
      let timeSinceLastTick = pigpio.tickDiff(lastTickA, tick);
      motorRPM = (motorRPM + convertTickDeltaToRPM(timeSinceLastTick)) / 2;
    }
    lastTickA = tick;
  });
};
function convertTickDeltaToRPM(tickDelta) {
  tickDeltaInSeconds = tickDelta / 1000000; // tickDelta is in microseconds
  ticksPerSecond = 1 / tickDeltaInSeconds; // Convert to Hz
  rotationsPerSecond = ticksPerSecond / 360;
  return Math.round(rotationsPerSecond * 60); // RPM
}

watchEncoder();

console.log('Time\tTarget RPM\tRPM\tPWM\tFeedback');
setInterval((function() {
  // PID loop
      let feedback  = ctr.update(motorRPM);
      console.log((pigpio.getTick() - startTick)/1000000 + '\t' + setPoint + '\t' + motorRPM + '\t' + motorPWM + '\t' + feedback);
      motorPWM = motorPWM + feedback;
      if (motorPWM > 255) {
        motorPWM = 255;
      }
      if (motorPWM < 0) {
        motorPWM = 0;
      }
      motorB.pwmWrite(Math.round(motorPWM));

}), 30);

// When exiting, turn the motor off
process.on('exit', function(code) {
    // console.log('Turning motors off before quit...');
    motorA.digitalWrite(0);
    motorB.digitalWrite(0);
});

setTimeout((function() {
  setPoint = 50;
  ctr.setTarget(setPoint);
}), 500);

setTimeout((function() {
  return process.exit(0);
}), 5000);
