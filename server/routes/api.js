
const express = require('express');
const app = express();
const router = express.Router();
const bodyParser = require('body-parser');
const mysql = require('mysql');
const bcrypt = require('bcrypt-nodejs');
const jwt = require('jsonwebtoken');
const config = require(__dirname + '/config.js');
const async = require('async');

const querystring = require("querystring");
const request = require("request");


// Use body parser to parse JSON body
router.use(bodyParser.json());
const connAttrs = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'voluculture_ngo_volunteer'
});


router.get('/', function (req, res) {
    res.sendfile('/')
});

// sign up


// login
router.post('/signin', function (req, res) {
    let user1 = {
        username: req.body.username,
        password: req.body.password
    }
    if (!user1) {
        return res.status(400).send({ error: true, message: 'Please provide login details' });
    }
    connAttrs.query('SELECT * FROM vusers where username=?', user1.username, function (error, result) {
       if (error || result < 1) {
            res.set('Content-Type', 'application/json');
            var status = error ? 500 : 404;
            res.status(status).send(JSON.stringify({
                status: status,
                message: error ? "Error getting the that username" : "Username you have entered is Incorrect. Kindly Try Again. or Contact systemadmin",
                detailed_message: error ? error.message : ""
            }));
            return(error);
        } 

       else{
        user = result[0];

        bcrypt.compare(req.body.password, user.password, function (error, pwMatch) {
            var payload;
            if (error) {
                return (error);
            }
            if (!pwMatch) {
                res.status(401).send({ message: 'Wrong Password. please Try Again .' });
                return;
            }
            payload = {                
                sub: user.username
            };
            var userREsponse = {
                username: user.username,
                activeProfile: user.user_profile_yn,
                userType: user.utype
            }
            res.status(200).json({
                 user: userREsponse,                 
                token: jwt.sign(payload, config.jwtSecretKey, { expiresIn: 60 * 60 * 24 }) //EXPIRES IN ONE DAY,
            });
        });      
       }    
    })
    console.log("=========================================Post:/signin Released========================= for:", user1.username)
});


// decording and verifying the jwt token

router.post('/me', function (req, res) {
    var token = req.body.token1;
    if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });

    jwt.verify(token, config.jwtSecretKey, function (err, decoded) {
        if (err){
            return res.status(500).send({ auth: false, message: 'Sorry Your Token is not genuine. Failed to authenticate token.' });
        }
        res.status(200).send(decoded);
        console.log('sub', decoded.sub)
    });
});

// getting the ngos details
router.post('/myNgodetails', function(req, res){
// checking the validity of the users token
var token = req.body.token;
    if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });

    jwt.verify(token, config.jwtSecretKey, function (err, decoded) {
        if (err){
            return res.status(500).send({ auth: false, message: 'Sorry Your Token is not genuine. Failed to authenticate token.' });
        }
        else{
            //res.status(200).send(decoded);
            console.log('sub', decoded.sub)
            // executing you query
            connAttrs.query('select * from vuserprofile where username=?', decoded.sub, function(error, result){
                if (error || result < 1) {
                    res.set('Content-Type', 'application/json');
                    var status = 404;
                    res.status(status).send(JSON.stringify({
                        status: status,
                        message:"Sorry Dear customer, We could no find you Profile data please consinder setting up your profile First",
                        detailed_message: "Please contact the system admin through: +254712817673"
                    }));
                    return(error);
                }                
                res.contentType('application/json').status(200).send(JSON.stringify(result));
            })
        }
    });
})


// posting new profiles details 
router.post('/newProfile', function (req, res) {

    var token = req.body.token;
    if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });

    jwt.verify(token, config.jwtSecretKey, function (err, decoded) {
        if (err){
            return res.status(500).send({ auth: false, message: 'Sorry Your Token is not genuine. Failed to authenticate token.' });
        }
        else{   
            console.log('sub', decoded.sub)
    let userprofile = {
        username: decoded.sub,
        email: req.body.email,
        description: req.body.description,
        url: req.body.url,
        fyear: req.body.fyear,
        location: req.body.location,
        phone: req.body.phone,
        address: req.body.address,
        mvision: req.body.mvision,
        we_are: req.body.we_are,
        we_do: req.body.we_do,
        org_name: req.body.org_name

    }

    if (!userprofile) {
        return res.status(400).send({ error: true, message: 'Please provide details to send' });
    }

    // checking if that account exist

   connAttrs.query('SELECT * FROM vuserprofile where username=?', userprofile.username, function (error, result) {
    if (error || result.length > 0) {
         res.set('Content-Type', 'application/json');
         var status = error ? 500 : 404;
         res.status(status).send(JSON.stringify({
             status: status,
             message: error ? "Error getting the server" : "A simmilar Account already exist",
             detailed_message: error ? error.message : ""
         }));
        //  console.log(`=====================${message}===================================`);
         return(error);
     }

    

    connAttrs.query("INSERT INTO vuserprofile SET ? ", userprofile, function (error, results) {
        if (error) {
            res.set('Content-Type', 'application/json');
            res.status(500).send(JSON.stringify({
                status: 500,
                message: "Error Posting your profile",
                detailed_message: error.message

            }));

        }
        else {
            return res.contentType('application/json').status(201).send(JSON.stringify(results));
        }

    })})
}})});


// register
router.post('/register',  function post(req, res, next) {   // 
    var user = {
        username: req.body.username         
    };
     var unhashedPassword = req.body.password ;
    bcrypt.genSalt(10, function(err, salt) {
      if (err) {
           return next(err);
        }
       // console.log(password);
       bcrypt.hash(unhashedPassword, salt, null,function(err, hash) {
        if (err) {
            return next(err);
         }
        // console.log(hash);
           user.hashedPassword = hash;

   connAttrs.query('SELECT * FROM vusers where username=?', user.username, function (error, result) {
    if (error || result.length > 0) {
         res.set('Content-Type', 'application/json');
         var status = error ? 500 : 404;
         res.status(status).send(JSON.stringify({
             status: status,
             message: error ? "Error getting the server" : "Username you have entered is already taken",
             detailed_message: error ? error.message : ""
         }));
        //  console.log(`=====================${message}===================================`);
         return(error);
     }
   

     connAttrs.query("INSERT INTO vusers SET ? ", {
        username: user.username,
        password: user.hashedPassword,
        utype: 'NGO',
        user_profile_yn: 'N'
    }, function (error, results) {
        if (error) {
            res.set('Content-Type', 'application/json');
            res.status(500).send(JSON.stringify({
                status: 500,
                message: "Error Posting your details",
                detailed_message: error.message   
            }));
        }
        else {
            return res.contentType('application/json').status(201).send(JSON.stringify(results));
        }})  
})})
})});


module.exports = router;
