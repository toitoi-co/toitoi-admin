'use strict';

const Promise = require("bluebird");
const express = require("express");
const bodyParser = require("body-parser");
const expressSession = require("express-session");
const KnexSessionStore = require("connect-session-knex")(expressSession);
const Firebase = require("firebase");
const FirebaseTokenGenerator = require("firebase-token-generator");
const rfr = require("rfr");
const cors = require('cors');

const sessionHandler = rfr("middleware/session-handler")
const errorHandler = rfr("middleware/error-handler");
const aclModule = rfr("lib/acl");

let config = require("./config.json")
// FIXME: req.currentUser

let app = express();

/* permit cross-domain requests with local cms server, and allow for
   session id cookie to be sent back with generate-token request */
let corsOptions = {
	origin: 'http://localhost:4000',
	credentials: true
}
app.use(cors(corsOptions));

/* ACL setup */
let acl = aclModule(function(req, res) {
	/* This method could also return a Promise, and it'd still work. */
	if (req.currentUser != null) {
		return req.currentUser.get("role");
	} else {
		return "guest";
	}
});

acl.addRole("member", {parent: "guest"});
acl.addRole("admin", {parent: "member"});

/* Database setup */
let environment = (process.env.NODE_ENV != null) ? process.env.NODE_ENV : "development";
let knexfile = rfr("knexfile");
let knex = require("knex")(knexfile[environment])
let bookshelf = require("bookshelf")(knex);

bookshelf.plugin("registry");
bookshelf.plugin("visibility");

/* Firebase admin setup */
let firebaseToken = (new FirebaseTokenGenerator(config.firebase.secret)).createToken({
	uid: "-admin-api"
}, {
	expires: Date.now() + 31536000, // FIXME: Add reauthentication logic
	admin: true
});

let firebase = new Firebase(`https://${config.firebase.name}.firebaseio.com`);

Promise.try(() => {
	return firebase.authWithCustomToken(firebaseToken);
}).then(() => {
	/* State object for dependency injection */
	let state = {
		bookshelf: bookshelf,
		acl: acl,
		firebaseConfiguration: config.firebase,
		firebase: firebase
	}

	/* Model configuration */
	rfr("models/user")(state);

	/* Session setup */
	app.use(expressSession({
		store: new KnexSessionStore({
			knex: knex
		}),
		resave: false,
		saveUninitialized: false,
		secret: config.sessions.secret,
		cookie: {
			expires: Date.now() + (config.sessions.cookieExpiry * 1000),
			maxAge: (config.sessions.cookieExpiry * 1000)
		}
	}))

	/* Express configuration */
	app.disable("etag");

	app.use(bodyParser.json());

	app.use(sessionHandler(state));

	/* Route setup */
	app.use(rfr("routes/authentication")(state));
	app.use("/users", acl.allow("admin"), rfr("routes/users")(state));
	app.use("/roles", acl.allow("admin"), rfr("routes/roles")(state));

	if (environment === "development") {
		app.use(rfr("routes/development"));
	}

	/* Error handling */
	app.use(errorHandler);

	app.listen(3000);
})
