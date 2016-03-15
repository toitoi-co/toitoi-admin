'use strict';

const Promise = require("bluebird");
const rfr = require("rfr");

module.exports = function({bookshelf, model}) {
	return function(req, res) {
		res.json(req[`params${model.name}`].toJSON());
	}
}