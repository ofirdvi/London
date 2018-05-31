// =======================
// get the packages we need ============
// =======================
var express = require('express');
var app = express();
var bodyParser = require('body-parser');


var jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
var Users = require('./routers/Users'); // get our users model
var poi = require('./routers/POI')
// =======================
// configuration =========
// =======================
var port = process.env.PORT || 3000;


// use body parser so we can get info from POST and/or URL parameters
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// use morgan to log requests to the console




// =======================
// routes ================
// =======================
// basic route
app.get('/', function (req, res) {
    res.send('Hello! The API is at http://localhost:' + port + '/api');
});



app.use('/poi', poi)
app.use('/users', Users)



// =======================
// start the server ======
// =======================
app.listen(port, function(){ console.log('Magic happens at http://localhost:' + port); })
