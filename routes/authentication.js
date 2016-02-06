'use strict';

const Promise = require("bluebird");
const checkit = require("checkit");
const scrypt = require("scrypt-for-humans");
const rfr = require("rfr");

const apiRouter = rfr("lib/api-router");
const errors = rfr("lib/errors");
const copy = rfr("lib/copy-properties");

module.exports = function({acl, firebaseConfiguration, bookshelf}) {
	let router = apiRouter();

	router.apiRoute("/login", {
		post: function(req, res, next) {
			return Promise.try(() => {
				return checkit({
					email: ["required"],
					password: ["required"]
				}).run(req.body); 
			}).then(() => {
				return bookshelf.model("User").forge({email: req.body.email}).fetch({require: true});
			}).then((user) => {
				return Promise.try(() => {
					return scrypt.verifyHash(req.body.password, user.get("hash"));
				}).then((result) => {
					return user;
				})
			}).then((user) => {
				req.session.userId = user.get("id");
				res.header("X-API-Authenticated", "true");
				res.json(user.toJSON());
			}).catch(bookshelf.NotFoundError, (err) => {
				throw new errors.UnauthorizedError("No such account exists.")
			}).catch(scrypt.PasswordError, (err) => {
				throw new errors.UnauthorizedError("Invalid password.")
			}).catch(checkit.Error, (err) => {
				throw new errors.ValidationError("One or more fields were missing.", {errors: err.errors});
			});
		}
	});

	router.apiRoute("/generate-token", {
		post: [acl.allow("member"), function(req, res, next) {
			let token = req.currentUser.getFirebaseToken({
				expires: Date.now() + firebaseConfiguration.tokenExpiry
			});
			
			res.json({ token: token });
		}]
	});

	router.apiRoute("/register", {
		post: function(req, res, next) {
			return Promise.try(() => {
				return checkit({
					email: ["required", "email"],
					firstName: ["required"],
					lastName: ["required"],
					password: ["required", (value) => {
						if (value.length < 8) {
							throw new Error("Password must be at least 8 characters long.");
						} else if (value.length > 1024) {
							throw new Error("Password cannot be longer than 1024 characters.");
						} else if (/^[a-zA-Z]+$/.test(value)) {
							throw new Error("Password must contain at least one number or special character.");
						}
					}]
				}).run(req.body);
			}).then(() => {
				return scrypt.hash(req.body.password);
			}).then((hash) => {
				let copyableAttributes = ["email", "firstName", "lastName", "address1", "address2", "city", "state", "postalCode", "country"];
				
				let userAttributes = copy.immutable({
					role: "member",
					isActive: false,
					hash: hash
				}, req.body, copyableAttributes)
				
				return bookshelf.model("User")
					.forge(userAttributes)
					.save();
			}).then((user) => {
				res.json(user.toJSON());
			}).catch(checkit.Error, (err) => {
				throw new errors.ValidationError("One or more fields were invalid.", {errors: err.errors});
			})
		}
	});
	
	router.apiRoute("/logout", {
		post: [acl.allow("member"), function(req, res, next) {
			req.session.destroy();
			res.status(204).end();
		}]
	});

	return router
}