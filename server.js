// En Auth server designad efter https://www.codementor.io/mayowa.a/how-to-build-a-simple-session-based-authentication-system-with-nodejs-from-scratch-6vn67mcy3

var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var morgan = require('morgan');
var express = require('express');
var methodOverride = require('method-override');
var User = require('./models/user');
var dirname = require('./dirname');

//invoke an instance of express application
var app = express();
var sessionStore = new session.MemoryStore();



//set our aplication port
app.set('port', 9000);

app.use(methodOverride());

//set morgan to log on of about our requests for development use.
app.use(morgan('dev'));

//initialize body-parser to parse incoming parameters requests to req.body
app.use(bodyParser.urlencoded({extended: true}));

//initialize cookie-parser to allow us access the cookies stored in the browser.
var myCookieParser = cookieParser();
app.use(myCookieParser);

// initialize static files to serve to front-end
app.use('/static',express.static(dirname+'/build/static'));

// Start a http server based in app and attach it to an io object
var server = http.Server(app)
,	io = require('socket.io')(server);

// create sessionSockets which we will use to parse cookies
var SessionSockets = require('session.socket.io')
,	sessionSockets = new SessionSockets(io, sessionStore, myCookieParser);


//initialize express-session to allow us track the logged-in user across sessions.
app.use(session({
	key: 'user_sid',
	secret: 'somerandomstuff',
	resave: false,
	saveUninitialized: false,
	store: sessionStore,
	cookie: {
		expires: 600000
	}
}));

// initialize guest count
let guests = {
	current: 0,
	total: 0
	};

// Set the socket handshake to ask for user_sid
io.set('authorization', function (data, accept){
	if (!data.headers.cookie.includes("user_sid")) {
		return accept('No cookie transmitted.', false);
	}
	accept(null,true);
});


// Set up for conneting to the socket
sessionSockets.on('connection', function (err, socket, session) {
	socket.emit('update', guests)
	

	socket.on('add', function (add){
		guests.current = guests.current + 1
		guests.total = guests.total + 1
		console.log('Guests/Total: ' + guests.current +'/' + guests.total)
		io.emit('update', guests)
	})

	socket.on('remove', function (remove){
		if(guests.current){
			guests.current = guests.current - 1
			console.log('Guests/Total: ' + guests.current +'/' + guests.total)
			io.emit('update', guests)
		}
	}) 
})

/* This middleware will check if user's cookie is still saved in browser and if the
 user is not set, then automatically log the user out.
 This usually happens when you stop your express server after login, your cookie still remains saved in the browser. */
 app.use((req, res, next) => {
 	if (req.cookies.user_sid && !req.session.user){
 		res.clearCookie('user_sid');
 	}
 	next();
 });

 // middleware function to check for logged-in users
 var sessionChecker = (req, res, next) =>{
 	if (req.session.user && req.cookies.user_sid) {
 		res.redirect('/dashboard');
 	} else {
 		next();
 	}
 };

 // route for Home-Page
 app.route("/")
 	.get( sessionChecker, (req,res) => {
 		res.redirect('/login');
	 });

 // route for signup
 app.route('/signup')
 	.get(sessionChecker, (req, res) =>{
 		res.sendFile(dirname + '/public/signup.html');
 	})
 	.post((req, res) => {
 		User.create({
 			username: req.body.username,
 			email: req.body.email,
 			password: req.body.password
 		})
 		.then(user => {
 			req.session.user = user.dataValues;
 			res.redirect('/dashboard');
 		})
 		.catch(error => {
 			res.redirect('/signup');
 		});
 	});

// route for user Login
app.route('/login')
.get(sessionChecker, (req,res) => {
	res.sendFile(dirname+'/public/login.html');
})
.post((req, res) => {
	var username = req.body.username,
		password = req.body.password;
	console.log(req.session.user);
	console.log(req.cookies.user_sid);
	User.findOne({ where: { username: username } }).then(function(user) {
		if (!user) {
			res.redirect('/login');
		} else if (!user.validPassword(password)) {
			res.redirect('/login');
		} else {
			req.session.user = user.dataValues;
			res.redirect('/dashboard');
		}
	});
});

// route for user's dashboard
app.get('/dashboard', (req, res) => {
	if (req.session.user && req.cookies.user_sid) {
		//res.redirect('localhost:3000/');
		res.sendFile(dirname+'/build/index.html');
		//console.log(req.session)
	} else {
		
		res.redirect('/login');
	}
});

// route for user logout
app.get('/logout', (req,res) => {
	if (req.session.user && req.cookies.user_sid) {
		res.clearCookie('user_sid');
		res.redirect('/');
	} else {
		res.redirect('/login');
	}
});

// Route for handling 404 requests( unavailable routes)
app.use(function (req, res, next) {
	res.status(404).send("Sorry, can't find that...")
});

server.listen(app.get('port'), () => console.log(`App started on port ${app.get('port')}`));
