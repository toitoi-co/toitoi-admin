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
			res.json(item);
		})
	}
}