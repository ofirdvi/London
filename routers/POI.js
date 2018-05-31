var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var app = express();
var DButilsAzure = require('../DButils');
var Regex = require("regex");
var jwt = require('jsonwebtoken');
var  superSecret = "SUMsumOpen";
var _userName;

router.use('/', function (req, res, next) {
        // check header or url parameters or post parameters for token
        var token = req.body.token || req.query.token || req.headers['token'];  
        // decode token
        if (token) {
            jwt.verify(token, 'superSecret', function (err, decoded) {
                if (err) {
                    return res.json({ success: false, message: 'Failed to authenticate token.' });
                } else {
                    // if everything is good, save to request for use in other routes
                    // get the decoded payload and header
                    var decoded = jwt.decode(token, {complete: true});
                    req.decoded= decoded;
					_userName=decoded.payload.userName;					
                    next();
                }
            });
    
        } else {
    
            // if there is no token
            // return an error
            return res.status(403).send({
                success: false,
                message: 'No token provided.'
            });
        }
    
    })


	router.post('/POIRank',function (req,res) {
		var POI_Name =req.body.POI_Name;
		var Rank =req.body.POI_Rank;
		let sql="INSERT INTO POI_Rank (POI_Name , Rank) values(\'"+POI_Name + "\', \'" +Rank + "\');"; 
		DButilsAzure.execQuery(sql)    
		.then(function() {
			let sql = "select (SUM(Rank)/count(*)) as Aev from POI_Rank where POI_Name ='"+POI_Name+"' " 
			DButilsAzure.execQuery(sql)    
			.then(function(ans) {
				let POI_Aev_Rank = ans[0].Aev
				let Percentage =  (POI_Aev_Rank/5)*100;
				let sql = "UPDATE POI SET Rank_Per = "+Percentage+" where POI_Name ='"+POI_Name+"' "
				DButilsAzure.execQuery(sql)
				.then(ans=> res.send("then"))
				.catch(ans=>res.send("catch"));          
			})
		})
		.then(ans=> res.send("TRUE"))
		.catch(ans=>res.send("FALSE"));
	 });

 
	 //add poi review
	router.post('/POIReview',function (req,res) {
		var POI_Name =req.body.POI_Name;
		var Review =req.body.POI_Review;
		let sql="select top 1 Review_Num FROM POI_Review where POI_Name ='"+POI_Name+"' ORDER BY Review_Date Desc"; 
		DButilsAzure.execQuery(sql)    
		.then(function(ans) {
			let Review_Number = ans[0].Review_Num
			let sql = "UPDATE POI_Review  SET Review_Description = '"+Review+"', Review_Date = GETDATE() WHERE POI_Name ='"+POI_Name+"' AND Review_Num = "+Review_Number+"" 
			DButilsAzure.execQuery(sql)    
			.then(function() {
				let sql = "UPDATE POI SET Review_Desc_"+Review_Number+" = '"+Review+"' , Review_Date_"+Review_Number+"  = GETDATE() WHERE POI_Name ='"+POI_Name+"'" 
				DButilsAzure.execQuery(sql)    
				.then(function() {
					console.log("good")
				.catch(ans=>res.send("catch"));          
				})          
			})
		})
		.then(ans=> res.send("TRUE"))
		.catch(ans=>res.send("FALSE"));
	 });

	 //app.get('/Users/RecentSavedPOI/:UserName',function (req,res) {
	 router.get('/RecentSavedPOI',function (req,res) {
		var User_Name=_userName;
		let sql ="select top 2 POI_Name from User_Fav_POI where UserName ='"+User_Name+"' order by POI_Save_Date DESC";
		DButilsAzure.execQuery(sql)    
		.then(function(ans) {
			if (ans.length == 0)
				return Promise.reject('Wrong User_Name');
			else{  
				POI_Name1 = ans[0].POI_Name
				POI_Name2 = ans[1].POI_Name
				let sql = "select * from POI where POI_Name in ('"+POI_Name1+"','"+POI_Name2+"')"
				DButilsAzure.execQuery(sql)    
				.then(function(ans) {
					res.json({
						poi: ans
					});	
				})
			}
		})
		
			.catch(ans=>res.send("FALSE"));          
		});

		router.post('/AddPOIToUserFavorites', function (req, res) {
			var poiName = req.body.poiName;
			var UserName = _userName;
		

			let sql ="insert into User_Fav_POI values('"+UserName+"','"+poiName+"', getdate(),0)"
			DButilsAzure.execQuery(sql)   
			.then(function(ans) {
				console.log(ans)}
		   )
		   .then(ans=> res.send("TRUE"))
		   .catch(ans=>res.send("FALSE"));
		});

	 router.get('/GetAllPOI',function (req,res) 
	 {
		 let sql ="select POI_Name from POI"
		 DButilsAzure.execQuery(sql)   
		 .then(function(ans) {
		  
				 res.json({
					 poi: ans
				 });	
			 }
		)
		
	 });

	 //Return list of all the user favorites POI.
	router.get('/GetUsersAllFavPOI',function (req,res) {
		var User_Name= _userName;
		let sql ="select * from POI where Category_Name in( select Category_Name from User_Fav_Categories where UserName ='"+User_Name+"')";
		DButilsAzure.execQuery(sql)    
		.then(function(ans) {
			if (ans.length == 0)
				return Promise.reject('Wrong POI UsersName');
			else{  
				res.json({
					poi: ans
				});	
			}
		})
		//.then(ans=> res.send("TRUE"))
		.catch(ans=>res.send("FALSE"));
	 });


     router.get('/POIName/:POI_Name',function (req,res) {
        var POI_Name=req.params.POI_Name;
        let sql ="select * from POI where POI_Name ='"+POI_Name+"'";
        DButilsAzure.execQuery(sql)    
        .then(function(ans) {
            if (ans.length == 0)
                return Promise.reject('Wrong POI Name');
            else{  
                res.json({
					poi: ans
				});	
            }
        })
        .then(ans=> res.send("then"))
        .catch(ans=>res.send("catch"));
	 });
	 
	 router.get('/PopularPOI',function (req,res) 
	 {
	 var tresh=60;
	 DButilsAzure.execQuery("select POI_Name from POI where Rank_Per >= "+tresh+"")    
		 .then(function(ans) {
			 res.json({
				 poi:ans
				 });                          
			 }
		 )
		 .catch(ans=>res.send("" +ans));
	 });
 	router.get('/Category/:Category_Name',function (req,res) {
		var Category_Name = req.params.Category_Name;
		let sql ="select * from POI where Category_Name ='"+Category_Name+"'";
		DButilsAzure.execQuery(sql)    
		.then(function(ans) {
			if (ans.length == 0)
				return Promise.reject('Wrong POI Name');
			else if (!(ans[0].Category_Name === Category_Name)) {
				return Promise.reject('Wrong Answer');}
			else{  
				res.json({
					poi: ans
				});	
			}
		})
	   .catch(ans=>res.send("catch"));
	 });


	 router.delete('/RemovePOIFromUserFav', function (req, res, next) {
		var User_Name= _userName; 
		var POI_Name=req.body.POIName;
        var sql ="DELETE FROM User_Fav_POI WHERE POI_Name='"+POI_Name+"' AND UserName = '"+User_Name+"'";  
        DButilsAzure.execQuery(sql)
        .then( res.send("TRUE"))
        .catch(ans=>res.send("FALSE"));
	});
	
   //Return 2 most popular POI by the user’s favourite categories (one for each category) 
   router.get('/GetUser2PopularPOI',function (req,res) {
	var User_Name= _userName;

	var sql ="select POI_Name,Category_Name from POI where Category_Name in( select Category_Name from User_Fav_Categories where UserName ='"+User_Name+"') order by Rank_Per DESC";

	DButilsAzure.execQuery(sql)    
	.then(function(ans) {
		
		let poi_name1 = ans[0].POI_Name;
		let category1 = ans[0].Category_Name;		
		let poi_name2;
		let find = 0;
		let i = 1;
		let j=ans.length
		var found=false			
		while (i<j && found==false) {			
			if (ans[i].Category_Name!= category1){					
				poi_name2 = ans[i].POI_Name;
				found=true							
			}		
			i++;		
		}
		let sql;
		if(!found)
				sql="SELECT * FROM POI WHERE POI_Name in ('"+poi_name1+"')";
		else
			 sql = "SELECT * FROM POI WHERE POI_Name in ('"+poi_name1+"','"+poi_name2+"')"
	
		DButilsAzure.execQuery(sql)   
		.then(function(ans) {
			
			res.json({
				poi: ans
			});
		})
	})
	
	.catch(ans=>res.send("catch"));
	
 });


 router.post('/SaveAllFavPOIByUser',function (req,res) {
    var UserName = _userName
    var POI_Array =req.body.POI_Array;
    for(var i=0; j=POI_Array.length,i<j; i++){
        var POI_Name = POI_Array[i].POI_Name;
        var POI_Saved_Date =  POI_Array[i].date;
        var sql = "INSERT INTO User_Fav_POI  VALUES ('"+UserName+"','"+POI_Name+"', GETDATE(), 0)"
        DButilsAzure.execQuery(sql) 
        .then(function(result){
            res.sendStatus(200);
        }).catch(function(err){
            res.send(err);
        })
    }   

 });

 router.post('/SetFavPOIOrderByUser',function (req,res) {
    var UserName = _userName
    var POI_Array =req.body.POI_Array;
    var i=0;
    for(var i=0; j=POI_Array.length,i<j; i++){
        var POI_Name = POI_Array[i].POI_Name;
        var POI_Order =  POI_Array[i].Order;
        var sql = "UPDATE  User_Fav_POI set POI_Order = "+POI_Order+" where UserName = '"+UserName+"' AND POI_Name = '"+POI_Name+"' "
        DButilsAzure.execQuery(sql) 
        .then(function(result){
            res.sendStatus(200);
        }).catch(function(err){
            res.send(err);
        })
    }   
 });


module.exports = router;