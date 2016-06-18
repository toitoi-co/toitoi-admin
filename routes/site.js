'use strict';

const Promise = require("bluebird");
const checkit = require("checkit");
const rfr = require("rfr");

const apiRouter = rfr("lib/api-router");
const errors = rfr("lib/errors");
const copy = rfr("lib/copy-properties");
const detectUniqueViolation = rfr("lib/model/detect-unique-violation");
const validateSubdomain = rfr("lib/validate-subdomain");

module.exports = function({acl, firebaseConfiguration, bookshelf, siteLaunched}) {
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
				// FIXME: Check validity of `presetId` in the current plan

				if (site.isNew()) {
					let baseData = {
						userId: req.session.userId,
					};

					// FIXME: Use checkit for this?
					// FIXME: Should we do this check on /admin routes as well?
					try {
						if (req.body.subdomainName != null) {
							validateSubdomain(req.body.subdomainName);
						}
					} catch (err) {
						throw new errors.ValidationError(err.message);
					}

					let newAttributes;

					if (siteLaunched) {
						newAttributes = copy.immutable(baseData, req.body, ["siteName", "subdomainName", "presetId"]);
					} else {
						newAttributes = copy.immutable(baseData, req.body, ["siteName", "subdomainName"]);
					}

					return site.save(newAttributes);
				} else {
					let newAttributes;

					if (siteLaunched) {
						newAttributes = copy.immutable({}, req.body, ["siteName", "presetId"]);
					} else {
						newAttributes = copy.immutable({}, req.body, ["siteName"]);
					}

					return site.save(newAttributes, {patch: true});
				}
			}).then(() => {
				res.status(204).end();
			}).catch(detectUniqueViolation);;
		}]
	});

	return router;
}
