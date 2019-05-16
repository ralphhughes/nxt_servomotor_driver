var Servomotor = require("./servomotor.js");
var m1 = new Servomotor(20,21,10,11);

m1.setPosition(30);

m1.setVelocity(-170);
