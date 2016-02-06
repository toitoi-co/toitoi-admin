'use strict';

module.exports = function(key) {
	return key.replace(/,1/g, ".")
}