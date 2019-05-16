/*
Use this as follows
let Servomotor = require("./servomotor.js").Servomotor;
let motor1 = new Servomotor(20,21,10,11);
*/


function Servomotor(pwmA, pwmB, encA, encB) {
  this.pwmA = pwmA;
  this.pwmB = pwmB;
  this.encA = encA;
  this.encB = encB;
  console.log("created new object: " + pwmA + "\t" + pwmB + "\t" + encA + "\t" + encB);
}



Servomotor.prototype.setPosition = function (desiredAngle) {
  console.log("desiredAngle: " + desiredAngle);
};

Servomotor.prototype.setVelocity = function (desiredVelocity) {
  console.log("desiredVelocity: " + desiredVelocity);
};
module.exports = Servomotor;
