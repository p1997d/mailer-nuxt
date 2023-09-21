var imaps           = require( 'imap-simple' );
const nodemailer    = require( 'nodemailer' );
const { Router }    = require( 'express' );
const router        = Router();
const mongo         = require( '../modules/mongodb' );
const axios         = require( 'axios' );
const jwt           = require( 'jsonwebtoken' );
const privateKey    = process.env.privateKey;
const bodyParser    = require( 'body-parser' );
var jsonParser      = bodyParser.json();

var name = null;
var email = null;
var display_name = null;
var avatar = null;
var b64Token = null;

router.use( '/oauthyandex', ( req, res ) => {
    let token = req.headers.cookie.split( '; ' ).find( el => el.startsWith( 'auth._token.local=Bearer%20' )).replace( 'auth._token.local=Bearer%20', '' ); 
    jwt.verify( token, privateKey, function( err, decoded ) {
        mongo.connect( function ( err, mongo ) {
            const db = mongo.db( 'mailer' );
            const collection = db.collection( 'users' );
            
            if ( err ) return console.log( err );
            axios.get( `https://login.yandex.ru/info?format=json&oauth_token=${res.req.query.access_token}` )
            .then( function( response ) {
                name = response.data.real_name;
                email = response.data.default_email;
                display_name = response.data.display_name;
                avatar = response.data.default_avatar_id;
                b64Token = Buffer.from( "user=" + email + "\001auth=Bearer " + res.req.query.access_token + "\001\001" ).toString( 'base64' );
            
                collection.find( { username: decoded.username } ).toArray( async function ( err, results ) {
                    if ( results.yandex == undefined ) {
                        await collection.updateOne (
                            { username: decoded.username },
                            { $set: { 
                                yandex: { email: email, access_token: res.req.query.access_token }
                            }}
                        );
                    }
                    else {
                        b64Token = Buffer.from( "user=" + results.yandex.email + "\001auth=Bearer " + results.yandex.access_token + "\001\001" ).toString( 'base64' );
                    };
                    await mongo.close();
                });
            })
            .catch( function( error ) {
                console.log( error );
            });
        }); 
    });
});

router.use( '/list', ( req, res ) => {
    mongo.connect( function ( err, mongo ) {
        const db = mongo.db( 'mailer' );
        const collection = db.collection( 'users' );
        let token = req.headers.cookie.split( '; ' ).find( el => el.startsWith( 'auth._token.local=Bearer%20' )).replace( 'auth._token.local=Bearer%20', '' ); 
        jwt.verify( token, privateKey, function( err, decoded ) {
            collection.find( { username: decoded.username } ).toArray( async function ( err, results ) {                
                if ( results != undefined ) {
                    if ( results[0].yandex != undefined ) {
                        b64Token = Buffer.from( "user=" + results[0].yandex.email + "\001auth=Bearer " + results[0].yandex.access_token + "\001\001" ).toString( 'base64' );
                        var config = {
                            imap: {
                                xoauth2: b64Token,
                                host: 'imap.yandex.ru',
                                port: 993,
                                tls: true,
                                authTimeout: 3000
                            }
                        };
                        imaps.connect( config ).then( function ( connection ) {	
                            return connection.openBox( 'INBOX' ).then( function ( inbox ) {				
                                var searchCriteria = [`${inbox.messages.total - 29 * res.req.query.page}:${inbox.messages.total}`];	
                        
                                var fetchOptions = {
                                    bodies: [ 'HEADER', 'TEXT' ],
                                    markSeen: false, 
                                    struct: true
                                };
                        
                                var uid = [];
                                var date = [];
                                var from = [];
                                var text = [];
                                var seen = [];
                        
                                return connection.search( searchCriteria, fetchOptions ).then( function ( results ) {
                                    var subjects = results.map( function ( message ) {
                                        uid.push( message.attributes.uid );
                                        date.push( message.attributes.date );
                                        from.push( message.parts.filter( function ( part ) { return part.which === 'HEADER'; } )[0].body.from );
                                        text.push( message.parts.filter( function ( part ) { return part.which === 'TEXT'; } )[0].body);
                                        seen.push( message.attributes.flags.indexOf( '\\Seen' ) != -1 );
                                        if ( message.parts.filter( function ( part ) { return part.which === 'HEADER'; })[0].body.subject == undefined ) {
                                            return "(Без темы)";
                                        }
                                        else {
                                            return message.parts.filter( function ( part ) { return part.which === 'HEADER'; })[0].body.subject[0];
                                        }
                        
                                    });
                                    res.json( { subjects: subjects, uid: uid, date: date, from: from, text: text, seen: seen, status: "ok" } );
                                });
                            });
                        }).catch( err => {
                            if ( err.toString().indexOf( 'Error: AUTHENTICATE invalid credentials or IMAP is disabled' ) != -1 ) {
                                res.json( { status: "IMAPdisabled" } )
                            }
                        });	    
                    }
                    else {
                        res.json( { status: "notAuth" } );
                    }
                }
                await mongo.close();
            });
        });
    });
});

router.post( '/seen', jsonParser, ( req, res ) => {
    mongo.connect( function ( err, mongo ) {
        const db = mongo.db( 'mailer' );
        const collection = db.collection( 'users' );
        let token = req.headers.cookie.split( '; ' ).find( el => el.startsWith( 'auth._token.local=Bearer%20' )).replace( 'auth._token.local=Bearer%20', '' ); 
        jwt.verify( token, privateKey, function( err, decoded ) {
            collection.find( { username: decoded.username } ).toArray( async function ( err, results ) {
                if ( results != undefined ) {
                    if ( results[0].yandex != undefined ) {
                        b64Token = Buffer.from( "user=" + results[0].yandex.email + "\001auth=Bearer " + results[0].yandex.access_token + "\001\001" ).toString( 'base64' );
                        var config = {
                            imap: {
                                xoauth2: b64Token,
                                host: 'imap.yandex.ru',
                                port: 993,
                                tls: true,
                                authTimeout: 3000
                            }
                        };
                        imaps.connect( config ).then( function ( connection ) {
                            connection.openBox( 'INBOX' ).then( function () {                    
                                var searchCriteria = [ [ "UID", req.body.uids ] ];
                                var fetchOptions = { bodies: [ 'TEXT' ], struct: true, markSeen: true };
                                return connection.search(searchCriteria, fetchOptions);                    
                            }).then( function ( messages ) {
                                let taskList = messages.map( function ( message ) {
                                    return new Promise( ( resolve, reject ) => {
                                        var parts = imaps.getParts( message.attributes.struct );
                                        parts.map( function ( part ) {
                                            return connection.getPartData( message, part )
                                            .then( function () {
                                                req.body.uids.forEach( uid => {
                                                    connection.addFlags( uid, "\Seen", ( err ) => {
                                                        if ( err ) {
                                                            reject( err );
                                                        }
                                                        resolve();
                                                    });
                                                });
                                                res.json( { status: "ok", page: req.body.page } );
                                            });
                                        });
                                    });
                                });
                        
                                return Promise.all( taskList ).then( () => {
                                    connection.imap.closeBox( true, ( err ) => {
                                        if ( err ){
                                            console.log( err );
                                        };
                                    });
                                    connection.end();
                                });
                            });
                        });
                    }
                    else {
                        res.json( { status: "notAuth" } );
                    }
                }
                await mongo.close();
            });
        });
    });
});

router.post( '/delete', jsonParser, ( req, res ) => {
    mongo.connect( function ( err, mongo ) {
        const db = mongo.db( 'mailer' );
        const collection = db.collection( 'users' );
        let token = req.headers.cookie.split( '; ' ).find( el => el.startsWith( 'auth._token.local=Bearer%20' )).replace( 'auth._token.local=Bearer%20', '' ); 
        jwt.verify( token, privateKey, function( err, decoded ) {
            collection.find( { username: decoded.username } ).toArray( async function ( err, results ) {
                if ( results != undefined ) {
                    if ( results[0].yandex != undefined ) {
                        b64Token = Buffer.from( "user=" + results[0].yandex.email + "\001auth=Bearer " + results[0].yandex.access_token + "\001\001" ).toString( 'base64' );
                        var config = {
                            imap: {
                                xoauth2: b64Token,
                                host: 'imap.yandex.ru',
                                port: 993,
                                tls: true,
                                authTimeout: 3000
                            }
                        };
                        imaps.connect( config ).then( function ( connection ) {
                            connection.openBox( 'INBOX' ).then( function () {                    
                                var searchCriteria = [ [ "UID", req.body.uids ] ];
                                var fetchOptions = { bodies: [ 'TEXT' ], struct: true };
                                return connection.search( searchCriteria, fetchOptions );            
                            }).then( function ( messages ) {
                                let taskList = messages.map( function ( message ) {
                                    return new Promise( ( resolve, reject ) => {
                                        var parts = imaps.getParts( message.attributes.struct );
                                        parts.map( function ( part ) {
                                            return connection.getPartData( message, part )
                                            .then( function () {
                                                req.body.uids.forEach( uid => {
                                                    connection.addFlags(uid, "\Deleted", ( err ) => {
                                                        if ( err ){
                                                            reject( err );
                                                        }
                                                        resolve();
                                                    });
                                                });
                                                res.json( { status: "ok", page: req.body.page } );
                                            });
                                        });
                                    });
                                });
                        
                                return Promise.all( taskList ).then( () => {
                                    connection.imap.closeBox( true, ( err ) => {
                                        if ( err ){
                                            console.log( err );
                                        }
                                    });
                                    connection.end();
                                });
                            });
                        });
                    }
                    else {
                        res.json( { status: "notAuth" } );
                    }
                }
                await mongo.close();
            });
        });
    });
});

router.use( '/userinfo', ( req, res ) => {
    mongo.connect( function ( err, mongo ) {
        const db = mongo.db( 'mailer' );
        const collection = db.collection( 'users' );
        let token = req.headers.cookie.split( '; ' ).find( el => el.startsWith( 'auth._token.local=Bearer%20' )).replace( 'auth._token.local=Bearer%20', '' ); 
        jwt.verify( token, privateKey, function( err, decoded ) {
            collection.find( { username: decoded.username } ).toArray( async function ( err, results ) {
                if ( results != undefined ) {
                    if ( results[0].yandex != undefined ) {
                        axios.get( `https://login.yandex.ru/info?format=json&oauth_token=${results[0].yandex.access_token}` )
                        .then( function( response ) {
                            res.json( response.data );
                        });
                    }
                    else {
                        res.json( { status: "notAuth" } );
                    }
                }
            });
        });
    });
});

router.get( '/open/:uid', ( req, res ) => {
    mongo.connect( function ( err, mongo ) {
        const db = mongo.db( 'mailer' );
        const collection = db.collection( 'users' );
        let token = req.headers.cookie.split( '; ' ).find( el => el.startsWith( 'auth._token.local=Bearer%20' )).replace( 'auth._token.local=Bearer%20', '' ); 
        jwt.verify( token, privateKey, function( err, decoded ) {
            collection.find( { username: decoded.username } ).toArray( async function ( err, results ) {
                if ( results != undefined ) {
                    if ( results[0].yandex != undefined ) {
                        b64Token = Buffer.from( "user=" + results[0].yandex.email + "\001auth=Bearer " + results[0].yandex.access_token + "\001\001" ).toString( 'base64' );
                        var config = {
                            imap: {
                                xoauth2: b64Token,
                                host: 'imap.yandex.ru',
                                port: 993,
                                tls: true,
                                authTimeout: 3000
                            }
                        };
                        imaps.connect( config ).then( function ( connection ) {
                            connection.openBox( 'INBOX' ).then( function () {                    
                                var searchCriteria = [ [ "UID", req.params.uid ] ];
                                var fetchOptions = { bodies: [ 'HEADER', 'TEXT' ], struct: true, markSeen: true };
                                return connection.search(searchCriteria, fetchOptions);            
                            }).then( function ( messages ) {
                                messages.map( function ( message ) {					
                                    return new Promise( ( resolve, reject ) => {
                                        var subtype = [];
                                        var from = [];
                                        var subject = [];
                                        var parts = imaps.getParts( message.attributes.struct );
                                        
                                        parts.map( function ( part ) {
                                            if( part.encoding == "7bit" ) { part.encoding = "8bit" };
                                            
                                            from.push( message.parts.filter( function ( part ) { return part.which === 'HEADER'; } )[0].body.from );
                                            subject.push( message.parts.filter( function ( part ) { return part.which === 'HEADER'; } )[0].body.subject );
                                            return connection.getPartData( message, part )
                                            .then( function ( partData ) {								
                                                subtype.push( part.subtype );
                                                if ( part.encoding != "base64" ) {
                                                    res.json( { "mail": partData, subtype: subtype, from: from, subject: subject } );
                                                }
                                                else {
                                                    res.json( { "mail": Buffer.from ( partData, "base64" ).toString( 'utf-8' ), subtype: subtype, from: from, subject: subject } );
                                                };
                                            });
                                        });
                                    });
                                });
                            });
                        }).catch( err => {
                            if ( err.toString().indexOf( 'Error: AUTHENTICATE invalid credentials or IMAP is disabled' ) != -1 ) {
                                res.json( { status: "IMAPdisabled" } );
                            };
                        });	    
                    }
                    else {
                        res.json( { status: "notAuth" } );
                    }
                }
                await mongo.close();
            });
        });
    });
});

router.post( '/send', jsonParser, ( req, res ) => {
    mongo.connect( function ( err, mongo ) {
        const db = mongo.db( 'mailer' );
        const collection = db.collection( 'users' );
        let token = req.headers.cookie.split( '; ' ).find( el => el.startsWith( 'auth._token.local=Bearer%20' )).replace( 'auth._token.local=Bearer%20', '' ); 
        jwt.verify( token, privateKey, function( err, decoded ) {
            collection.find( { username: decoded.username } ).toArray( async function ( err, results ) {
                if ( results != undefined ) {
                    if ( results[0].yandex != undefined ) {
                        axios.get( `https://login.yandex.ru/info?format=json&oauth_token=${results[0].yandex.access_token}` )
                        .then( function( response ) {
                            async function main() {
                                let transporter = nodemailer.createTransport( {
                                    host: "smtp.yandex.ru",
                                    port: 465,
                                    secure: true,
                                    auth: {
                                        type: 'OAuth2',
                                        user: results[0].yandex.email,
                                        accessToken: results[0].yandex.access_token
                                    },
                                });

                                let info = await transporter.sendMail({
                                    from: `${response.data.real_name} <${response.data.default_email}>`,
                                    to: req.body.to,
                                    subject: req.body.subject,
                                    text: req.body.text,
                                    html: req.body.html,
                                });
                                res.json( { status: "sendSuccess" } );
                            };      
                            main().catch( console.error ); 
                        });                   
                    }
                    else {
                        res.json( { status: "notAuth" } );
                    }
                }
            });
        });
    });
});

module.exports = router;