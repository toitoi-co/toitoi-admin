'use strict';

const Promise = require("bluebird");
const errors = require("../util/errors");

module.exports = function(response) {
	return Promise.try(() => {
		if (response.status < 200 || response.status >= 400) {
			throw new errors.HttpError(`Expected HTTP status 2xx or 3xx; encountered ${response.status} instead`);
		}

		return response;
	}).catch({name: "HttpError"}, (err) => {
		return Promise.try(() => {
			return response.json();
		}).then((json) => {
			err.json = json;
			throw err;
		});
	});
}