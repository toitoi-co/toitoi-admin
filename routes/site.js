'use strict';

const Promise = require("bluebird");
const checkit = require("checkit");
const rfr = require("rfr");

const apiRouter = rfr("lib/api-router");
const errors = rfr("lib/errors");
const copy = rfr("lib/copy-properties");
const detectUniqueViolation = rfr("lib/model/detect-unique-violation");
const validateSubdomain = rfr("lib/validate-subdomain");
const concatConditionally = rfr("lib/concat-conditionally");

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
				return Promise.try(() => {
					if (req.body.planId != null) {
						return site.changePlan(req.body.planId, req.body.presetId);
					} else if (req.body.presetId != null) {
						return site.validatePreset(req.body.presetId);
					}
				}).then(() => {
					let copyableAttributes = concatConditionally(["siteName"], [{
						add: "subdomainName",
						if: site.isNew()
					}, {
						add: ["presetId", "planId"],
						if: siteLaunched
					}]);

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

						return site.save(copy.immutable(baseData, req.body, copyableAttributes));
					} else {
						return site.save(copy.immutable({}, req.body, copyableAttributes), {patch: true});
					}
				})
			}).then(() => {
				res.status(204).end();
			}).catch(detectUniqueViolation);
		}]
	});

	return router;
}
