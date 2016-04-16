'use strict';

module.exports = function(value) {
	if (Array.isArray(value)) {
		return value;
	} else {
		return [value];
	}
}