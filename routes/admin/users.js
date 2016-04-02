'use strict';

const Promise = require("bluebird");
const scrypt = require("scrypt-for-humans");
const rfr = require("rfr");

const apiRouter = rfr("lib/api-router");
const errors = rfr("lib/errors");

module.exports = function({bookshelf}) {
	let router = apiRouter();
	
	router.__param("userId", function(req, res, next, userId) {
		return Promise.try(() => {
			return bookshelf.model("User").forge({
				id: userId
			}).fetch({
				require: true,
				withRelated: ["site"]
			});
		}).then((user) => {
			req.paramsUser = user;
			next();
		}).catch(bookshelf.Model.NotFoundError, (err) => {
			throw new errors.NotFoundError("No such user exists.");
		}).catch(next); // FIXME: File a bug on express-promise-router about line #44, which incorrectly assumes that the last parameter is `next`
	})

	router.apiRoute("/", {
		get: function(req, res) {
			return Promise.try(() => {
				return bookshelf.model("User").fetchAll({
					withRelated: ["site"]
				});
			}).then((users) => {
				res.json(users.toJSON());
			});
		},
		post: function(req, res) {
			return Promise.try(() => {
				if (req.body.hash != null) {
					throw new errors.ValidationError("Setting the hash directly is not allowed.");
				}

				if (req.body.password == null) {
					/* FIXME: Surely this can be done nicer? This is already checked in the model... */
					throw new errors.ValidationError("A password must be specified.");
				} else {
					var password = req.body.password;
					delete req.body.password;
					return scrypt.hash(password);
				}
			}).then((hash) => {
				req.body.hash = hash;

				return bookshelf.model("User")
					.forge(req.body)
					.save();
			}).then((user) => {
				res.json(user);
			})
		}
	});

	router.apiRoute("/:userId", {
		get: function(req, res) {
			res.json(req.paramsUser.toJSON());
		},
		put: function(req, res) {
			return Promise.try(() => {
				if (req.body.hash != null) {
					throw new errors.ValidationError("Setting the hash directly is not allowed.");
				}

				if (req.body.password != null) {
					var password = req.body.password;
					delete req.body.password;
					return scrypt.hash(password);
				} else {
					/* No password specified, so we don't need to hash either. */
					return null;
				}
			}).then((hash) => {
				if (hash != null) {
					req.body.hash = hash;
				}

				/* This looks wrong. Surely a patch save is a PATCH, not a PUT? */
				return req.paramsUser.save(req.body, {patch: true});
			}).then((user) => {
				res.status(204).end();
			});
		},
		delete: function(req, res) {
			return Promise.try(() => {
				return req.paramsUser.destroy({require: true});
			}).then((user) => {
				res.status(204).end();
			}).catch(bookshelf.Model.NoRowsDeletedError, (err) => {
				/* This should only happen in the case of a race condition, where the user was deleted
				 * inbetween the execution of the `userId` parameter handler and the `destroy` call.
				 * FIXME: Investigate possible causes for this error, and whether different types of
				 *        errors / status codes might be necessary.
				 */
				throw new errors.ConflictError("Could not delete the user, it was most likely already deleted.")
			})
		}
	});
	
	return router;
}
