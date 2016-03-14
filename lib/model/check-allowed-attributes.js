'use strict';

const rfr = require("rfr");
const errors = rfr("lib/errors");

module.exports = function(modelName) {
	return function() {
		Object.keys(this.attributes).forEach((attribute) => {
			if (this.validAttributes.indexOf(attribute) === -1) {
				throw new errors.ValidationError(`'${attribute}' is not an allowed attribute on ${modelName} models.`)
			}
		});
	}
}