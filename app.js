'use strict';

const Promise = require("bluebird");
const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const expressSession = require("express-session");
const KnexSessionStore = require("connect-session-knex")(expressSession);
const Firebase = require("firebase");
const FirebaseTokenGenerator = require("firebase-token-generator");
const rfr = require("rfr");
const cors = require("cors");
const doWrapper = require("do-wrapper");
const stripe = require("stripe");

Promise.promisifyAll(doWrapper.prototype);

const sessionHandler = rfr("middleware/session-handler")
const errorHandler = rfr("middleware/error-handler");
const aclModule = rfr("lib/acl");
const mailer = rfr("lib/email/mailer");
const errors = rfr("lib/errors");

let config = require("./config.json")

let app = express();

/* ACL setup */
let acl = aclModule(function(req, res) {
	/* This method could also return a Promise, and it'd still work. */
	if (req.currentUser != null) {
		return req.currentUser.get("role");
	} else {
		return "guest";
	}
});

acl.addRole("unconfirmed", {parent: "guest"});
acl.addRole("member", {parent: "unconfirmed"});
acl.addRole("admin", {parent: "member"});

/* E-mail setup */
let mailerInstance = mailer({
	domain: config.mailgun.domain,
	apiKey: config.mailgun.apiKey,
	sender: config.mailgun.sender,
	templatePath: path.join(__dirname, "templates")
});

/* Database setup */
let environment = (process.env.NODE_ENV != null) ? process.env.NODE_ENV : "development";
let knexfile = rfr("knexfile");
let knex = require("knex")(knexfile)
let bookshelf = require("bookshelf")(knex);

bookshelf.plugin("registry");
bookshelf.plugin("visibility");
bookshelf.plugin(rfr("lib/bookshelf-plugins/normalize"));

let digitalOcean = new doWrapper(config.digitalOcean.secret);
let stripeAPI = stripe(config.stripe.secretKey);

/* Firebase admin setup */
let tokenGenerator = new FirebaseTokenGenerator(config.firebase.secret)

function generateFirebaseToken() {
	return tokenGenerator.createToken({
		uid: "-admin-api"
	}, {
		expires: (Date.now() / 1000) + config.firebase.adminTokenExpiry,
		admin: true
	});
}

function authenticateFirebase() {
	return firebase.authWithCustomToken(generateFirebaseToken());
}

/* The following hack is needed because Firebase apparently does not have a reasonable token expiry mechanism, and can't queue up our calls while waiting for auth to be re-established... */
let firebaseAuthenticationPromise;

let firebase = new Firebase(`https://${config.firebase.name}.firebaseio.com`);

Promise.try(() => {
	firebaseAuthenticationPromise = authenticateFirebase();
	return firebaseAuthenticationPromise;
}).then(() => {
	/* State object for dependency injection */
	let state = {
		bookshelf: bookshelf,
		acl: acl,
		firebaseConfiguration: config.firebase,
		firebase: firebase,
		firebaseAuthenticationPromise: firebaseAuthenticationPromise,
		firebaseTokenGenerator: tokenGenerator,
		hostedDomain: config.hostedDomain,
		deploymentIp: config.deploymentIp,
		cmsBase: config.cmsBase,
		siteLaunched: config.siteLaunched,
		digitalOcean: digitalOcean,
		stripeAPI: stripeAPI,
		mailer: mailerInstance,
		emailSubjects: config.emailSubjects,
		environment: environment,
		loginOptions: config.loginThrottling,
		defaultPlanId: config.defaultPlan
	}
	
	firebase.onAuth(function(authData) {
		if (authData == null) {
			/* We were unauthenticated. */
			console.log("Regenerating Firebase auth token...");
			state.firebaseAuthenticationPromise = authenticateFirebase();
			state.firebaseAuthenticationPromise.then(() => {
				console.log("Regenerated!");
			})
		}
	});

	/* Model configuration */
	rfr("models/user")(state);
	rfr("models/plan")(state);
	rfr("models/preset")(state);
	rfr("models/site")(state);

	app.use(cors({
		origin: config.corsOrigin,
		credentials: true
	}));

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

	/* The following two will conditionally enable routes themselves, based on siteLaunched */
	app.use(rfr("routes/profile")(state));
	app.use(rfr("routes/site")(state));
	
	if (config.siteLaunched) {
		/* These are just completely unnecessary until the site has launched */
		app.use("/presets", acl.allow("member"), rfr("routes/presets")(state));
		app.use("/generate-signed-request", acl.allow("member"), rfr("routes/signed-requests")(state));
	}

	/* Administrative tools should always be available */
	app.use("/admin/users", acl.allow("admin"), rfr("routes/admin/users")(state));
	app.use("/admin/roles", acl.allow("admin"), rfr("routes/admin/roles")(state));
	app.use("/admin/plans", acl.allow("admin"), rfr("routes/admin/plans")(state));
	app.use("/admin/presets", acl.allow("admin"), rfr("routes/admin/presets")(state));
	app.use("/admin/sites", acl.allow("admin"), rfr("routes/admin/sites")(state));

	if (environment === "development") {
		app.use(rfr("routes/development"));
	}

	/* Default 404 handler */

	app.use(function(req, res, next) {
		next(new errors.NotFoundError("No such route exists"));
	});

	/* Error handling */
	app.use(errorHandler(state));

	app.listen(config.listen.port, config.listen.host, function() {
		console.log("Listening...");
	});
})
