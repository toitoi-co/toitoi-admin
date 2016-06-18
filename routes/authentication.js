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
const loginCounter = rfr("lib/login-counter");
const recaptcha = rfr("lib/recaptcha");

module.exports = function({acl, firebaseConfiguration, bookshelf, mailer, cmsBase, siteLaunched, emailSubjects, loginOptions, recaptchaKey}) {
	let router = apiRouter();

	let loginAttempts = loginCounter({
		attemptExpiry: loginOptions.attemptExpiry,
		captchaLimit: loginOptions.failureLimits.captcha,
		blockLimit: loginOptions.failureLimits.ipBlock,
		userBlockLimit: loginOptions.failureLimits.userBlock
	});

	let verifyRecaptcha = recaptcha(recaptchaKey);

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
					if (loginAttempts.isBlocked(req.ip)) {
						throw new errors.UnauthorizedError("Temporarily blocked from logging in.", loginAttempts.getStatistics(req.ip, user));
					} else if (user.get("failedLoginAttempts") >= loginOptions.failureLimits.userBlock) {
						throw new errors.UnauthorizedError("Account has been blocked due to too many failed logins.", loginAttempts.getStatistics(req.ip, user))
					} else if (loginAttempts.needsCaptcha(req.ip)) {
						/* The CAPTCHA check has been temporarily disabled, because it didn't work (issue pending) */
						// return verifyRecaptcha(req.body["g-recaptcha-response"], req.ip);
						return true;
					}
				}).then(() => {
					return scrypt.verifyHash(req.body.password, user.get("hash"));
				}).then((result) => {
					return user;
				}).catch(scrypt.PasswordError, (err) => {
					return Promise.try(() => {
						/* FIXME: Is there a nicer syntax for doing this? */
						loginAttempts.increment(req.ip);

						return bookshelf.model("User").query()
							.increment("failedLoginAttempts")
							.where({id: user.id});
					}).then(() => {
						throw new errors.UnauthorizedError("Invalid password.", loginAttempts.getStatistics(req.ip, user))
					});
				}).catch(errors.CaptchaError, (err) => {
					throw new errors.UnauthorizedError("Invalid captcha.", loginAttempts.getStatistics(req.ip, user));
				});
			}).then((user) => {
				loginAttempts.reset(req.ip);
				req.session.userId = user.get("id");
				res.header("X-API-Authenticated", "true");
				res.json(user.toJSON());
			}).catch(bookshelf.NotFoundError, (err) => {
				loginAttempts.increment(req.ip);
				throw new errors.UnauthorizedError("No such account exists.", loginAttempts.getStatistics(req.ip))
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
				return mailer.send("confirmation", user.get("email"), emailSubjects.confirmEmail, {
					user: user.toJSON(),
					site: cmsBase,
					/* We must explicitly specify the confirmationKey, because
					 * this is set as 'hidden' in the model, and so will not be
					 * included in the plain user object. */
					confirmationKey: user.get("confirmationKey")
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

				return mailer.send(welcomeTemplate, user.get("email"), welcomeSubject, {
					user: user.toJSON()
				});
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
