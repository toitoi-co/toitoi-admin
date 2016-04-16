'use strict';

const parseValue = require("./parse-value");

module.exports = function(result, key, value) {
	if (result == null) {
		result = {};
	}

	result[key] = parseValue(value);

	return result;
}