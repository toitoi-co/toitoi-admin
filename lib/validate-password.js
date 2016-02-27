'use strict';

module.exports = function(value) {
	if (value.length < 8) {
		throw new Error("Password must be at least 8 characters long.");
	} else if (value.length > 1024) {
		throw new Error("Password cannot be longer than 1024 characters.");
	} else if (/^[a-zA-Z]+$/.test(value)) {
		throw new Error("Password must contain at least one number or special character.");
	}
}