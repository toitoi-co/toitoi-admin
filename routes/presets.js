'use strict';

const Promise = require("bluebird");
const checkit = require("checkit");
const scrypt = require("scrypt-for-humans");
const rfr = require("rfr");

const apiRouter = rfr("lib/api-router");
const errors = rfr("lib/errors");
const copy = rfr("lib/copy-properties");
const validatePassword = rfr("lib/validate-password");

module.exports = function({acl, firebaseConfiguration, bookshelf}) {
	let router = apiRouter();

	router.apiRoute("/", {
		get: function(req, res) {
			return Promise.try(() => {
				return Promise.all([
					bookshelf.model("Preset").fetchAll(),
					req.currentUser.getPlan()
				]);
			}).spread((presets, plan) => {
				return presets.map((preset) => {
					let presetJson = preset.toJSON();
					
					if (plan == null) {
						presetJson.isAvailable = false;
					} else {
						presetJson.isAvailable = preset.isAllowed(plan);
					}
					
					return presetJson;
				})
			}).then((presets) => {
				res.json(presets);
			})
		}
	});

	return router
}