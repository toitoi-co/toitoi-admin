'use strict';

const Promise = require("bluebird");
const checkit = require("checkit");
const rfr = require("rfr");

const errors = rfr("lib/errors");
const checkAllowedAttributes = rfr("lib/model/check-allowed-attributes");
const saveValidationHook = rfr("lib/model/save-validation-hook");
const parseBooleanFields = rfr("lib/model/parse-boolean-fields");

module.exports = function({bookshelf}) {
	bookshelf.model("Preset", {
		tableName: "presets",
		hasTimestamps: ["createdAt", "updatedAt"],
		
		plan: function() {
			return this.belongsTo("Plan", "planId");
		},
		
		defaults: {
			isEnabled: true
		},
		
		parse: function(attributes) {
			return parseBooleanFields(attributes, ["isEnabled"]);
		},
		
		validAttributes: [
			"id",
			"planId",
			"isEnabled",
			"name",
			"description",
			"thumbnail",
			"url",
			"createdAt",
			"updatedAt"
		],
		
		// FIXME: Detect 'UNIQUE constraint failed' errors, and throw accordingly
		validationRules: checkit({
			url: "url",
			isEnabled: "boolean"
		}),
		
		checkAllowedAttributes: checkAllowedAttributes("Preset"),
		
		initialize: function() {
			this.on("saving", saveValidationHook);
		},
		
		isAllowed: function(plan) {
			return (plan.get("id") === this.get("planId"));
		}
	})
}