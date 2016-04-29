'use strict';

const rfr = require("rfr");
const errors = rfr("lib/errors");

let detailsRegex = /Key \(([^\)]+)\)=\(([^\)]+)\) already exists\./

module.exports = function(err) {
	if (err.routine != null && err.routine === "_bt_check_unique") {
		console.log(err.detail);
		let [_, key, value] = detailsRegex.exec(err.detail);
		throw new errors.ConflictError(`The specified '${key}' (${value}) already exists.`);
	} else {
		throw err;
	}
}