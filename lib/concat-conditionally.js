'use strict';

const assureArray = require("assure-array");

module.exports = function(initial, rules) {
	return rules.reduce((combined, rule) => {
		if (rule.if === true) {
			return combined.concat(assureArray(rule.add));
		} else if (rule.if === false) {
			return combined;
		} else {
			throw new Error(`Got a non-boolean 'if' value: ${rule.if}`);
		}
	}, initial);
}