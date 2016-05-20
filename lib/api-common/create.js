'use strict';

const Promise = require("bluebird");
const rfr = require("rfr");

module.exports = function({bookshelf, model}) {
	return function(req, res) {
		return Promise.try(() => {
			return bookshelf.model(model.name)
				.forge(req.body)
				.save();
		}).then((item) => {
			// FIXME: Investigate why defaults (eg. Site.planId) are not always included
			res.json(item);
		})
	}
}