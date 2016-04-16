'use strict';

module.exports = function(value) {
	if (value !== "") {
		if (value === "true") {
			return true;
		} else if (value === "false") {
			return false;
		} else if (/^[0-9]+$/.test(value)) {
			return parseInt(value);
		} else {
			return value;
		}
	}
}

