# NXT Servomotor Driver
Documentation, experiments and code for controlling a Lego Technic NXT servo motor with integral optical encoder from a Raspberry Pi with Node JS.

## Todo\Plan
- [x] Get nodejs to control the motor in forward and reverse with PWM in open loop mode
- [x] Get nodejs to read pulses from the optical encoder and calculate motor speed
- [ ] Get a PID controller working to control the PWM to the motor to enable speed control even when the load on the motor is increased
- [ ] Implement stall detection so that if the load on the motor is too great and speed control cannot be maintained even with the controller feeding it 100% PWM then fire off some sort of alert or error to the calling code
- [ ] Implement another controller for moving output shaft by a given number of degrees as quickly and accurately as possible without overshooting.
- [ ] Improve the angle controller so that it monitors the encoders at all times so that "go to a position and hold there" can be implemented.


## Test circuit schematic
![Schematic](docs/test_circuit_schematic_v1.png?raw=true "Schematic")


## Results
![Chart of pwm vs rpm](docs/nxt_servomotor_pwm_vs_rpm.png?raw=true "PWM vs RPM")
