const express           = require( 'express' );
const app               = express();
const auth              = require( './routes/auth' );
const email              = require( './routes/email' );

app.use( auth );
app.use( email );

module.exports = app;
