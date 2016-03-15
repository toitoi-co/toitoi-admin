'use strict';

const Promise = require("bluebird");
const checkit = require("checkit");
const rfr = require("rfr");

const apiRouter = rfr("lib/api-router");
const errors = rfr("lib/errors");
const createRequestSigner = rfr("lib/signed-request-generator");

module.exports = function({acl, hostedDomain, bookshelf, firebaseConfiguration}) {
	let router = apiRouter();

	let signedRequestGenerator = createRequestSigner(firebaseConfiguration.secret);
	
	router.apiRoute("/preset", {
		post: function(req, res) {
			return Promise.try(() => {
				return checkit({
					presetId: ["required", "numeric"],
					hostname: "required"
				}).run(req.body);
			}).then(() => {
				return Promise.all([
					bookshelf.model("Preset").forge({id: req.body.presetId}).fetch({require: true}),
					req.currentUser.getPrimarySite(),
					req.currentUser.getPlan()
				]);
			}).spread((preset, site, plan) => {
				let expectedHostname = site.get("subdomainName") + "." + hostedDomain;
				
				if (req.body.hostname !== expectedHostname) {
					throw new errors.ForbiddenError("You are not allowed to change the preset for that hostname.");
				}
				
				if (!preset.get("isEnabled")) {
					throw new errors.ForbiddenError("This preset has been disabled.");
				}
				
				if (!preset.isAllowed(plan)) {
					throw new errors.ForbiddenError("This preset is not allowed for the current plan.");
				}
				
				return signedRequestGenerator("preset", {
					hostname: req.body.hostname,
					url: preset.get("url")
				});
			}).then((token) => {
				res.json({
					signedRequest: token
				});
			});
		}
	});

	return router
}