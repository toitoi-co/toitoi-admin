'use strict';

const Promise = require("bluebird");
const bhttp = require("bhttp");
const rfr = require("rfr");

const errors = rfr("lib/errors");

module.exports = function(secretKey) {
	return function(response, ip) {
		return Promise.try(() => {
			return bhttp.post("https://www.google.com/recaptcha/api/siteverify", {
				secret: secretKey,
				response: response,
				remoteip: ip
			});
		}).then((response) => {
			console.log("CAPTCHA RESPONSE", response.body);
			if (response.body.success === true) {
				return true;
			} else {
				throw new errors.CaptchaError("CAPTCHA verification failed", {
					recaptchaCode: response.body["error-codes"][0]
				});
			}
		});
	}
}