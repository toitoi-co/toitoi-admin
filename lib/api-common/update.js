'use strict';

const Promise = require("bluebird");
const rfr = require("rfr");

module.exports = function({bookshelf, model}) {
	return function(req, res) {
		return Promise.try(() => {/* This looks wrong. Surely a patch save is a PATCH, not a PUT? */
			return req[`params${model.name}`].save(req.body, {patch: true});
		}).then((item) => {
			res.status(204).end();
		});
	}
}