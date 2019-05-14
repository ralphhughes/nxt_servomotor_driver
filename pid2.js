const pigpio = require('pigpio');
const Gpio = require('pigpio').Gpio;

const motorA = new Gpio(20, {mode: Gpio.OUTPUT});
const motorB = new Gpio(21, {mode: Gpio.OUTPUT});

const encoderA = new Gpio(23, {mode: Gpio.INPUT, alert: true});
const encoderB = new Gpio(24, {mode: Gpio.INPUT, alert: true});

function interpolateFromLookupTable(myInput) {
    // output is no-load pwm
    var outputs = [255, 247, 239, 231, 223, 215, 207, 199, 191, 183, 175, 167, 159, 151, 143, 135, 127, 119, 111, 103, 95, 87, 79, 71, 63, 55, 47, 39, 31];

    // input is desired open loop rpm
    var inputs = [167.5, 160.9, 159.7, 159.1, 158.3, 158.9, 155.3, 153.9, 150.0, 150.7, 148.2, 146.5, 143.9, 143.9, 136.9, 135.5, 130.3, 127.2, 121.2, 118.6, 110.1, 101.3, 95.0, 86.0, 73.5, 61.3, 47.4, 31.8, 15.2];

    if (inputs.length !== outputs.length) {
        return null;
    }
	// Truncate to upper and lower bounds of output, no extrapolation
    if (myInput < inputs[0]) {
        return outputs[0];
    }
    if (myInput > inputs[inputs.length - 1]) {
        return outputs[outputs.length - 1];
    }

    // loop through inputs and find if there's a match
    // if there is, return value from outputs with same value
    for (var i = 0; i < inputs.length; i++) {
        if (inputs[i] === myInput) {
            return outputs[i];
        }
    }

    // If we get to here, no exact match so need to find the values either side and interpolate
    var currentFromInputs, lastFromInputs;
    for (var i = 0; i < inputs.length; i++) {
        currentFromInputs = inputs[i];
        if (myInput > lastFromInputs && myInput < currentFromInputs) {
            // Interpolate
            var fractionAcrossInterval = (myInput - lastFromInputs) / (currentFromInputs - lastFromInputs);

            var lowerPercent = outputs[i - 1];
            var upperPercent = outputs[i];

            return lowerPercent + (fractionAcrossInterval * (upperPercent - lowerPercent));
        }
        lastFromInputs = currentFromInputs;
    }
}


motorA.digitalWrite(0);
motorB.digitalWrite(0);

const Controller = require('node-pid-controller');
let ctr = new Controller({
  k_p: 0.25,
  k_i: 0.01,
  k_d: 0.01
});

let setPoint = 0;
let numTicks = 0;
let lastTick = pigpio.getTick();
let startTick = lastTick;

const watchEncoder = () => {
  encoderA.on('alert', (level, tick) => {
    numTicks++;
    // lastTick = tick;
  });
};
watchEncoder();


// When exiting, turn the motor off
process.on('exit', function(code) {
    console.log('Turning motors off before quit...');
    motorA.digitalWrite(0);
    motorB.digitalWrite(0);
});
process.on('SIGINT', function () {
    process.exit(0);
});



setInterval((function() {
  setPoint = 10 * (Math.floor(Math.random() * 14) + 3);
  // setPoint = 130;
  if (secondsSinceStart() > 13) {
    setPoint = 0;
  }
  console.error("New desired speed: " + setPoint + " RPM");
  ctr.setTarget(setPoint);
}), 2000);

function secondsSinceStart() {
  tickDelta = pigpio.tickDiff(startTick, pigpio.getTick());
  tickDeltaInSeconds = tickDelta / 1000000;
  return tickDeltaInSeconds;
}

function getMotorRPM() {
  tickDelta = pigpio.tickDiff(lastTick, pigpio.getTick());
  tickDeltaInSeconds = tickDelta / 1000000;
  ticksPerSecond = numTicks / tickDeltaInSeconds;
  rotationsPerSecond = ticksPerSecond / 360;
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
  motorB.pwmWrite(motorPWM);

  console.log(((pigpio.getTick()-startTick) / 1e6) + "\t" + setPoint + "\t" + Math.round(motorRPM*10)/10 + "\t" + motorPWM + "\t" + Math.round(feedback));
}), 50);

setTimeout((function() {
  return process.exit(0);
}), 15000);

