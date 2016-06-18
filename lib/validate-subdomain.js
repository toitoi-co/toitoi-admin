'use strict';

module.exports = function(subdomain) {
	if (/^[a-z0-9-]+$/i.exec(subdomain) == null) {
		throw new Error("Subdomain can only contain alphanumeric characters and dashes");
	} else if (subdomain.length < 5) {
		throw new Error("Subdomain must be at least 5 characters long")
	}
}