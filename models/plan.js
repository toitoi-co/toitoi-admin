'use strict';

const Promise = require("bluebird");
const checkit = require("checkit");
const rfr = require("rfr");

const errors = rfr("lib/errors");
const checkAllowedAttributes = rfr("lib/model/check-allowed-attributes");
const saveValidationHook = rfr("lib/model/save-validation-hook");

module.exports = function({bookshelf}) {
	bookshelf.model("Plan", {
		tableName: "plans",
		hasTimestamps: ["createdAt", "updatedAt"],
		
		sites: function() {
			return this.hasMany("Site", "planId");
		},
		
		preset: function() {
			return this.hasMany("Preset", "planId");
		},
		
		validAttributes: [
			"id",
			"name",
			"stripePlanId", // FIXME: This should be required (ie. NOT NULL)...
			"createdAt",
			"updatedAt"
		],
		
		checkAllowedAttributes: checkAllowedAttributes("Preset"),
		
		initialize: function() {
			this.on("saving", saveValidationHook);
		}
	})
}