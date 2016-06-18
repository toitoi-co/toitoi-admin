'use strict';

const Promise = require("bluebird");
const checkit = require("checkit");
const rfr = require("rfr");

const apiRouter = rfr("lib/api-router");
const errors = rfr("lib/errors");
const copy = rfr("lib/copy-properties");
const validatePassword = rfr("lib/validate-password");

module.exports = function({acl, firebaseConfiguration, bookshelf, siteLaunched}) {
	let router = apiRouter();

	router.apiRoute("/profile", {
		get: [acl.allow("unconfirmed"), function(req, res, next) {
			return Promise.try(() => {
				return bookshelf.model("User").forge({
					id: req.session.userId
				}).fetch({
					require: true,
					withRelated: ["site"]
				});
			}).then((user) => {
				res.json(user.toJSON());
			});
		}],
		put: [acl.allow("member"), function(req, res, next) {
			return Promise.try(() => {
				return bookshelf.model("User").forge({
					id: req.session.userId
				}).fetch({
					require: true
				});
			}).then((user) => {
				return Promise.try(() => {
					let copyableAttributes = ["firstName", "lastName", "address1", "address2", "city", "state", "postalCode", "country", "onboardingFlowCompleted"];
					let newAttributes = copy.immutable({}, req.body, copyableAttributes);

					return user.save(newAttributes, {patch: true});
				}).then(() => {
					res.status(204).end();
				});
			});
		}]
	});

	if (siteLaunched) {
		router.apiRoute("/generate-token", {
			post: [acl.allow("member"), function(req, res, next) {
				let token = req.currentUser.getFirebaseToken({
					expires: Date.now() + firebaseConfiguration.tokenExpiry
				});

				res.json({ token: token });
			}]
		});

		router.apiRoute("/change-password", {
			post: [acl.allow("member"), function(req, res, next) {
				return Promise.try(() => {
					return checkit({
						password: ["required", validatePassword]
					}).run(req.body);
				}).then(() => {
					if (req.currentUser.get("signupFlowCompleted") === true) {
						if (req.body.oldPassword == null) {
							throw new errors.UnauthorizedError("No previous password specified, but user is not a new user.");
						} else {
							return scrypt.verifyHash(req.body.oldPassword, req.currentUser.get("hash"));
						}
					}
				}).then(() => {
					return scrypt.hash(req.body.password);
				}).then((hash) => {
					req.currentUser.set("hash", hash);
					return req.currentUser.save();
				}).then((user) => {
					res.status(204).end();
				}).catch(scrypt.PasswordError, (err) => {
					throw new errors.UnauthorizedError("Invalid previous password specified.");
				}).catch(checkit.Error, (err) => {
					throw new errors.ValidationError("One or more fields were invalid.", {errors: err.errors});
				})

			}]
		});
	}

	return router
}
