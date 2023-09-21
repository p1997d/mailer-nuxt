const express       = require( 'express' );
const bodyParser    = require( 'body-parser' );
const jwt           = require( 'jsonwebtoken' );
const argon2        = require( 'argon2' );
const privateKey    = process.env.privateKey;
const router        = express.Router();
const mongo         = require( '../modules/mongodb' );

var jsonParser = bodyParser.json();


router.post( '/auth/login',  jsonParser, async ( req, res ) => { 
    mongo.connect( function ( err, mongo ) {
        const db = mongo.db( 'mailer' );
        const collection = db.collection( 'users' );	
        if ( err ) return console.log( err );			  
        collection.find( { username: req.body.username } ).toArray( async function ( err, results ) {
            if ( results != undefined ) {
                if ( results[0] != undefined ) {
                    let hash = results[0].hash;
                    if ( await argon2.verify( hash, req.body.password ) ) {
                        jwt.sign({ username: req.body.username, id: results[0].id }, privateKey, function( err, token ) {
                            res.json( { token: token, user: { username: req.body.username, id: results[0].id }, status: true } );
                        });   
                    }
                    else {
                        res.json({ message: 'Неверный логин или пароль', status: false });
                    };
                }
                else {
                    res.json({ message: 'Неверный логин или пароль', status: false })
                };
            };
            mongo.close();
        });
    });
});

router.get('/auth/user', async ( req, res ) => {
    let token = req.headers.authorization.split(' ')[1];
    jwt.verify( token, privateKey, function( err, decoded ) {
        res.json( { user: { username: decoded.username, id: decoded.id }} );
    });
});

router.post('/auth/logout', async ( req, res ) => {
    res.json({ status: 'OK' });
});

router.post('/auth/registration',  jsonParser, async ( req, res ) => {
    mongo.connect(function ( err, mongo ) {
        const db = mongo.db( 'mailer' );
        const collection = db.collection( 'users' );    
        if ( err ) return console.log( err );
        collection.find( { username: req.body.username } ).toArray( async function ( err, results ) {
            if ( results != undefined ) {
                if ( results[0] != undefined ) {
                    res.json({ message: 'К сожалению, логин занят', status: false });
                }
                else {
                    let userID = `user-${Date.now()}`;
                    const hash = await argon2.hash( req.body.password );
                    let personDocument = {
                        "id": userID,
                        "username": req.body.username,
                        "hash": hash,
                    };
                    collection.insertOne( personDocument, function ( err, result ) {				
                        mongo.close();
                        res.json({ status: true });
                    });
                };
            };
        });
    });
});

module.exports = router;