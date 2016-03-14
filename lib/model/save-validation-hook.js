const Promise = require("bluebird");
const rfr = require("rfr");
const errors = rfr("lib/errors");

module.exports = function() {
	let validationPromise, allowedAttributesPromise;
	
	if (this.validationRules != null) {
		validationPromise = this.validationRules.run(this.attributes);
	}
	
	if (this.checkAllowedAttributes != null) {
		allowedAttributesPromise = this.checkAllowedAttributes();
	}
	
	return Promise.all([
		validationPromise,
		allowedAttributesPromise
	]).catch(checkit.Error, (err) => {
		throw new errors.ValidationError("One or more fields were invalid.", {errors: err.errors})
	});
}