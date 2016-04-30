'use strict';

const Promise = require("bluebird");
const checkit = require("checkit");
const rfr = require("rfr");

const apiRouter = rfr("lib/api-router");
const errors = rfr("lib/errors");
const copy = rfr("lib/copy-properties");

module.exports = function({acl, firebaseConfiguration, bookshelf}) {
	let router = apiRouter();

	router.apiRoute("/site", {
		get: [acl.allow("member"), function(req, res, next) {
			return Promise.try(() => {
				return bookshelf.model("Site").forge({
					userId: req.session.userId
				}).fetch({
					require: true
				});
			}).then((site) => {
				res.json(site.toJSON());
			}).catch(bookshelf.NotFoundError, (err) => {
				throw new errors.UnauthorizedError("The currently logged in user does not have a Site yet.")
			});
		}],
		put: [acl.allow("member"), function(req, res, next) {
			return Promise.try(() => {
				return bookshelf.model("Site").forge({
					userId: req.session.userId
				}).fetch({
					require: true
				});
			}).catch(bookshelf.NotFoundError, (err) => {
				/* Start with a blank site if none exists yet. */
				return bookshelf.model("Site").forge({});
			}).then((site) => {
				if (site.isNew()) {
					let baseData = {
						userId: req.session.userId,
					};

					let newAttributes = copy.immutable(baseData, req.body, ["siteName", "subdomainName", "presetId"]);
					return site.save(newAttributes);
				} else {
					let newAttributes = copy.immutable({}, req.body, ["siteName", "presetId"]);
					return site.save(newAttributes, {patch: true});
				}
			}).then(() => {
				res.status(204).end();
			});
		}]
	});

	return router;
}
