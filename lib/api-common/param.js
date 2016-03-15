'use strict';

const Promise = require("bluebird");
const rfr = require("rfr");
const errors = rfr("lib/errors");

module.exports = function({bookshelf, model}) {
	return function(req, res, next, itemId) {
		return Promise.try(() => {
			return bookshelf.model(model.name).forge({id: itemId}).fetch({require: true});
		}).then((item) => {
			req[`params${model.name}`] = item;
			next();
		}).catch(bookshelf.Model.NotFoundError, (err) => {
			throw new errors.NotFoundError(`No such ${model.name} exists.`);
		}).catch(next);
	}
}