'use strict';

const Promise = require("bluebird");
const rfr = require("rfr");

module.exports = function({bookshelf, model}) {
	return function(req, res) {
		return Promise.try(() => {
			return bookshelf.model(model.name).fetchAll();
		}).then((items) => {
			res.json(items.toJSON());
		});
	}
}