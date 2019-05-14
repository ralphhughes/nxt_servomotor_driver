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

// When exiting, turn the motor off
process.on('exit', function(code) {
    console.log('Turning motors off before quit...');
    motorA.digitalWrite(0);
    motorB.digitalWrite(0);
});
// Turn motors off when killed by Ctrl+C as well
process.on('SIGINT', function () {
    process.exit(0);
});

