'use strict';

const Promise = require("bluebird");
const checkit = require("checkit");
const scrypt = require("scrypt-for-humans");
const uuid = require("uuid");
const rfr = require("rfr");

const apiRouter = rfr("lib/api-router");
const errors = rfr("lib/errors");
const copy = rfr("lib/copy-properties");
const validatePassword = rfr("lib/validate-password");
const detectUniqueViolation = rfr("lib/model/detect-unique-violation");

module.exports = function({acl, firebaseConfiguration, bookshelf, mailer, cmsBase, siteLaunched, emailSubjects}) {
	let router = apiRouter();

	router.apiRoute("/login", {
		post: function(req, res, next) {
			return Promise.try(() => {
				return checkit({
					email: ["required"],
					password: ["required"]
				}).run(req.body); 
			}).then(() => {
				return bookshelf.model("User").forge({
					email: req.body.email
				}).fetch({
					require: true,
					withRelated: ["site"]
				});
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
	
	router.apiRoute("/register", {
		post: function(req, res, next) {
			return Promise.try(() => {
				return checkit({
					email: ["required", "email"],
					firstName: ["required"],
					lastName: ["required"],
					password: ["required", validatePassword]
				}).run(req.body);
			}).then(() => {
				return scrypt.hash(req.body.password);
			}).then((hash) => {
				let copyableAttributes = ["email", "firstName", "lastName", "address1", "address2", "city", "state", "postalCode", "country"];
				
				let userAttributes = copy.immutable({
					role: "unconfirmed",
					isActive: false,
					confirmationKey: uuid.v4(),
					hash: hash
				}, req.body, copyableAttributes)
				
				return bookshelf.model("User")
					.forge(userAttributes)
					.save();
			}).tap((user) => {
				// FIXME: Make subject configurable?
				return mailer.send("confirmation", user.get("email"), emailSubjects.confirmEmail, {
					confirmationKey: user.get("confirmationKey"),
					site: cmsBase
				});
			}).then((user) => {
				res.json(user.toJSON());
			}).catch(checkit.Error, (err) => {
				throw new errors.ValidationError("One or more fields were invalid.", {errors: err.errors});
			}).catch(detectUniqueViolation);
		}
	});
	
	router.apiRoute("/confirm/:confirmationKey", {
		post: function(req, res, next) {
			return Promise.try(() => {
				return bookshelf.model("User").forge({
					role: "unconfirmed",
					confirmationKey: req.params.confirmationKey
				}).fetch({
					require: true
				});
			}).then((user) => {
				return user.save({
					role: "member"
				}, {
					patch: true
				});
			}).tap((user) => {
				let welcomeTemplate = (siteLaunched) ? "postlaunch-welcome" : "prelaunch-welcome";
				let welcomeSubject = (siteLaunched) ? emailSubjects.postLaunchWelcome : emailSubjects.preLaunchWelcome;

				// FIXME: Make subject configurable?
				return mailer.send(welcomeTemplate, user.get("email"), welcomeSubject);
			}).then((user) => {
				res.status(204).end();
			}).catch(bookshelf.NotFoundError, (err) => {
				throw new errors.NotFoundError("No such confirmation key exists.");
			});
		}
	});

	router.apiRoute("/logout", {
		post: [acl.allow("unconfirmed"), function(req, res, next) {
			res.header("X-API-Authenticated", "false");
			req.session.destroy();
			res.status(204).end();
		}]
	});

	return router
}
