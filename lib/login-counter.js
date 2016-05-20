'use strict';

const ms = require("ms");

module.exports = function(options) {
	let counters = {};
	let expiry = ms(options.attemptExpiry);

	function expireEntries(ip) {
		if (counters[ip] != null) {
			counters[ip] = counters[ip].filter((event) => {
				return (Date.now() < (event + expiry));
			});
		} else {
			counters[ip] = [];
		}
	}

	return {
		increment: function(ip) {
			expireEntries(ip);
			counters[ip].push(Date.now());
		},
		reset: function(ip) {
			counters[ip] = [];
		},
		needsCaptcha: function(ip) {
			expireEntries(ip);
			return (counters[ip].length >= options.captchaLimit);
		},
		isBlocked: function(ip) {
			expireEntries(ip);
			return (counters[ip].length >= options.blockLimit);
		},
		getStatistics: function(ip, user) {
			expireEntries(ip);

			let stats = {
				ipFailures: counters[ip].length,
				ipBlocked: this.isBlocked(ip),
				needsCaptcha: this.needsCaptcha(ip),
			}

			if (user != null) {
				let failedUserAttempts = user.get("failedLoginAttempts");

				Object.assign(stats, {
					userBlocked: (failedUserAttempts >= options.userBlockLimit),
					userFailures: failedUserAttempts
				});
			}


			return stats;
		}
	}
}