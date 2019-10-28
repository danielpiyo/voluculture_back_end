
const express = require('express');
const app = express();
const router = express.Router();
const bodyParser = require('body-parser');
const mysql = require('mysql');
const bcrypt = require('bcrypt-nodejs');
const jwt = require('jsonwebtoken');
const config = require(__dirname + '/config.js');

// Use body parser to parse JSON body
router.use(bodyParser.json());
const connAttrs = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'volu_plus'
});

router.get('/', function (req, res) {
    res.sendfile('/')
});

// login
router.post('/signin', function (req, res) {

    let user1 = {
        username: req.body.username,
        password: req.body.password
    }
    if (!user1) {
        return res.status(400).send({ error: true, message: 'Please provide login details' });
    }
    connAttrs.query('SELECT * FROM V_ENTITIES where USERNAME=?', user1.username, function (error, result) {
        if (error || result < 1) {
            res.set('Content-Type', 'application/json');
            var status = error ? 500 : 404;
            res.status(status).send(JSON.stringify({
                status: status,
                message: error ? "Error getting the that username" : "Username you have entered is Incorrect. Kindly Try Again. or Contact systemadmin",
                detailed_message: error ? error.message : ""
            }));
            return (error);
        }

        else {
            user = result[0];


            bcrypt.compare(req.body.password, user.PASSWRD, function (error, pwMatch) {
                var payload;
                if (error) {
                    return (error);
                }
                if (!pwMatch) {
                    res.status(401).send({ message: 'Wrong Password. please Try Again .' });
                    return;
                }
                payload = { sub: user.USERNAME };

                res.status(200).json({
                    user: user,
                    token: jwt.sign(payload, config.jwtSecretKey, { expiresIn: 60 * 60 * 24 }) //EXPIRES IN ONE DAY,
                });
            });
        }

    });
    //  connAttrs.end();

});


// decording and verifying the jwt token

router.post('/me', function (req, res) {
    var token = req.body.token1;
    if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });

    jwt.verify(token, config.jwtSecretKey, function (err, decoded) {
        if (err) {
            return res.status(500).send({ auth: false, message: 'Sorry Your Token is not genuine. Failed to authenticate token.' });
        }
        res.status(200).send(decoded);
        console.log('sub', decoded.sub)
    });
});

// getting the ngos details
router.post('/myProfiledetails', function (req, res) {
    // checking the validity of the users token
    var token = req.body.token;
    if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });

    jwt.verify(token, config.jwtSecretKey, function (err, decoded) {
        if (err) {
            return res.status(500).send({ auth: false, message: 'Sorry Your Token is not genuine. Failed to authenticate token.' });
        }
        else {
            //res.status(200).send(decoded);
            console.log('sub', decoded.sub)
            // executing you query
            connAttrs.query('select * from V_ENTITIES where username=?', decoded.sub, function (error, result) {
                if (error || result < 1) {
                    res.set('Content-Type', 'application/json');
                    var status = 404;
                    res.status(status).send(JSON.stringify({
                        status: status,
                        message: "Sorry Dear customer, We could no find you Profile data please consinder setting up your profile First",
                        detailed_message: "Please contact the system admin through: +254712817673"
                    }));
                    return (error);
                }
                res.contentType('application/json').status(200).send(JSON.stringify(result));
            })
        }
    });
})


// selecting categories in the system
router.get('/category', function (req, res) {

    var sql = `SELECT * FROM CATEGORIES ORDER BY CAT_ID DESC`;
    connAttrs.query(sql, function (error, results) {
        if (error || results.length < 1) {
            res.set('Content-Type', 'application/json');
            var status = error ? 500 : 404;
            res.status(status).send(JSON.stringify({
                status: status,
                message: error ? "Error getting the server" : "No categories in the Db",
                detailed_message: error ? error.message : ""
            }));

            return (error);
        }
        res.contentType('application/json').status(200).send(JSON.stringify(results));
        // connAttrs.destroy();
    })

});


// register
router.post('/register', function post(req, res, next) {   // 
    var user = {
        username: req.body.username,
        email: req.body.email,
        entity_category: req.body.category,
        surname: req.body.surname
    };
    var unhashedPassword = req.body.password;
    bcrypt.genSalt(10, function (err, salt) {
        if (err) {
            return next(err);
        }
        // console.log(password);
        bcrypt.hash(unhashedPassword, salt, null, function (err, hash) {
            if (err) {
                return next(err);
            }
            // console.log(hash);
            user.hashedPassword = hash;

            connAttrs.query('SELECT * FROM V_ENTITIES where username=?', user.username, function (error, result) {
                if (error || result.length > 0) {
                    res.set('Content-Type', 'application/json');
                    var status = error ? 500 : 404;
                    res.status(status).send(JSON.stringify({
                        status: status,
                        message: error ? "Error getting the server" : "Username you have entered is already taken",
                        detailed_message: error ? error.message : ""
                    }));
                    //  console.log(`=====================${message}===================================`);
                    return (error);
                }


                connAttrs.query("INSERT INTO V_ENTITIES SET ? ", {
                    ENTITY_CATEGORY: user.entity_category,
                    SURNAME: user.surname,
                    EMAIL: user.email,
                    USERNAME: user.username,
                    PASSWRD: user.hashedPassword,
                    REGISTRATION_DATE: new Date(),
                    CREATED_BY: user.username,
                    CREATED_DATE: new Date(),
                    FROZEN: 'N',
                    ACTIVE_YN: 'N',
                    PROFILE_SET_YN: 'N'
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
                    }
                })
            })
        })
    })
});

// volunteer profile update
router.post('/updateProfileVol', function (req, res) {
    var token = req.body.token;
    if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });

    jwt.verify(token, config.jwtSecretKey, function (err, decoded) {
        if (err) {
            return res.status(500).send({ auth: false, message: 'Sorry Your Token is not genuine. Failed to authenticate token.' });
        }
        else {
            console.log('sub', decoded.sub)
            let userprofileUpdate = {
                ORG_NAME: req.body.org_name,
                INTREST: req.body.intrest,
                FOUNDED_YEAR: req.body.fyear,
                TOWN: req.body.town,
                COUNTRY: req.body.country,
                ADDRESS: req.body.address,
                CAPTURED_LOCATION: req.body.location,
                MOBILE_NUMBER: req.body.phone,
                PICTURE: req.body.picture,
                BRIEF_NARRATION: req.body.description,
                MODIFIED_BY: decoded.sub
                // VISSION ,
                // MISSION,
                // WE_DO ,
                // WE_ARE
            }

            if (!userprofileUpdate) {
                return res.status(400).send({ error: true, message: 'Please provide details to send' });
            }
            let sql = `UPDATE V_ENTITIES
                    set
                        ORG_NAME = ?, 
                        INTREST =?,    
                        FOUNDED_YEAR =?, 
                        TOWN =?, 
                        COUNTRY =?, 
                        ADDRESS =?,
                        CAPTURED_LOCATION =?, 
                        MOBILE_NUMBER = ?, 	 
                        PICTURE =?, 
                        BRIEF_NARRATION =?,   
                        MODIFIED_BY =?, 
                        MODIFIED_DATE =?,
                        FROZEN =?,
                        PROFILE_SET_YN =?
                where username =?`

            connAttrs.query(sql, [
                userprofileUpdate.ORG_NAME,
                userprofileUpdate.INTREST,
                userprofileUpdate.FOUNDED_YEAR,
                userprofileUpdate.TOWN,
                userprofileUpdate.COUNTRY,
                userprofileUpdate.ADDRESS,
                userprofileUpdate.CAPTURED_LOCATION,
                userprofileUpdate.MOBILE_NUMBER,
                userprofileUpdate.PICTURE,
                userprofileUpdate.BRIEF_NARRATION,
                userprofileUpdate.MODIFIED_BY,
                new Date(),
                'N',
                'Y',
                userprofileUpdate.USERNAME
            ]
                , function (error, results) {
                    if (error) {
                        res.set('Content-Type', 'application/json');
                        res.status(500).send(JSON.stringify({
                            status: 500,
                            message: "Error Updating your details",
                            detailed_message: error.message
                        }));
                    }
                    else {
                        return res.contentType('application/json').status(201).send(JSON.stringify(results));
                    }
                })

            console.log("=========================================Post:/update Released=========================")

        }
    })
})

// ngo profile update

// volunteer profile update
router.post('/updateProfileNgo', function (req, res) {
    var token = req.body.token;
    if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });

    jwt.verify(token, config.jwtSecretKey, function (err, decoded) {
        if (err) {
            return res.status(500).send({ auth: false, message: 'Sorry Your Token is not genuine. Failed to authenticate token.' });
        }
        else {
            console.log('sub', decoded.sub)
            let userprofileUpdate = {
                ORG_NAME: req.body.org_name,
                // INTREST: req.body.intrest,
                FOUNDED_YEAR: req.body.fyear,
                TOWN: req.body.town,
                COUNTRY: req.body.country,
                ADDRESS: req.body.address,
                CAPTURED_LOCATION: req.body.location,
                MOBILE_NUMBER: req.body.phone,
                //PICTURE: req.body.picture,
                BRIEF_NARRATION: req.body.description,
                VISSION: req.body.vission,
                MISSION: req.body.mission,
                WE_DO: req.body.we_do,
                WE_ARE: req.body.we_are,
                MODIFIED_BY: decoded.sub
            }

            if (!userprofileUpdate) {
                return res.status(400).send({ error: true, message: 'Please provide details to send' });
            }
            let sql = `UPDATE V_ENTITIES
                    set
                        ORG_NAME = ?,                           
                        FOUNDED_YEAR =?, 
                        TOWN =?, 
                        COUNTRY =?, 
                        ADDRESS =?,
                        CAPTURED_LOCATION =?, 
                        MOBILE_NUMBER = ?,
                        BRIEF_NARRATION =?, 
                        VISSION = ?,
                        MISSION =?,
                        WE_DO =?,  
                        WE_ARE =?,
                        MODIFIED_BY =?, 
                        MODIFIED_DATE =?,
                        FROZEN =?,
                        PROFILE_SET_YN =?
                where username =?`

            connAttrs.query(sql, [
                userprofileUpdate.ORG_NAME,
                userprofileUpdate.FOUNDED_YEAR,
                userprofileUpdate.TOWN,
                userprofileUpdate.COUNTRY,
                userprofileUpdate.ADDRESS,
                userprofileUpdate.CAPTURED_LOCATION,
                userprofileUpdate.MOBILE_NUMBER,
                userprofileUpdate.BRIEF_NARRATION,
                userprofileUpdate.VISSION,
                userprofileUpdate.MISSION,
                userprofileUpdate.WE_DO,
                userprofileUpdate.WE_ARE,
                userprofileUpdate.MODIFIED_BY,
                new Date(),
                'N',
                'Y',
                decoded.sub
            ]
                , function (error, results) {
                    if (error) {
                        res.set('Content-Type', 'application/json');
                        res.status(500).send(JSON.stringify({
                            status: 500,
                            message: "Error Updating your details",
                            detailed_message: error.message
                        }));
                    }
                    else {
                        return res.contentType('application/json').status(201).send(JSON.stringify(results));
                    }
                })

            console.log("=========================================Post:/update Released=========================")

        }
    })
});

router.post('/createOpp', function (req, res) {
    var token = req.body.token;
    if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });

    jwt.verify(token, config.jwtSecretKey, function (err, decoded) {
        if (err) {
            return res.status(500).send({ auth: false, message: 'Sorry Your Token is not genuine. Failed to authenticate token.' });
        } 
        console.log(decoded.sub);
            connAttrs.query("INSERT INTO OPPORTUNITIES SET ? ",{
                            ENTITY_SYS_ID: req.body.entity_sys_id,
                            OPP_NAME: req.body.opp_name,
                            OPP_DESCRIPTION: req.body.opp_description,                            
                            OPP_LOCATION : req.body.opp_location,
                            OPP_SKILLS: req.body.opp_skills,
                            OPP_START: req.body.opp_start,
                            OPP_DURATION : req.body.opp_duration,
                            CREATED_BY:decoded.sub,
                            CREATED_DATE: new Date(),                           
                            FROZEN: 'N',
                            ACTIVE_YN: 'Y'

            }, function(error, result){
                if(error){
                    res.set('Content-Type', 'application/json');
                    res.status(500).send(JSON.stringify({
                        status: 500,
                        message: "Error Posting your details",
                        detailed_message: error.message
                    }));
                }
                else{
                    return res.contentType('application/json').status(201).send(JSON.stringify(result));
                }
            })
        
    })
})

// posting activities

router.post('/createActivity', function (req, res) {
    var token = req.body.token;
    if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });

    jwt.verify(token, config.jwtSecretKey, function (err, decoded) {
        if (err) {
            return res.status(500).send({ auth: false, message: 'Sorry Your Token is not genuine. Failed to authenticate token.' });
        } 
        console.log(decoded.sub);
            connAttrs.query("INSERT INTO ACTIVITIES SET ? ",{
                            ENTITY_SYS_ID: req.body.entity_sys_id,
                            ACT_NAME: req.body.act_name,
                            ACT_DESCRIPTION: req.body.act_description,                            
                            ACT_LOCATION : req.body.act_location,                           
                            ACT_START: req.body.act_start,
                            ACT_DURATION : req.body.act_duration,
                            ACT_START_TIME: req.body.act_start_time ,
                            ACT_END_TIME: req.body.act_end_time,
                            CREATED_BY:decoded.sub,
                            CREATED_DATE: new Date(),                           
                            FROZEN: 'N',
                            ACTIVE_YN: 'Y'

            }, function(error, result){
                if(error){
                    res.set('Content-Type', 'application/json');
                    res.status(500).send(JSON.stringify({
                        status: 500,
                        message: "Error Posting your details",
                        detailed_message: error.message
                    }));
                }
                else{
                    return res.contentType('application/json').status(201).send(JSON.stringify(result));
                }
            })
        
    })
})
module.exports = router;
