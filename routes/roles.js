'use strict';

const Promise = require("bluebird");
const rfr = require("rfr");

const apiRouter = rfr("lib/api-router");
const errors = rfr("lib/errors");

module.exports = function({acl}) {
	let router = apiRouter();

	router.apiRoute("/", {
		get: function(req, res) {
			Promise.try(() => {
				return acl.getRoles();
			}).then((roles) => {
				res.json(roles);
			});
		}
	});

	return router
}