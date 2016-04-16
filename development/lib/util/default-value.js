'use strict';

module.exports = function(value, defaultValue) {
	if (value != null) {
		return value;
	} else {
		return defaultValue;
	}
}