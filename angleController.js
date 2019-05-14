



desiredAngleDelta = -100; // degrees

if (desiredAngleDelta < 0) {
  motorDir = -1;
}
if (desiredAngleDelta > 0) {
  motorDir = 1;
}

/* Simple trapezoidal movement algorithm:
Start the motor moving in the right direction at minimum starting speed
Count encoder pulses to see how far we've rotated
if we are less than halfway to our target angle, then increase the speed
if our speed is at maximum then keep it there and set a flag to say this is a long rotation
if we are more than halfway to our target angle, and this is a short rotation
  then decrease the speed at the same rate we increased it at.
if this is a long rotation umm...


*/
