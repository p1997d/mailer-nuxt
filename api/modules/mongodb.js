const { MongoClient } = require( 'mongodb' ),
    url			      = `mongodb+srv://${process.env.MONGODB_LOGIN}:${process.env.MONGODB_PASSWORD}@cluster0.otn7h.mongodb.net/mailer?retryWrites=true&w=majority`,
    client		      = new MongoClient( url );

module.exports = client;