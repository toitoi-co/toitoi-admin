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
					req.currentUser.load("sites.plan")
				]);
			}).spread((presets, _) => {
				let presetList = presets.toJSON();
				let currentPlan;
				
				let sites = req.currentUser.related("sites");
				
				if (sites.length > 0) {
					let primarySite = sites.at(0);
					currentPlan = primarySite.related("plan").get("id");
				}
				
				return presetList.map((preset) => {
					let available;
					
					if (currentPlan == null) {
						available = false;
					} else {
						available = (currentPlan === preset.planId);
					}
					
					preset.isAvailable = available;
					return preset;
				})
			}).then((presets) => {
				res.json(presets);
			})
		}
	});

	return router
}