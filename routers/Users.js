var express = require('express');
var router = express.Router();;
var bodyParser = require('body-parser');
var app = express();
var DButilsAzure = require('../DButils');
var Regex = require("regex");
var jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
var  superSecret = "SUMsumOpen";

router.post('/Register', function (req, res) {
    var userToCheck=req.body;
    var valid=true;
    if(!userToCheck){
        valid=false
        res.send("Register Failure");
        res.end();
        return 
    }
    var userName=userToCheck.userName; 
    if(!/^[a-zA-Z]+$/.test(userName)){
        valid=false
        res.send("User name should contain only letters");
        res.end();
        return 
    }
    var lettersNumbers  =/^[0-9a-zA-Z]+$/;
    var password=userToCheck.password; 
    if(!(lettersNumbers.test(userToCheck.password))){
        valid=false
        res.send("password should contain only letters and numbers");
        res.end();
        return 
    }
    DButilsAzure.execQuery("select * from Users where userName= '"+userName+"'")
    .then(function(ans){   
        if(ans.length != 0){ 
            valid=false       
            res.send("Please Choose Another User Name");
            res.end(); 
            return          
        }
    var firstName=userToCheck.firstName;
    var lastName=userToCheck.lastName;
    var city=userToCheck.city;
    var country=userToCheck.country;
    var email=userToCheck.email;
    var question=userToCheck.question;
    var questionAns=userToCheck.questionAns;
    var questionID=userToCheck.questionID;

    let sql="insert into Users values(\'"+userName + "\', \'" +password + "\', \'" + firstName +
    "\', \'" + lastName + "\',\'" + city + "\',\'" + country + "\', \'" + email + "\', \'" + questionAns + "\', \'" + questionID +
    "\');";
    DButilsAzure.execQuery(sql)
    sendToken(userName,password, res)
    .catch(ans=>res.send("error" +ans));
 });
});

 router.post('/LogIn',function (req,res) {
    var userToCheck=req.body;
    
	if(!userToCheck){
		res.send("login failure");
		res.end();
	}
	var userName=userToCheck.userName;
	var password=userToCheck.password;
	DButilsAzure.execQuery("select user_password from Users where userName = '"+userName+"'")    
		.then(function(ans) {
			if (ans.length == 0)
				return Promise.reject('Wrong Username');
			else if (!(ans[0].user_password === userToCheck.password)) {
				return Promise.reject('Wrong Password');}                     			
			sendToken(userName,password,res)			        
			}
		)
	.catch(ans=>res.send("FALSE"));
    });
    
    router.post('/RestorePassword',function (req,res) {
		var userToCheck=req.body;
		if(!userToCheck){
			res.send("Restore Password Failure");
            res.end();
            return
		}
		var userName=userToCheck.userName;
		var ans=userToCheck.questionAns;

	   DButilsAzure.execQuery("select * from Users where userName = '"+userName+"'")    
			.then(function(ans) {		   
				if (ans.length == 0)
					return Promise.reject('Wrong Username');
				else if (ans[0].qustionAns !== userToCheck.questionAns) {
                    return Promise.reject('Wrong Answer');
                }					
				else{
                    password=ans[0].user_password,
                    res.send(password)
				}
			})
			.catch(ans=>res.send("" +ans));
		});


router.post('/authenticate', function (req, res) {

    if (!req.body.userName || !req.body.password)
        res.send({ message: "bad values" })

    else {

        for (id in Users) {
            var user = Users[id]

            if (req.body.userName == user.userName)
                if (req.body.password == user.password)
                    sendToken(user, res)
                else {
                    res.send({ success: false, message: 'Authentication failed. Wrong Password' })
                    return
                }
        }

        res.send({ success: false, message: 'Authentication failed. No such user name' })
    }

})


function sendToken(user,password, res) {
        var payload = {
            userName: user
        }
    
        var token = jwt.sign(payload, 'superSecret', {
            expiresIn: "1d"  // expires in 24 hours
        });
    
        // return the information including token as JSON
        res.json({
            success: true,
            message: 'Enjoy your token!',
            token: token
        });
    }


  


module.exports = router;