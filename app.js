var express  = require('express');
var app      = express();
var port     = process.env.OPENSHIFT_NODEJS_PORT;
var bodyParser = require('body-parser');
var passport = require('passport');
var flash    = require('connect-flash');
var path = require('path'),
    fs = require('fs');
 var http = require('http')
var server = http.createServer(app)

require('./config/passport')(passport); 

app.configure(function() {

	app.use(express.cookieParser());
	app.use(express.bodyParser());
	app.use(bodyParser.json()); // for parsing application/json
	app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
	app.use(express.static(path.join(__dirname, 'public')));
	app.set('views', __dirname + '/views');
	app.engine('html', require('ejs').renderFile);
	app.use(express.session({ secret: 'knoldus' })); 
	app.use(express.bodyParser({uploadDir:'/images'}));
	app.use(passport.initialize());
	app.use(passport.session()); 
	app.use(flash()); 

});


require('./app/routes.js')(app, passport,server); 
var ipaddress = process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1";
var port = process.env.OPENSHIFT_NODEJS_PORT || 8080;

server.listen(port, ipaddress);
//server.listen(port);
console.log('Listening  to  port ' + port);


