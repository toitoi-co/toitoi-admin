const Promise = require("bluebird");
const jwt = require("jsonwebtoken-promisified");
const xtend = require("xtend");

module.exports = function(key) {
	return function(type, data, options = {}) {
		return Promise.try(() => {
			if (options.expiry == null) {
				/* Expires in 5 minutes by default. */
				options.expiry = 300;
			}
			
			return jwt.signAsync(xtend(data, {messageType: type}), key, {
				expiresIn: options.expiry
			});
		});
	}
}