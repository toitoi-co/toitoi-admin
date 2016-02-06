'use strict';

module.exports = function(value) {
	if (Array.isArray(value) === false) {
		return [value];
	} else {
		return value;
	}
}